'use client';

import { Phone, Video, MoreHorizontal } from 'lucide-react';

interface ChatHeaderProps {
  userName: string;
  isOnline?: boolean;
}

const memberColors = ['#E8D5B7', '#D4E8D1', '#D1D8E8'];

export default function ChatHeader({ userName }: ChatHeaderProps) {
  return (
    <div className="h-14 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {memberColors.map((color, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
              style={{ backgroundColor: color, zIndex: 3 - i }}
            />
          ))}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{userName}</p>
        </div>
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
