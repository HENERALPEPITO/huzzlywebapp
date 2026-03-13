'use client';

import { useMemo, useRef, useState } from 'react';
import { Plus, Send, Sparkles } from 'lucide-react';
import { useGrokReply } from '@/hooks/useGrokReply';

interface MessageInputWithSuggestionsProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  enableSuggestions?: boolean;
  suggestionsContext?: string;
}

export default function MessageInputWithSuggestions({
  onSend,
  isLoading = false,
  enableSuggestions = false,
  suggestionsContext,
}: MessageInputWithSuggestionsProps) {
  const [message, setMessage] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { reply: suggestion, isLoading: isGeneratingReply, generateReply } = useGrokReply({
    context: suggestionsContext,
  });

  const hasMessage = useMemo(() => message.trim().length > 0, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;

    onSend(trimmed);
    setMessage('');
    setShowSuggestion(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateSuggestion = async () => {
    if (!hasMessage || isGeneratingReply) return;
    await generateReply(message);
    setShowSuggestion(true);
  };

  const handleUseSuggestion = () => {
    if (suggestion) {
      onSend(suggestion);
      setMessage('');
      setShowSuggestion(false);
      setMessage('');
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      {/* Suggestion Display */}
      {enableSuggestions && showSuggestion && suggestion && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-900 mb-1">AI Suggestion</p>
              <p className="text-sm text-blue-800 break-words">{suggestion}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleUseSuggestion}
              className="text-xs font-medium px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Use
            </button>
            <button
              onClick={() => setShowSuggestion(false)}
              className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
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

        {/* AI Suggestion Button */}
        {enableSuggestions && (
          <button
            onClick={handleGenerateSuggestion}
            disabled={!hasMessage || isGeneratingReply || isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
              hasMessage && !isGeneratingReply && !isLoading
                ? 'text-purple-600 hover:bg-purple-50'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Generate AI suggestion"
            type="button"
          >
            {isGeneratingReply ? (
              <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Send Button */}
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
