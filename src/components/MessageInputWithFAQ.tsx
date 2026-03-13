'use client';

import { useMemo, useRef, useState } from 'react';
import { Plus, Send, Sparkles, BookOpen } from 'lucide-react';
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
    <div className="border-t" style={{ borderColor: 'var(--neutral-200)' }}>
      <div className="bg-white px-4 py-3">
        {/* Suggestion Display */}
        {showSuggestion && suggestion && (
          <div className="mb-3 p-3 rounded-lg" style={{ borderColor: 'var(--huzly-500, #cfe0fb)', backgroundColor: 'rgba(68,115,192,0.05)', borderStyle: 'solid', borderWidth: 1 }}>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[var(--huzly-500)] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--huzly-800)] mb-1 flex items-center gap-2">
                  AI Suggestion
                  {faqUsed && showFAQIndicator && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      <BookOpen className="w-3 h-3" />
                      {faqItemsUsed} FAQ
                    </span>
                  )}
                </p>
                <p className="text-sm text-[var(--huzly-800)] break-words">{suggestion}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleUseSuggestion}
                className="text-xs font-medium px-2 py-1 bg-[var(--huzly-500)] text-white rounded hover:opacity-90 transition-colors"
              >
                Use
              </button>
              <button
                onClick={() => setShowSuggestion(false)}
                className="text-xs font-medium px-2 py-1 bg-neutral-100 text-[var(--neutral-600)] rounded hover:bg-neutral-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="flex items-center gap-3">
          {/* Category Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
              title="FAQ Category"
              type="button"
            >
              <BookOpen className="w-5 h-5" />
            </button>

            {showCategoryDropdown && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-max">
                <div className="p-2 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedCategory(undefined);
                      setShowCategoryDropdown(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors ${!selectedCategory ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors ${selectedCategory === category ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
          <button
            onClick={handleGenerateSuggestion}
            disabled={!hasMessage || isGeneratingReply || isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${hasMessage && !isGeneratingReply && !isLoading
                ? 'text-purple-600 hover:bg-purple-50'
                : 'text-gray-300 cursor-not-allowed'
              }`}
            title="Generate AI suggestion (with FAQ)"
            type="button"
          >
            {isGeneratingReply ? (
              <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!hasMessage || isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${hasMessage && !isLoading ? 'text-[#0084FF] hover:bg-[#F0F2F5]' : 'text-[#8A8D91] cursor-not-allowed'
              }`}
            title="Send"
            type="button"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
