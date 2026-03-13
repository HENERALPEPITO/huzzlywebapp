'use client';

import { Home, Users, Calendar, MessageCircle, Settings, Bell, LogOut } from 'lucide-react';

export default function LeftSidebar() {
  const icons = [Home, Users, Calendar, MessageCircle, Settings, Bell];

  return (
    <aside className="w-20 flex-shrink-0 flex flex-col items-center py-6" style={{ background: 'linear-gradient(180deg,#243F63 0%, #1F3556 100%)' }}>
      <div className="text-white font-bold text-2xl mb-6">H</div>

      <nav className="flex-1 flex flex-col items-center gap-4">
        {icons.map((Icon, i) => (
          <button key={i} className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors">
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </nav>

      <div className="mt-6">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
