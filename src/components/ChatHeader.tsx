'use client';

import { Phone, MoreHorizontal, ChevronLeft, MessageSquare } from 'lucide-react';

interface ChatHeaderProps {
  userName: string;
  isOnline?: boolean;
}

export default function ChatHeader({ userName, isOnline = true }: ChatHeaderProps) {
  return (
    <div className="flex-shrink-0 h-14 border-b border-gray-200 bg-white px-3 flex items-center">
      <div className="w-10 flex items-center">
        <button className="p-2 rounded-full text-[#475569] hover:bg-[#F1F5F9] transition-colors" title="Back" type="button">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 text-center">
        <div className="flex flex-col items-center">
          <p className="font-semibold text-[var(--neutral-700)] leading-tight truncate">{userName}</p>
          <p className="text-xs text-[var(--neutral-500)] leading-tight">{isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </div>

      <div className="w-10 flex items-center justify-end">
        <button className="p-2 rounded-full text-[var(--huzly-500)] hover:bg-neutral-100 transition-colors" title="Message" type="button">
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
