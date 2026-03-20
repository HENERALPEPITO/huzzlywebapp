'use client';

import { Phone, Video, MoreHorizontal, ArrowLeft, User, Users } from 'lucide-react';

interface ChatHeaderProps {
  userName: string;
  isOnline?: boolean;
  onBack?: () => void;
  onShowDetails?: () => void;
  subtitle?: string;
}

export default function ChatHeader({ userName, isOnline, onBack, onShowDetails, subtitle }: ChatHeaderProps) {
  const initial = userName.charAt(0).toUpperCase();
  const isGroup = !!subtitle;

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
          style={{ backgroundColor: isGroup ? '#D1E8E5' : '#E8D5B7' }}
        >
          {isGroup ? <Users className="w-4 h-4" /> : initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
          {subtitle && (
            <p className="text-[11px] text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
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
