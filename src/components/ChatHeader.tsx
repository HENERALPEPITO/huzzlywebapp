'use client';

import { Phone, Video, MoreHorizontal } from 'lucide-react';

interface ChatHeaderProps {
  userName: string;
  isOnline?: boolean;
}

export default function ChatHeader({ userName, isOnline = true }: ChatHeaderProps) {
  return (
    <div className="h-16 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#F0F2F5] flex items-center justify-center text-[#111827] font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          {isOnline ? (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          ) : null}
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-[#111827] leading-tight truncate">{userName}</p>
          <p className="text-xs text-[#8A8D91] leading-tight">{isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-full text-[#0084FF] hover:bg-[#F0F2F5] transition-colors"
          title="Call"
          type="button"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-full text-[#0084FF] hover:bg-[#F0F2F5] transition-colors"
          title="Video"
          type="button"
        >
          <Video className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-full text-[#111827] hover:bg-[#F0F2F5] transition-colors"
          title="Menu"
          type="button"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
