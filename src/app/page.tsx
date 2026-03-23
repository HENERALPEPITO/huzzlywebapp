'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { signInClient, signUpClient } from '@/lib/authService';
import OnboardingFlow from '@/components/OnboardingFlow';

type AuthTab = 'signup' | 'signin';
type UserRole = 'worker' | 'employer';

function AuthScreen({ onNavigateToMessages }: { onNavigateToMessages: () => void }) {
  const [activeTab, setActiveTab] = useState<AuthTab>('signup');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'signin') {
        const { data, error } = await signInClient({ email, password });
        if (error) throw error;
        if (data?.session) {
          onNavigateToMessages();
        }
      } else {
        const { data, error } = await signUpClient({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          company_name: selectedRole === 'employer' ? companyName : undefined,
          role: selectedRole || 'worker',
        });
        if (error) throw error;

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          onNavigateToMessages();
        } else {
          setError('Account created! Please check your email to verify before logging in.');
          setActiveTab('signin');
          setSelectedRole(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = (showBackButton: boolean, title: string) => (
    <div className="h-full w-full flex flex-col bg-white">
      <div className="pt-12 pb-6 px-6 flex items-center">
        {showBackButton ? (
          <button onClick={handleBack} className="p-2 -ml-2 text-[#1E3A5F]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        ) : (
          <div className="w-10" />
        )}
        <h2 className="flex-1 text-center text-xl font-bold text-[#1E3A5F] pr-10">
          {title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {activeTab === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                  placeholder="Enter your last name"
                />
              </div>
              {selectedRole === 'employer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
                    placeholder="Enter your company name"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A6FC8] focus:border-transparent"
              placeholder="Enter your password"
              autoComplete={activeTab === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#2A6FC8] text-white rounded-xl font-semibold text-sm hover:bg-[#2458A3] transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (activeTab === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {activeTab === 'signin' && (
          <p className="text-center text-sm text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <button onClick={() => { setActiveTab('signup'); setSelectedRole(null); setError(null); }} className="text-[#2A6FC8] font-semibold">
              Sign Up
            </button>
          </p>
        )}
      </div>
    </div>
  );

  if (activeTab === 'signin' && !selectedRole) {
    return renderForm(false, 'Sign In');
  }

  if (selectedRole) {
    return renderForm(true, `Sign Up as ${selectedRole === 'worker' ? 'Worker' : 'Employer'}`);
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
      <div className="pt-14 pb-6 flex flex-col items-center">
        <div className="w-12 h-12 mb-2">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="20" height="14" rx="3" fill="#1E3A5F" />
            <rect y="17" width="20" height="14" rx="3" fill="#2A6FC8" />
            <rect y="34" width="20" height="14" rx="3" fill="#1E3A5F" />
            <rect x="24" width="24" height="14" rx="3" fill="#2A6FC8" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">
          <span className="text-[#2A6FC8]">H</span>uzl<span className="text-[#2A6FC8]">y</span>
        </h1>
      </div>

      <div className="flex mx-8 bg-gray-100 rounded-xl p-1 mb-8">
        <button
          onClick={() => { setActiveTab('signup'); setSelectedRole(null); setError(null); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'signup'
              ? 'bg-white text-[#1E3A5F] shadow-sm'
              : 'text-gray-400'
          }`}
        >
          Sign Up
        </button>
        <button
          onClick={() => { setActiveTab('signin'); setSelectedRole(null); setError(null); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'signin'
              ? 'bg-white text-[#1E3A5F] shadow-sm'
              : 'text-gray-400'
          }`}
        >
          Sign In
        </button>
      </div>

      <div className="flex-1 flex flex-col px-8">
        <div className="space-y-4 mb-8">
          <button
            onClick={() => handleRoleSelect('worker')}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-[#2A6FC8] hover:bg-blue-50/30 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <svg className="w-6 h-6 text-[#2A6FC8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="text-[#1E3A5F] font-semibold text-sm">Sign-up as Worker</span>
            <svg className="w-5 h-5 text-gray-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            onClick={() => handleRoleSelect('employer')}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-[#2A6FC8] hover:bg-blue-50/30 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <svg className="w-6 h-6 text-[#2A6FC8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <span className="text-[#1E3A5F] font-semibold text-sm">Sign-up as Employer</span>
            <svg className="w-5 h-5 text-gray-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="mt-auto pb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex justify-center gap-6 mb-6">
            <button className="w-12 h-12 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button className="w-12 h-12 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button className="w-12 h-12 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </button>
          </div>

          <p className="text-center text-sm text-gray-400">
            {activeTab === 'signup' ? (
              <>Already have an account?{' '}
                <button onClick={() => { setActiveTab('signin'); setError(null); }} className="text-[#2A6FC8] font-semibold">
                  Sign In
                </button>
              </>
            ) : (
              <>Don&apos;t have an account?{' '}
                <button onClick={() => { setActiveTab('signup'); setError(null); }} className="text-[#2A6FC8] font-semibold">
                  Sign Up
                </button>
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
          <div className="w-12 h-12">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="20" height="14" rx="3" fill="#1E3A5F" />
              <rect y="17" width="20" height="14" rx="3" fill="#2A6FC8" />
              <rect y="34" width="20" height="14" rx="3" fill="#1E3A5F" />
              <rect x="24" width="24" height="14" rx="3" fill="#2A6FC8" />
            </svg>
          </div>
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
