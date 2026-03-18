'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface Attachment {
  url: string;
  type?: string;
  name?: string;
  size?: number;
}

interface Message {
  id: string;
  content: string;
  isSender: boolean;
  timestamp: Date;
  senderName?: string;
  senderInitial?: string;
  attachments?: Attachment[] | null;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  isTyping?: boolean;
  typingSenderName?: string;
  typingSenderInitial?: string;
}

function formatDateSeparator(date: Date): string {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `Today ${time}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`;
}

function shouldShowDateSeparator(current: Date, previous?: Date): boolean {
  if (!previous) return true;
  const diffMs = current.getTime() - previous.getTime();
  return diffMs > 30 * 60 * 1000;
}

export default function ChatMessages({
  messages,
  isLoading = false,
  isTyping = false,
  typingSenderName,
  typingSenderInitial,
}: ChatMessagesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const normalized = useMemo(() => {
    const byId = new Map<string, Message>();
    for (const m of messages) byId.set(m.id, m);
    return Array.from(byId.values()).map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
    }));
  }, [messages]);

  const checkIfNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    });
  }, []);

  const handleScroll = useCallback(() => {
    setShowScrollBtn(!checkIfNearBottom());
  }, [checkIfNearBottom]);

  useEffect(() => {
    if (normalized.length === 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    });
  }, [normalized.length]);

  useEffect(() => {
    if (isTyping && checkIfNearBottom()) {
      scrollToBottom();
    }
  }, [isTyping, scrollToBottom, checkIfNearBottom]);

  if (isLoading) {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto bg-[#F8F9FB] p-6">
          <div className="space-y-4">
            <div className="w-3/4 h-12 bg-gray-100 rounded-xl animate-pulse" />
            <div className="w-2/3 h-12 bg-green-100 rounded-xl animate-pulse ml-auto" />
            <div className="w-3/4 h-12 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden"
        style={{ background: '#F8F9FB', scrollbarGutter: 'stable' }}
      >
        <div className="flex flex-col py-4 w-full">
          {normalized.length === 0 && !isTyping ? (
            <div className="h-full flex items-center justify-center py-20">
              <p className="text-gray-400 text-sm">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {normalized.map((message, index) => {
                const prev = normalized[index - 1];
                const next = normalized[index + 1];
                const isGroupedWithPrev = prev ? prev.isSender === message.isSender && prev.senderName === message.senderName : false;
                const isGroupedWithNext = next ? next.isSender === message.isSender && next.senderName === message.senderName : false;
                const showDate = shouldShowDateSeparator(message.timestamp, prev?.timestamp);

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-[11px] text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">
                          {formatDateSeparator(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <MessageBubble
                      content={message.content}
                      isSender={message.isSender}
                      timestamp={message.timestamp}
                      senderName={message.senderName}
                      senderInitial={message.senderInitial}
                      isGroupedWithPrev={isGroupedWithPrev && !showDate}
                      isGroupedWithNext={isGroupedWithNext}
                      attachments={message.attachments}
                    />
                  </div>
                );
              })}

              {isTyping && (
                <TypingIndicator
                  senderName={typingSenderName}
                  senderInitial={typingSenderInitial}
                />
              )}

              <div style={{ height: '1px' }} />
            </div>
          )}
        </div>
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow z-10"
          aria-label="Scroll to latest messages"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}
