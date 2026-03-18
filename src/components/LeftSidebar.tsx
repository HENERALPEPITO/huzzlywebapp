'use client';

import { Search, LayoutGrid, Settings, Calendar, ClipboardList, Bell, LogOut } from 'lucide-react';
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

export default function LeftSidebar({ onLogout }: LeftSidebarProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <aside
      className="flex flex-col items-center py-5 h-full"
      style={{
        width: '64px',
        background: 'linear-gradient(180deg, #1E3A5F 0%, #162D4A 100%)',
      }}
    >
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
        <span className="text-white font-bold text-xl">H</span>
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
  );
}
