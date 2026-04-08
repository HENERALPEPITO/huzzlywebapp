'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import OnboardingFlow from '@/components/OnboardingFlow';
import type { OnboardingScreen } from '@/components/OnboardingFlow';
import {
  EMPLOYER_ONBOARDING_PREFILL_KEY,
  type EmployerOnboardingPrefill,
} from '@/lib/employerSignupConstants';
import { isOnboardingCompleted } from '@/lib/onboardingService';

type InitState = {
  screen: OnboardingScreen;
  prefill: EmployerOnboardingPrefill | null;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [init, setInit] = useState<InitState | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user?.id) {
        router.replace('/');
        return;
      }
      if (await isOnboardingCompleted(session.user.id)) {
        router.replace('/messages');
        return;
      }

      try {
        const raw = sessionStorage.getItem(EMPLOYER_ONBOARDING_PREFILL_KEY);
        if (raw) {
          const prefill = JSON.parse(raw) as EmployerOnboardingPrefill;
          sessionStorage.removeItem(EMPLOYER_ONBOARDING_PREFILL_KEY);
          if (!cancelled) setInit({ screen: 'facility_setup', prefill });
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setInit({ screen: 'loading', prefill: null });
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!init) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ecf1f9]">
        <img src="/images/logo.png" alt="Huzly" className="h-12 w-auto opacity-60 animate-pulse" />
      </div>
    );
  }

  return (
    <OnboardingFlow
      initialScreen={init.screen}
      employerPrefill={init.prefill}
      onComplete={() => {
        router.replace('/messages');
      }}
    />
  );
}
