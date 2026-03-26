'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { signInClient, signUpClient } from '@/lib/authService';
import OnboardingFlow from '@/components/OnboardingFlow';
import { countries, type Country } from '@/lib/countries';

type AuthMode = 'signup' | 'signin';
type InputMethod = 'email' | 'phone';
type AuthStep = 'form' | 'confirm-phone' | 'otp' | 'success';

const HuzlyLogo = () => (
  <div className="flex flex-col items-center">
    <img src="/images/logo.png" alt="Huzly" className="h-16 w-auto object-contain" />
  </div>
);

const MethodTabs = ({ method, onChange }: { method: InputMethod; onChange: (m: InputMethod) => void }) => (
  <div className="flex mx-auto w-48 bg-gray-100 rounded-lg p-0.5">
    <button
      onClick={() => onChange('email')}
      className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
        method === 'email' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-gray-400'
      }`}
    >
      Email
    </button>
    <button
      onClick={() => onChange('phone')}
      className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
        method === 'phone' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-gray-400'
      }`}
    >
      Phone
    </button>
  </div>
);

function CountryCodePicker({ selected, onChange }: {
  selected: Country;
  onChange: (c: Country) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = countries.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q);
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(''); }}
        className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 min-w-[90px] hover:bg-gray-100 transition-colors"
      >
        <span className="text-base">{selected.flag}</span>
        <span>{selected.dial}</span>
        <svg className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2A6FC8] focus:border-transparent"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">No countries found</div>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-left ${
                  c.code === selected.code ? 'bg-blue-50 text-[#2A6FC8]' : 'text-gray-700'
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-gray-400 text-xs">{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OtpInput({ length, value, onChange, error }: {
  length: number;
  value: string;
  onChange: (val: string) => void;
  error: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = value.split('');
    arr[idx] = char;
    const newVal = arr.join('').substring(0, length);
    onChange(newVal);
    if (char && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`w-11 h-12 text-center text-lg font-semibold border-2 rounded-xl focus:outline-none transition-colors ${
            error
              ? 'border-red-400 bg-red-50 text-red-600'
              : value[i]
                ? 'border-[#2A6FC8] bg-blue-50 text-[#1E3A5F]'
                : 'border-gray-200 text-gray-900'
          } focus:border-[#2A6FC8]`}
        />
      ))}
    </div>
  );
}

