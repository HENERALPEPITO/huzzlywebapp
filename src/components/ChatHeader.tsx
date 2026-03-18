'use client';

import { Phone, Video, MoreHorizontal, ArrowLeft, User } from 'lucide-react';

interface ChatHeaderProps {
  userName: string;
  isOnline?: boolean;
  onBack?: () => void;
  onShowDetails?: () => void;
}

export default function ChatHeader({ userName, onBack, onShowDetails }: ChatHeaderProps) {
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="h-14 bg-white px-3 md:px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors -ml-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600"
          style={{ backgroundColor: '#E8D5B7' }}
        >
          {initial}
        </div>
        <p className="text-sm font-semibold text-gray-800">{userName}</p>
      </div>

      <div className="flex items-center gap-1">
        {onShowDetails && (
          <button
            onClick={onShowDetails}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <User className="w-[18px] h-[18px]" />
          </button>
        )}
        <button className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <Phone className="w-[18px] h-[18px]" />
        </button>
        <button className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <Video className="w-[18px] h-[18px]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <MoreHorizontal className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}
