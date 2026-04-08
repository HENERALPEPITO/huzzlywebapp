'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import {
  saveOnboardingPersonal,
  saveOnboardingBusiness,
  saveOnboardingBilling,
  formatPersistError,
} from '@/lib/onboardingService';
import type { EmployerOnboardingPrefill } from '@/lib/employerSignupConstants';
import EmployerWebSetupFlow from '@/components/EmployerWebSetupFlow';

export type OnboardingScreen = 'loading' | 'employer' | 'welcome' | 'facility_setup';

interface OnboardingFlowProps {
  onComplete: () => void;
  /** Start at facility wizard (e.g. after employer email/phone OTP). */
  initialScreen?: OnboardingScreen | null;
  employerPrefill?: EmployerOnboardingPrefill | null;
}

const BRAND = '#4473C0';
const BRAND_NAVY = '#1E3559';

const BUSINESS_TYPES = [
  'LLC',
  'Corporation',
  'Sole Proprietorship',
  'Partnership',
  'Non-profit',
  'Other',
] as const;

type SetupStep = 0 | 1 | 2;

function OnboardingBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 backdrop-blur-[5px]"
        style={{
          background:
            'radial-gradient(ellipse 72% 52% at 50% 50%, rgba(68,115,192,0.95) 0%, rgba(55,95,158,0.92) 50%, rgba(42,74,124,0.9) 100%), #ecf1f9',
        }}
      />
    </div>
  );
}

function StepDivider() {
  return <div className="h-4 w-full shrink-0 border-b border-[#e5e7eb] bg-white" />;
}

