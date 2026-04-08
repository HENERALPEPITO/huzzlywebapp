'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LeftSidebar from '@/components/LeftSidebar';
import ScheduleView from '@/components/schedule/ScheduleView';
import { supabase } from '@/lib/supabaseClient';
import { isOnboardingCompleted } from '@/lib/onboardingService';

export default function SchedulePage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (!session) {
          router.push('/');
          return;
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const onboardingDone = await isOnboardingCompleted(user.id);
        if (!isMounted) return;
        if (!onboardingDone) {
          router.replace('/onboarding');
          return;
        }
      } catch (error) {
        console.error('[SchedulePage] Auth check error:', error);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    };

    const timeout = setTimeout(() => {
      if (isMounted) setIsAuthChecking(false);
    }, 5000);

    checkAuth();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A5F] flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden w-full bg-[#F8F9FB]">
      <LeftSidebar onLogout={handleLogout} />
      <div className="flex-1 min-w-0 overflow-hidden pb-14 md:pb-0">
        <ScheduleView />
      </div>
    </div>
  );
}
