'use client';

import { useState, useEffect } from 'react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

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
            <div key={i} className="w-2 h-2 rounded-full bg-[#2A6FC8]" />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-48 opacity-10">
        <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,100 Q100,20 200,80 T400,60 L400,200 L0,200 Z" fill="#2A6FC8" />
        </svg>
      </div>

      <div className="absolute left-0 top-1/4 w-32 h-40 opacity-15 rounded-r-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-[#2A6FC8] to-[#1E3A5F] rounded-r-full" />
      </div>

      <div className="flex flex-col items-center z-10">
        <img src="/images/huzly-logo.png" alt="Huzly" className="h-20 w-auto object-contain" />
      </div>

      <div className="absolute bottom-16 flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[#2A6FC8] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#2A6FC8] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#2A6FC8] animate-bounce" style={{ animationDelay: '300ms' }} />
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
      <div className="relative h-[45%] bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] flex items-center justify-center overflow-hidden">
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
          <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">{title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{description}</p>
        </div>

        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-[#2A6FC8]' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="w-full flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 py-3.5 bg-[#2A6FC8] text-white rounded-xl font-semibold text-sm hover:bg-[#2458A3] transition-colors"
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
      <div className="relative h-[45%] bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] flex items-center justify-center overflow-hidden">
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
          <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Welcome</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            A smarter platform where employers and skilled workers connect, collaborate, and grow together.
          </p>
        </div>

        <div className="flex gap-1.5 mb-2">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-200" />
          <div className="h-1.5 w-1.5 rounded-full bg-gray-200" />
          <div className="h-1.5 w-6 rounded-full bg-[#2A6FC8]" />
        </div>

        <button
          onClick={onGetStarted}
          className="w-full py-3.5 bg-[#2A6FC8] text-white rounded-xl font-semibold text-sm hover:bg-[#2458A3] transition-colors"
        >
          Let&apos;s get started
        </button>
      </div>
    </div>
  );
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    'loading',
    'worker',
    'employer',
    'welcome',
  ];

  const goNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };

  const skipToEnd = () => {
    onComplete();
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="h-full w-full max-w-md mx-auto relative">
        {screens[currentScreen] === 'loading' && (
          <LoadingScreen onNext={goNext} />
        )}
        {screens[currentScreen] === 'worker' && (
          <SplashScreen
            title="Apply as Worker"
            description="Empowering skilled workers to connect, earn, and grow through smarter job matching."
            icon={
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            }
            onContinue={goNext}
            onSkip={skipToEnd}
            step={0}
            totalSteps={3}
          />
        )}
        {screens[currentScreen] === 'employer' && (
          <SplashScreen
            title="Join as Employer"
            description="Find reliable, skilled workers quickly and manage hiring with confidence—all in one platform."
            icon={
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            }
            onContinue={goNext}
            onSkip={skipToEnd}
            step={1}
            totalSteps={3}
          />
        )}
        {screens[currentScreen] === 'welcome' && (
          <WelcomeScreen onGetStarted={goNext} />
        )}
      </div>
    </div>
  );
}
