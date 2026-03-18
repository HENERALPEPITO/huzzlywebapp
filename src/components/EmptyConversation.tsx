'use client';

import { MessageCircle } from 'lucide-react';

interface EmptyConversationProps {
  onNewChat?: () => void;
}

export default function EmptyConversation({ onNewChat }: EmptyConversationProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#F8F9FB]">
      <div className="text-center px-6">
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-[#1E3A5F]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your Messages</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
          Select a conversation from the list to start messaging.
        </p>
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] text-white text-sm font-medium rounded-xl hover:bg-[#162D4A] transition-colors"
          >
            + New Chat
          </button>
        )}
      </div>
    </div>
  );
}
