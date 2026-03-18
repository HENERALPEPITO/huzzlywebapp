'use client';

import { Search, LayoutGrid, Settings, Calendar, ClipboardList, Bell, LogOut, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface LeftSidebarProps {
  onLogout?: () => void;
}

const navItems = [
  { icon: LayoutGrid, label: 'Dashboard' },
  { icon: Settings, label: 'Settings' },
  { icon: Calendar, label: 'Calendar' },
  { icon: ClipboardList, label: 'Tasks' },
  { icon: Bell, label: 'Notifications' },
];

const mobileNavItems = [
  { icon: LayoutGrid, label: 'Dashboard' },
  { icon: MessageSquare, label: 'Messages' },
  { icon: Calendar, label: 'Calendar' },
  { icon: Bell, label: 'Notifications' },
  { icon: Settings, label: 'Settings' },
];

export default function LeftSidebar({ onLogout }: LeftSidebarProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

        <nav className="flex-1 flex flex-col items-center gap-2">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeIndex === i;
            return (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
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
          const isActive = i === 1;
          return (
            <button
              key={i}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-white' : 'text-white/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
