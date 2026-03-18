'use client';

import { useMemo, useRef, useState } from 'react';
import { Send, Sparkles, BookOpen, Paperclip, Smile } from 'lucide-react';
import { useFAQGrokReply } from '@/hooks/useFAQGrokReply';

interface MessageInputWithFAQProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  defaultCategory?: string;
  showFAQIndicator?: boolean;
}

export default function MessageInputWithFAQ({
  onSend,
  isLoading = false,
  defaultCategory,
  showFAQIndicator = true,
}: MessageInputWithFAQProps) {
  const [message, setMessage] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    reply: suggestion,
    isLoading: isGeneratingReply,
    faqUsed,
    faqItemsUsed,
    categories,
    selectedCategory,
    generateReply,
    setSelectedCategory,
  } = useFAQGrokReply({
    category: defaultCategory,
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
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3">
      {showSuggestion && suggestion && (
        <div className="mb-3 p-3 rounded-xl bg-[#F0F4FF] border border-[#D6E0F5]">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#1E3A5F] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1E3A5F] mb-1 flex items-center gap-2">
                AI Suggestion
                {faqUsed && showFAQIndicator && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    <BookOpen className="w-3 h-3" />
                    {faqItemsUsed} FAQ
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-700 break-words">{suggestion}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleUseSuggestion}
              className="text-xs font-medium px-3 py-1.5 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162D4A] transition-colors"
            >
              Use
            </button>
            <button
              onClick={() => setShowSuggestion(false)}
              className="text-xs font-medium px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#1E3A5F] hover:bg-gray-50 transition-colors"
            title="FAQ Category"
            type="button"
          >
            <BookOpen className="w-[18px] h-[18px]" />
          </button>

          {showCategoryDropdown && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-max">
              <div className="p-2 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setSelectedCategory(undefined); setShowCategoryDropdown(false); }}
                  className={`block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${!selectedCategory ? 'bg-[#EDF2FF] text-[#1E3A5F] font-semibold' : 'text-gray-700'}`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => { setSelectedCategory(category); setShowCategoryDropdown(false); }}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${selectedCategory === category ? 'bg-[#EDF2FF] text-[#1E3A5F] font-semibold' : 'text-gray-700'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          title="Attach"
          type="button"
        >
          <Paperclip className="w-[18px] h-[18px]" />
        </button>

        <div className="flex-1 flex items-center bg-[#F3F4F6] rounded-xl px-4 py-2.5">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 disabled:cursor-not-allowed"
          />
          <button className="text-gray-400 hover:text-gray-600 ml-2" type="button">
            <Smile className="w-[18px] h-[18px]" />
          </button>
        </div>

        <button
          onClick={handleGenerateSuggestion}
          disabled={!hasMessage || isGeneratingReply || isLoading}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            hasMessage && !isGeneratingReply && !isLoading
              ? 'text-purple-600 hover:bg-purple-50'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="AI suggestion"
          type="button"
        >
          {isGeneratingReply ? (
            <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-[18px] h-[18px]" />
          )}
        </button>

        <button
          onClick={handleSend}
          disabled={!hasMessage || isLoading}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            hasMessage && !isLoading
              ? 'bg-[#1E3A5F] text-white hover:bg-[#162D4A]'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
          title="Send"
          type="button"
        >
          <Send className="w-[16px] h-[16px]" />
        </button>
      </div>
    </div>
  );
}
