'use client';

import { useEffect, useMemo, useRef } from 'react';
import MessageBubble from './MessageBubble';

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
}

export default function ChatMessages({ messages, isLoading = false }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const normalized = useMemo(() => {
    return messages.map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
    }));
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
        <div className="space-y-3">
          <div className="w-3/4 h-10 bg-[#F0F2F5] rounded-2xl animate-pulse" />
          <div className="w-2/3 h-10 bg-blue-200 rounded-2xl animate-pulse ml-auto" />
          <div className="w-3/4 h-10 bg-[#F0F2F5] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
      {normalized.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-[#8A8D91] text-sm text-center">No messages yet. Start a conversation!</p>
        </div>
      ) : (
        <div className="flex flex-col">
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
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
