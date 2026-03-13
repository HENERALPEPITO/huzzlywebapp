'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface Message {
  id: string;
  content: string;
  isSender: boolean;
  timestamp: Date;
  senderName?: string;
  senderInitial?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  isTyping?: boolean;
  typingSenderName?: string;
  typingSenderInitial?: string;
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

  // Normalize messages (deduplicate by ID)
  const normalized = useMemo(() => {
    const byId = new Map<string, Message>();
    for (const m of messages) byId.set(m.id, m);
    const result = Array.from(byId.values()).map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
    }));
    return result;
  }, [messages]);

  // Check if near bottom
  const checkIfNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  // Reliable scroll-to-bottom using direct DOM manipulation
  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    });
  }, []);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    const isNearBottom = checkIfNearBottom();
    setShowScrollBtn(!isNearBottom);
  }, [checkIfNearBottom]);

  // Scroll on message count changes (including first load)
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

  // #region agent log: scroller height diagnostics
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const p = el.parentElement;
    const gp = p?.parentElement;
    const ggp = gp?.parentElement;
    const style = window.getComputedStyle(el);
    const pStyle = p ? window.getComputedStyle(p) : null;
    const gpStyle = gp ? window.getComputedStyle(gp) : null;
    const ggpStyle = ggp ? window.getComputedStyle(ggp) : null;
    fetch('http://127.0.0.1:7890/ingest/c6e0aec4-9a7e-47be-8a3d-1c2e473c6adb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7b7358' },
      body: JSON.stringify({
        sessionId: '7b7358',
        runId: 'pre-fix',
        hypothesisId: 'H_layout_height_chain',
        location: 'ChatMessages.tsx:scroller-dims',
        message: 'Scroll container + parent chain dimensions',
        data: {
          normalizedLength: normalized.length,
          self: {
            clientHeight: el.clientHeight,
            scrollHeight: el.scrollHeight,
            scrollTop: el.scrollTop,
            computedHeight: style.height,
            computedOverflowY: style.overflowY,
            computedPosition: style.position,
          },
          parent: p
            ? {
                tag: p.tagName,
                className: p.className,
                clientHeight: p.clientHeight,
                computedHeight: pStyle?.height,
                computedMinHeight: pStyle?.minHeight,
                computedPosition: pStyle?.position,
                computedOverflow: pStyle?.overflow,
              }
            : null,
          grandParent: gp
            ? {
                tag: gp.tagName,
                className: gp.className,
                clientHeight: gp.clientHeight,
                computedHeight: gpStyle?.height,
                computedMinHeight: gpStyle?.minHeight,
                computedOverflow: gpStyle?.overflow,
              }
            : null,
          greatGrandParent: ggp
            ? {
                tag: ggp.tagName,
                className: ggp.className,
                clientHeight: ggp.clientHeight,
                computedHeight: ggpStyle?.height,
                computedMinHeight: ggpStyle?.minHeight,
                computedOverflow: ggpStyle?.overflow,
              }
            : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [normalized.length]);
  // #endregion

  // Scroll on new typing indicator
  useEffect(() => {
    if (isTyping && checkIfNearBottom()) {
      scrollToBottom();
    }
  }, [isTyping, scrollToBottom, checkIfNearBottom]);

  if (isLoading) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'scroll',
            overflowX: 'hidden',
            background: '#F9FAFB',
            padding: 24,
          }}
        >
          <div className="space-y-3">
            <div className="w-3/4 h-10 bg-[#F0F2F5] rounded-2xl animate-pulse" />
            <div className="w-2/3 h-10 bg-blue-200 rounded-2xl animate-pulse ml-auto" />
            <div className="w-3/4 h-10 bg-[#F0F2F5] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'scroll',
          overflowX: 'hidden',
          background: '#F9FAFB',
          scrollbarGutter: 'stable',
        }}
      >
        <div className="flex flex-col px-2 py-4 w-full">
          {normalized.length === 0 && !isTyping ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[#8A8D91] text-sm text-center">
                No messages yet. Start a conversation!
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-1">
              {normalized.map((message, index) => {
                const prev = normalized[index - 1];
                const next = normalized[index + 1];
                const isGroupedWithPrev = prev ? prev.isSender === message.isSender : false;
                const isGroupedWithNext = next ? next.isSender === message.isSender : false;

                return (
                  <MessageBubble
                    key={message.id}
                    content={message.content}
                    isSender={message.isSender}
                    timestamp={message.timestamp}
                    senderName={message.senderName}
                    senderInitial={message.senderInitial}
                    isGroupedWithPrev={isGroupedWithPrev}
                    isGroupedWithNext={isGroupedWithNext}
                  />
                );
              })}

              {isTyping && (
                <TypingIndicator
                  senderName={typingSenderName}
                  senderInitial={typingSenderInitial}
                />
              )}

              {/* Sentinel for scrolling */}
              <div style={{ height: '1px' }} />
            </div>
          )}
        </div>
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
          aria-label="Scroll to latest messages"
          title="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}