function StepIndicator({
  activeIndex,
}: {
  activeIndex: SetupStep;
}) {
  const segments: { n: string; title: string }[] = [
    { n: '1.', title: 'Personal Info' },
    { n: '2.', title: 'Business Info' },
    { n: '3.', title: 'Billing Info' },
  ];

  return (
    <div className="flex gap-1 pb-6 pt-3 px-6 w-full">
      {segments.map((seg, i) => {
        const completed = i < activeIndex;
        const active = i === activeIndex;
        const barOn = completed || active;
        const labelBold = active;
        return (
          <div key={seg.title} className="flex min-w-0 flex-1 flex-col gap-2">
            <div
              className="h-2 w-full rounded-sm transition-colors"
              style={{ backgroundColor: barOn ? BRAND : '#e5e7eb' }}
            />
            <div
              className={`flex flex-wrap items-center gap-1 text-sm leading-5 ${
                labelBold ? 'font-semibold' : 'font-normal'
              }`}
            >
              <span style={{ color: BRAND }} className="whitespace-nowrap">
                Step {seg.n.replace('.', '')}
                {seg.n.endsWith('.') ? '.' : ''}
              </span>
              <span className="text-gray-800 truncate">{seg.title}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm text-[#64748b]">
      {children}
      {required && <span className="text-[#e11d48]"> *</span>}
    </label>
  );
}

const inputClass =
  'w-full h-14 rounded-lg border border-[#94a3b8] bg-white px-2.5 text-base text-gray-900 placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4473c0]/30 focus:border-[#4473c0]';

function LoadingScreen({ onNext }: { onNext: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onNext, 2500);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white relative overflow-hidden">
      <div className="absolute top-12 right-8 opacity-20">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#4473C0]" />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-48 opacity-10">
        <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,100 Q100,20 200,80 T400,60 L400,200 L0,200 Z" fill="#4473C0" />
        </svg>
      </div>

      <div className="absolute left-0 top-1/4 w-32 h-40 opacity-15 rounded-r-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-[#4473C0] to-[#1E3559] rounded-r-full" />
      </div>

      <div className="flex flex-col items-center z-10">
        <img src="/images/huzly-logo.png" alt="Huzly" className="h-20 w-auto object-contain" />
      </div>

      <div className="absolute bottom-16 flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[#4473C0] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#4473C0] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#4473C0] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function SplashScreen({
  title,
  description,
  icon,
  onContinue,
  onSkip,
  step,
  totalSteps,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onContinue: () => void;
  onSkip: () => void;
  step: number;
  totalSteps: number;
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="relative h-[45%] bg-gradient-to-br from-[#4473C0] to-[#2a4a7c] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 400" className="w-full h-full" preserveAspectRatio="none">
            <circle cx="300" cy="50" r="120" fill="white" />
            <circle cx="80" cy="350" r="80" fill="white" />
          </svg>
        </div>
        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 border border-white/30">
          {icon}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: BRAND_NAVY }}>
            {title}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{description}</p>
        </div>

        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-[#4473C0]' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="w-full flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 py-3.5 text-white rounded-xl font-semibold text-sm transition-colors hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Continue
          </button>
          <button
            onClick={onSkip}
            className="flex-1 py-3.5 border-2 border-gray-200 text-gray-500 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="relative h-[45%] bg-gradient-to-br from-[#4473C0] to-[#2a4a7c] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 400" className="w-full h-full" preserveAspectRatio="none">
            <circle cx="300" cy="50" r="120" fill="white" />
            <circle cx="80" cy="350" r="80" fill="white" />
          </svg>
        </div>
        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 border border-white/30">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: BRAND_NAVY }}>
            Welcome
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            A smarter platform where employers and skilled workers connect, collaborate, and grow together.
          </p>
        </div>

        <div className="flex gap-1.5 mb-2">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-200" />
          <div className="h-1.5 w-6 rounded-full bg-[#4473C0]" />
        </div>

        <button
          onClick={onGetStarted}
          className="w-full py-3.5 text-white rounded-xl font-semibold text-sm transition-colors hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          Let&apos;s get started
        </button>
      </div>
    </div>
  );
}

function StorefrontIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0018 9.35v11.65m-9-6h.008v.008H9V15zm3 0h.008v.008H12V15zm3 0h.008v.008H15V15z"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function StripeMark() {
  return (
    <div className="flex h-6 w-[35px] shrink-0 items-center justify-center rounded border border-[#d9d9d9] bg-white text-[10px] font-bold tracking-tight text-[#635bff]">
      S
    </div>
  );
}

function VisaMark() {
  return (
    <div className="flex h-6 w-[35px] shrink-0 items-center justify-center rounded border border-[#d9d9d9] bg-white text-[9px] font-bold italic text-[#1a1f71]">
      VISA
    </div>
  );
}

function FacilitySetupWizard({
  onComplete,
  onEmployerWebFlowStart,
  deferEmployerBillingCompletion,
  userId,
  employerPrefill,
}: {
  onComplete: () => void;
  /** After billing, show Figma employer web steps (org / location / manager / summary) before `onComplete`. */
  onEmployerWebFlowStart?: () => void;
  deferEmployerBillingCompletion?: boolean;
  userId: string | null;
  employerPrefill?: EmployerOnboardingPrefill | null;
}) {
  const [step, setStep] = useState<SetupStep>(0);
  const [payment, setPayment] = useState<'stripe' | 'card' | 'ach' | null>(null);
  const [saving, setSaving] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!employerPrefill) return;
    if (employerPrefill.firstName) setFirstName(employerPrefill.firstName);
    if (employerPrefill.lastName) setLastName(employerPrefill.lastName);
    if (employerPrefill.email) setEmail(employerPrefill.email);
    if (employerPrefill.phone) setPhone(employerPrefill.phone);
  }, [employerPrefill]);

  /** Canonical email lives on the Supabase Auth user — fill the field if prefill/storage missed it. */
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (cancelled) return;
      const authEmail = data.user?.email?.trim();
      if (authEmail) {
        setEmail((prev) => (prev.trim() ? prev : authEmail));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [ein, setEin] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const docsInputRef = useRef<HTMLInputElement>(null);

  const persistMsg =
    userId == null
      ? 'Sign in and open Onboarding from Messages to save your answers to your account.'
      : null;

  const handleStep1Continue = useCallback(async () => {
    setPersistError(null);
    if (userId) {
      if (!firstName.trim() || !email.trim()) {
        setPersistError('Please fill in first name and business email.');
        return;
      }
      setSaving(true);
      try {
        await saveOnboardingPersonal(userId, {
          firstName,
          lastName,
          email,
          phone,
        });
        setStep(1);
      } catch (e: unknown) {
        setPersistError(formatPersistError(e));
      } finally {
        setSaving(false);
      }
      return;
    }
    setStep(1);
  }, [userId, firstName, lastName, email, phone]);

  const handleStep2Continue = useCallback(async () => {
    setPersistError(null);
    if (userId) {
      if (!companyName.trim() || !businessType || !city.trim() || !state.trim() || !zip.trim()) {
        setPersistError('Please fill in company name, business type, city, state, and zip.');
        return;
      }
      setSaving(true);
      try {
        await saveOnboardingBusiness(
          userId,
          {
            companyName,
            businessType,
            city,
            state,
            zip,
            ein,
          },
          { logo: logoFile, doc: docFile },
        );
        setStep(2);
      } catch (e: unknown) {
        setPersistError(formatPersistError(e));
      } finally {
        setSaving(false);
      }
      return;
    }
    setStep(2);
  }, [userId, companyName, businessType, city, state, zip, ein, logoFile, docFile]);

  const finishBilling = useCallback(
    async (opts: { skipped: boolean }) => {
      setPersistError(null);
      if (!opts.skipped && !payment) {
        setPersistError('Choose a payment method or use Skip for now.');
        return;
      }
      if (userId) {
        setSaving(true);
        try {
          const defer =
            Boolean(deferEmployerBillingCompletion && onEmployerWebFlowStart);
          await saveOnboardingBilling(userId, {
            payment: opts.skipped ? null : payment,
            skipped: opts.skipped,
            deferEmployerCompletion: defer,
          });
          if (defer && onEmployerWebFlowStart) {
            onEmployerWebFlowStart();
          } else {
            onComplete();
          }
        } catch (e: unknown) {
          setPersistError(formatPersistError(e));
        } finally {
          setSaving(false);
        }
        return;
      }
      onComplete();
    },
    [
      userId,
      payment,
      onComplete,
      deferEmployerBillingCompletion,
      onEmployerWebFlowStart,
    ],
  );

  const stepTitles = ['Step 1. Personal Info', 'Step 2. Business Info', 'Step 3. Billing Info'] as const;

  const cardShadow =
    'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] sm:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]';

  const primaryBtn =
    'h-11 w-[150px] rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40';
  const secondaryBtn =
    'h-11 w-[150px] rounded-lg border border-[#e2e8f0] bg-white font-semibold text-sm text-[#475569] hover:bg-gray-50';

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
      <OnboardingBackdrop />
      <div
        className={`relative z-10 w-full max-w-[800px] rounded-[20px] border border-[#e5e7eb] bg-white ${cardShadow}`}
      >
        <div className="px-6 pt-5 pb-3.5">
          <h2
            className={`text-2xl font-semibold leading-8 ${step === 2 ? 'text-center' : ''}`}
            style={{ color: BRAND_NAVY }}
          >
            {stepTitles[step]}
          </h2>
        </div>
        <StepDivider />
        <StepIndicator activeIndex={step} />

        {persistMsg && (
          <p className="mx-6 mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 border border-amber-200">
            {persistMsg}
          </p>
        )}
        {persistError && (
          <p className="mx-6 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
            {persistError}
          </p>
        )}

        {step === 0 && (
          <div className="flex flex-col gap-5 px-6 pb-6">
            <p className="text-sm text-black">Welcome to Huzly! Get started by following these 3 easy steps.</p>
            {phone.trim() && !email.trim() && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                You signed up with phone — add your business email below (required to save your profile).
              </p>
            )}
            <div className="flex flex-col gap-8">
              <h3 className="text-lg font-semibold leading-7" style={{ color: BRAND_NAVY }}>
                Step 1. Personal Info
              </h3>
              <div className="flex flex-col gap-7">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>First Name</FieldLabel>
                    <input
                      className={inputClass}
                      placeholder="Your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Last Name</FieldLabel>
                    <input
                      className={inputClass}
                      placeholder="Your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>Email</FieldLabel>
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="Business email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Phone (optional)</FieldLabel>
                    <input
                      type="tel"
                      className={inputClass}
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={secondaryBtn} onClick={onComplete} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                className={primaryBtn}
                style={{ backgroundColor: BRAND }}
                onClick={handleStep1Continue}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save & Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6 px-6 pb-6">
            <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ecf1f9] p-2">
                <StorefrontIcon />
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 w-fit"
                >
                  Upload Logo
                </button>
                {logoFile && <span className="text-xs text-gray-500 truncate max-w-[200px]">{logoFile.name}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Company Name</FieldLabel>
                <input
                  className={inputClass}
                  placeholder="Company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Business Type</FieldLabel>
                <div className="relative">
                  <select
                    className={`${inputClass} appearance-none pr-10`}
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  >
                    <option value="">Select</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel required>City</FieldLabel>
                  <input className={inputClass} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel required>State</FieldLabel>
                  <input
                    className={inputClass}
                    placeholder="NC, SC, or VA"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Stored as NC, SC, or VA to match your database.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel required>Zip Code</FieldLabel>
                  <input className={inputClass} placeholder="Zip" value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>EIN Number</FieldLabel>
                  <input className={inputClass} placeholder="EIN" value={ein} onChange={(e) => setEin(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Upload Docs</FieldLabel>
                  <input
                    ref={docsInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  />
                  <div className="flex min-h-[62px] items-center gap-2 rounded-xl border border-[#1849d6] bg-[#fafafa] p-4">
                    <p className="min-w-0 flex-1 text-sm text-[#4b5563]">
                      {docFile ? docFile.name : 'Upload a file or drag and drop here'}
                    </p>
                    <button
                      type="button"
                      onClick={() => docsInputRef.current?.click()}
                      className="shrink-0 rounded-lg bg-[#0062ff] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryBtn} onClick={() => setStep(0)} disabled={saving}>
                Back
              </button>
              <button
                type="button"
                className={primaryBtn}
                style={{ backgroundColor: BRAND }}
                onClick={handleStep2Continue}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save & Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 px-6 pb-6">
            <p className="text-sm text-black">Please select your preferred payment method.</p>
            <div className="flex flex-col gap-6">
              {(
                [
                  { id: 'stripe' as const, title: 'Stripe Account', mark: <StripeMark /> },
                  { id: 'card' as const, title: 'Debit Card', mark: <VisaMark /> },
                  {
                    id: 'ach' as const,
                    title: 'ACH Bank Account',
                    mark: (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center text-[#4473c0]">
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4 10v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10H4zm13-8H7c-1.1 0-2 .9-2 2v4h14V4c0-1.1-.9-2-2-2z" />
                        </svg>
                      </div>
                    ),
                  },
                ] as const
              ).map((row) => (
                <div key={row.id} className="flex flex-col gap-3">
                  <h4 className="text-sm font-semibold text-[#1e293b]">{row.title}</h4>
                  <button
                    type="button"
                    onClick={() => setPayment(row.id)}
                    className={`flex w-full items-center justify-between rounded-[10px] border px-[15px] py-5 text-left transition-colors ${
                      payment === row.id
                        ? 'border-[#4473c0] bg-blue-50/50'
                        : row.id === 'card'
                          ? 'border-[#aabee1] bg-white'
                          : 'border-[#e2e8f0] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {row.mark}
                      <span className="text-sm text-[#475569]">XXXX-XXXX-XXXX-XXXX</span>
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e2e8f0] p-1">
                      <ChevronRightIcon />
                    </div>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => finishBilling({ skipped: true })}
                disabled={saving}
                className="text-left text-sm text-[#4b5563] hover:underline disabled:opacity-50"
              >
                <span className="font-semibold">Skip</span>
                <span> for now and add later</span>
              </button>
              <div className="flex justify-end gap-2">
                <button type="button" className={secondaryBtn} onClick={() => setStep(1)} disabled={saving}>
                  Back
                </button>
                <button
                  type="button"
                  className={primaryBtn}
                  style={{ backgroundColor: BRAND }}
                  onClick={() => finishBilling({ skipped: false })}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save & Continue'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingFlow({
  onComplete,
  initialScreen = null,
  employerPrefill = null,
}: OnboardingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>(
    () => initialScreen ?? 'loading',
  );
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [employerWebActive, setEmployerWebActive] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setAuthUserId(data.session?.user?.id ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setAuthUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUserId) {
      setProfileRole(null);
      return;
    }
    supabase
      .from('users')
      .select('role')
      .eq('id', authUserId)
      .maybeSingle()
      .then(({ data }: { data: { role: string } | null }) => {
        setProfileRole(data?.role ?? null);
      });
  }, [authUserId]);

  const goNext = async () => {
    setFlowError(null);
    const order: OnboardingScreen[] = ['loading', 'employer', 'welcome', 'facility_setup'];
    const i = order.indexOf(currentScreen);

    if (currentScreen === 'loading') {
      setCurrentScreen('employer');
      return;
    }

    if (i < order.length - 1) {
      setCurrentScreen(order[i + 1]);
    } else {
      onComplete();
    }
  };

  const skipToEnd = () => {
    onComplete();
  };

  if (employerWebActive && authUserId) {
    return (
      <EmployerWebSetupFlow
        userId={authUserId}
        onFinished={() => {
          setEmployerWebActive(false);
          onComplete();
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#ecf1f9]">
      <div className="h-full w-full max-w-md mx-auto relative bg-white sm:max-w-none sm:bg-transparent">
        {flowError && (
          <div className="absolute top-0 left-0 right-0 z-50 px-4 pt-4 sm:pt-6">
            <p className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {flowError}
            </p>
          </div>
        )}
        {currentScreen === 'loading' && <LoadingScreen onNext={goNext} />}
        {currentScreen === 'employer' && (
          <SplashScreen
            title="Join as Employer"
            description="Find reliable, skilled workers quickly and manage hiring with confidence—all in one platform."
            icon={
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            }
            onContinue={goNext}
            onSkip={skipToEnd}
            step={0}
            totalSteps={2}
          />
        )}
        {currentScreen === 'welcome' && <WelcomeScreen onGetStarted={goNext} />}
        {currentScreen === 'facility_setup' && (
          <FacilitySetupWizard
            userId={authUserId}
            employerPrefill={employerPrefill}
            onComplete={onComplete}
            deferEmployerBillingCompletion={profileRole === 'Client'}
            onEmployerWebFlowStart={() => setEmployerWebActive(true)}
          />
        )}
      </div>
    </div>
  );
}