function SuccessScreen({ onContinue, buttonLabel }: { onContinue: () => void; buttonLabel: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white px-8">
      <div className="w-20 h-20 bg-[#2A6FC8]/10 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-[#2A6FC8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[#1E3A5F] mb-2">Success!</h2>
      <p className="text-gray-500 text-sm mb-10">Verification complete</p>
      <button
        onClick={onContinue}
        className="w-full py-3.5 bg-[#2A6FC8] text-white rounded-xl font-semibold text-sm hover:bg-[#2458A3] transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function ConfirmPhoneScreen({ phone, onConfirm, onCancel }: {
  phone: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="h-full w-full flex flex-col bg-white px-6 pt-16">
      <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Please Confirm</h2>
      <p className="text-gray-500 text-sm mb-2">Please confirm your phone number</p>
      <p className="text-[#1E3A5F] font-semibold text-lg mb-8">{phone}</p>
      <button
        onClick={onConfirm}
        className="w-full py-3.5 bg-[#2A6FC8] text-white rounded-xl font-semibold text-sm hover:bg-[#2458A3] transition-colors mb-3"
      >
        Verify my number
      </button>
      <button
        onClick={onCancel}
        className="w-full py-3.5 border border-gray-200 text-gray-500 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

function EnterCodeScreen({ identifier, onVerify, onCancel, onResend }: {
  identifier: string;
  onVerify: (code: string) => void;
  onCancel: () => void;
  onResend: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onVerify(code);
    } catch (err: any) {
      setError(err.message || 'OTP Expired. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCountdown(30);
    setError(null);
    setCode('');
    onResend();
  };

  return (
    <div className="h-full w-full flex flex-col bg-white px-6 pt-12">
      <h2 className="text-2xl font-bold text-[#1E3A5F] mb-2">Enter Code</h2>
      <p className="text-gray-500 text-sm mb-1">
        We sent you the verification code on this {identifier.includes('@') ? 'email' : 'number'}
      </p>
      <p className="text-[#1E3A5F] font-medium text-sm mb-6">{identifier}</p>

      <p className="text-gray-500 text-xs mb-3 text-center">Enter 6 digit OTP</p>
      <OtpInput length={6} value={code} onChange={setCode} error={!!error} />

      {error && (
        <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
      )}

      <div className="flex items-center justify-center mt-4 mb-6">
        <span className="text-xs text-gray-400">
          Get Code in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}{' '}
        </span>
        <button
          onClick={handleResend}
          disabled={countdown > 0}
          className={`text-xs font-semibold ml-1 ${
            countdown > 0 ? 'text-gray-300' : 'text-[#2A6FC8]'
          }`}
        >
          Resend
        </button>
      </div>

      <div className="flex gap-3 mt-auto mb-8">
        <button
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="flex-1 py-3 bg-[#2A6FC8] text-white rounded-xl font-semibold text-sm hover:bg-[#2458A3] transition-colors disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ onNavigateToMessages }: { onNavigateToMessages: () => void }) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [method, setMethod] = useState<InputMethod>('email');
  const [step, setStep] = useState<AuthStep>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [pendingIdentifier, setPendingIdentifier] = useState('');

  const resetForm = useCallback(() => {
    setError(null);
    setStep('form');
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setAgreedToTerms(false);
  }, []);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSignUpEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: signUpError } = await signUpClient({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: 'worker',
      });
      if (signUpError) throw signUpError;

      setPendingIdentifier(email);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await signInClient({ email, password });
      if (signInError) throw signInError;
      if (data?.session) {
        setStep('success');
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    const fullPhone = `${selectedCountry.dial}${phone.replace(/\D/g, '')}`;
    setPendingIdentifier(fullPhone);
    setStep('confirm-phone');
  };

  const handleConfirmPhone = async () => {
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: pendingIdentifier,
      });
      if (otpError) throw otpError;
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (method === 'phone') {
      const { data: verifyData, error } = await supabase.auth.verifyOtp({
        phone: pendingIdentifier,
        token: code,
        type: 'sms',
      });
      if (error) throw error;

      if (mode === 'signup' && verifyData?.user && fullName.trim()) {
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        await supabase.auth.updateUser({
          data: { first_name: firstName, last_name: lastName },
        });
      }
    } else {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingIdentifier,
        token: code,
        type: mode === 'signup' ? 'signup' : 'email',
      });
      if (error) throw error;
    }
    setStep('success');
  };

  const handleResendOtp = async () => {
    try {
      if (method === 'phone') {
        await supabase.auth.signInWithOtp({ phone: pendingIdentifier });
      } else {
        await supabase.auth.resend({
          type: mode === 'signup' ? 'signup' : 'email',
          email: pendingIdentifier,
        });
      }
    } catch {
      // silently handle resend errors
    }
  };

  const handleSuccess = () => {
    if (mode === 'signin') {
      onNavigateToMessages();
    } else {
      switchMode('signin');
    }
  };

  if (step === 'success') {
    return (
      <SuccessScreen
        onContinue={handleSuccess}
        buttonLabel={mode === 'signin' ? 'Continue' : 'Log In'}
      />
    );
  }

  if (step === 'otp') {
    return (
      <EnterCodeScreen
        identifier={pendingIdentifier}
        onVerify={handleVerifyOtp}
        onCancel={() => setStep('form')}
        onResend={handleResendOtp}
      />
    );
  }

  if (step === 'confirm-phone') {
    return (
      <ConfirmPhoneScreen
        phone={pendingIdentifier}
        onConfirm={handleConfirmPhone}
        onCancel={() => setStep('form')}
      />
    );
  }

  // Main form
  return (
    <div className="h-full w-full flex flex-col bg-white">
      <div className="pt-10 pb-4 flex flex-col items-center">
        <HuzlyLogo />
        <h2 className="text-lg font-bold text-[#1E3A5F] mt-3">
          {mode === 'signup' ? 'Sign Up' : 'Log In'}
        </h2>
      </div>

      <div className="px-6 mb-5">
        <MethodTabs method={method} onChange={setMethod} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {mode === 'signup' && method === 'email' && (
          <form className="space-y-4" onSubmit={handleSignUpEmail}>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                placeholder=""
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                placeholder=""
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Create password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                placeholder=""
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Verify password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                placeholder=""
                autoComplete="new-password"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#2A6FC8] focus:ring-[#2A6FC8]"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                I confirm that I have read and agree with the{' '}
                <span className="text-[#2A6FC8] font-medium">Terms & Conditions</span> and{' '}
                <span className="text-[#2A6FC8] font-medium">Privacy Policy</span>
              </span>
            </label>

            {error && (
              <div className="text-red-500 text-xs p-2 bg-red-50 rounded-lg">{error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#2A6FC8] text-white rounded-xl font-semibold text-sm hover:bg-[#2458A3] transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && method === 'phone' && (
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (!fullName.trim()) { setError('Full name is required'); return; }
            if (!phone.trim()) { setError('Phone number is required'); return; }
            if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
            if (!agreedToTerms) { setError('Please agree to the Terms & Conditions'); return; }
            setError(null);
            const fullPhone = `${selectedCountry.dial}${phone.replace(/\D/g, '')}`;
            setPendingIdentifier(fullPhone);
            setStep('confirm-phone');
          }}>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mobile Number</label>
              <div className="flex gap-2">
                <CountryCodePicker selected={selectedCountry} onChange={setSelectedCountry} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                  placeholder="800 456-1998"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Create password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                autoComplete="new-password"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#2A6FC8] focus:ring-[#2A6FC8]"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                I confirm that I have read and agree with the{' '}
                <span className="text-[#2A6FC8] font-medium">Terms & Conditions</span> and{' '}
                <span className="text-[#2A6FC8] font-medium">Privacy Policy</span>
              </span>
            </label>

            {error && (
              <div className="text-red-500 text-xs p-2 bg-red-50 rounded-lg">{error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#2A6FC8] text-white rounded-xl font-semibold text-sm hover:bg-[#2458A3] transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </div>
          </form>
        )}

        {mode === 'signin' && method === 'email' && (
          <form className="space-y-4" onSubmit={handleSignInEmail}>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                placeholder=""
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                placeholder=""
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2A6FC8] focus:ring-[#2A6FC8]"
                />
                <span className="text-xs text-gray-500">Remember Me</span>
              </label>
              <button type="button" className="text-xs text-[#2A6FC8] font-medium">
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="text-red-500 text-xs p-2 bg-red-50 rounded-lg">{error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#2A6FC8] text-white rounded-xl font-semibold text-sm hover:bg-[#2458A3] transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </div>
          </form>
        )}

        {mode === 'signin' && method === 'phone' && (
          <form className="space-y-4" onSubmit={handleSignInPhone}>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mobile Number</label>
              <div className="flex gap-2">
                <CountryCodePicker selected={selectedCountry} onChange={setSelectedCountry} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                  placeholder="800 456-1998"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              We will message you a 6-digit verification code to confirm your identity.
            </p>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2A6FC8] focus:ring-[#2A6FC8]"
                />
                <span className="text-xs text-gray-500">Remember Me</span>
              </label>
              <button type="button" className="text-xs text-[#2A6FC8] font-medium">
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="text-red-500 text-xs p-2 bg-red-50 rounded-lg">{error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#2A6FC8] text-white rounded-xl font-semibold text-sm hover:bg-[#2458A3] transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Sign In'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex justify-center gap-5 mb-4">
            <button className="w-11 h-11 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button className="w-11 h-11 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button className="w-11 h-11 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">
            {mode === 'signup' ? (
              <>Already have an account?{' '}
                <button onClick={() => switchMode('signin')} className="text-[#2A6FC8] font-semibold">Sign In</button>
              </>
            ) : (
              <>Don&apos;t have an account?{' '}
                <button onClick={() => switchMode('signup')} className="text-[#2A6FC8] font-semibold">Sign Up</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then((result: any) => {
      const session = result?.data?.session;
      if (session) {
        router.push('/messages');
      } else {
        setCheckingSession(false);
        const seen = localStorage.getItem('huzly_onboarding_seen');
        if (seen) {
          setShowAuth(true);
        } else {
          setShowOnboarding(true);
        }
      }
    });
  }, [router]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('huzly_onboarding_seen', 'true');
    setShowOnboarding(false);
    setShowAuth(true);
  };

  const handleNavigateToMessages = () => {
    router.push('/messages');
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <img src="/images/logo.png" alt="Huzly" className="h-14 w-auto object-contain" />
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (showAuth) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-white">
        <div className="h-full w-full max-w-md mx-auto">
          <AuthScreen onNavigateToMessages={handleNavigateToMessages} />
        </div>
      </div>
    );
  }

  return null;
}
