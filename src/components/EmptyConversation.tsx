'use client';

import { MessageCircle } from 'lucide-react';

interface EmptyConversationProps {
  onNewChat?: () => void;
}

export default function EmptyConversation({ onNewChat }: EmptyConversationProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white">
      <div className="text-center px-6">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="p-4 bg-blue-100 rounded-full">
            <MessageCircle className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Messages
        </h2>

        {/* Subtext */}
        <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
          Select a conversation from the list or search for a contact to start messaging.
        </p>

        {/* Optional CTA button */}
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>+ New Chat</span>
          </button>
        )}
      </div>
    </div>
  );
}
