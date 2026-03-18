'use client';

import { Phone, Video, MoreHorizontal } from 'lucide-react';

interface ChatHeaderProps {
  userName: string;
  isOnline?: boolean;
}

export default function ChatHeader({ userName }: ChatHeaderProps) {
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="h-14 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600"
          style={{ backgroundColor: '#E8D5B7' }}
        >
          {initial}
        </div>
        <p className="text-sm font-semibold text-gray-800">{userName}</p>
      </div>

      <div className="flex items-center gap-1">
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <Phone className="w-[18px] h-[18px]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <Video className="w-[18px] h-[18px]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <MoreHorizontal className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}
