'use client';

import {
  Search,
  LayoutGrid,
  Settings,
  Calendar,
  ClipboardList,
  Bell,
  LogOut,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMessageNotifications } from '@/context/MessageNotificationsContext';

interface LeftSidebarProps {
  onLogout?: () => void;
}

const navItems = [
  { icon: LayoutGrid, label: 'Dashboard' },
  { icon: Settings, label: 'Settings' },
  { icon: Calendar, label: 'Calendar', href: '/schedule' as const },
  { icon: ClipboardList, label: 'Tasks' },
  { icon: Bell, label: 'Notifications' },
];

const mobileNavItems = [
  { icon: LayoutGrid, label: 'Dashboard' },
  { icon: Sparkles, label: 'Onboarding', href: '/onboarding' as const },
  { icon: MessageSquare, label: 'Messages', href: '/messages' as const },
  { icon: Calendar, label: 'Calendar', href: '/schedule' as const },
  { icon: Bell, label: 'Notifications' },
  { icon: Settings, label: 'Settings' },
];

export default function LeftSidebar({ onLogout }: LeftSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { openNotificationSettings } = useMessageNotifications();

  const openNotifSettings = (index: number) => {
    setActiveIndex(index);
    openNotificationSettings();
  };

  return (
    <>
      <aside
        className="hidden md:flex flex-col items-center py-5 h-full flex-shrink-0"
        style={{
          width: '64px',
          background: 'linear-gradient(180deg, #122036 0%, #2A4A7C 100%)',
        }}
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
          <img src="/images/logo.png" alt="Huzzly" className="w-10 h-10 object-contain" />
        </div>

        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors mb-6"
          title="Search"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>

        <button
          type="button"
          onClick={() => router.push('/onboarding')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors mb-2 ${
            pathname === '/onboarding'
              ? 'bg-white/15 text-white'
              : 'text-white/50 hover:text-white/80 hover:bg-white/8'
          }`}
          title="Onboarding"
        >
          <Sparkles className="w-[18px] h-[18px]" />
        </button>

        <nav className="flex-1 flex flex-col items-center gap-2">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const href = 'href' in item ? item.href : undefined;
            const isActive = href ? pathname === href : activeIndex === i;
            return (
              <button
                key={i}
                onClick={() => {
                  if (href) {
                    router.push(href);
                    return;
                  }
                  if (item.label === 'Settings' || item.label === 'Notifications') {
                    openNotifSettings(i);
                  } else {
                    setActiveIndex(i);
                  }
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/8'
                }`}
                title={item.label}
              >
                <Icon className="w-[18px] h-[18px]" />
              </button>
            );
          })}
        </nav>

        <button
          onClick={onLogout}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors mt-4"
          title="Logout"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </aside>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 safe-area-bottom"
        style={{
          background: 'linear-gradient(180deg, #122036 0%, #2A4A7C 100%)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          paddingTop: '8px',
        }}
      >
        {mobileNavItems.map((item, i) => {
          const Icon = item.icon;
          const href = 'href' in item ? item.href : undefined;
          const isActive =
            (href && pathname === href) ||
            (!href && item.label === 'Messages' && pathname === '/messages');
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (href) {
                  router.push(href);
                  return;
                }
                if (item.label === 'Notifications' || item.label === 'Settings') {
                  openNotifSettings(i);
                }
              }}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-0 flex-1 ${
                isActive ? 'text-white' : 'text-white/50'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-medium text-center leading-tight truncate w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
