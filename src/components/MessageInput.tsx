'use client';

import { useMemo, useRef, useState } from 'react';
import { Plus, Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export default function MessageInput({ onSend, isLoading = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const hasMessage = useMemo(() => message.trim().length > 0, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;

    onSend(trimmed);
    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-[#F0F2F5] transition-colors flex-shrink-0"
          title="More"
          type="button"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="flex-1 flex items-center bg-[#F0F2F5] rounded-full px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm leading-relaxed placeholder:text-[#8A8D91] disabled:cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!hasMessage || isLoading}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
            hasMessage && !isLoading ? 'text-[#0084FF] hover:bg-[#F0F2F5]' : 'text-[#8A8D91] cursor-not-allowed'
          }`}
          title="Send"
          type="button"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
