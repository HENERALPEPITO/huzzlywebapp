'use client';

interface MessageBubbleProps {
  content: string;
  isSender: boolean;
  timestamp: Date;
  senderName?: string;
  senderInitial?: string;
  isGroupedWithPrev?: boolean;
  isGroupedWithNext?: boolean;
}

export default function MessageBubble({
  content,
  isSender,
  timestamp,
  senderName,
  senderInitial,
  isGroupedWithPrev = false,
  isGroupedWithNext = false,
}: MessageBubbleProps) {
  const timeString = timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const showTimestamp = !isGroupedWithNext;

  if (isSender) {
    return (
      <div className="flex justify-end w-full px-4 mb-1">
        <div className="flex flex-col items-end" style={{ maxWidth: '65%' }}>
          <div
            className="rounded-2xl px-4 py-2 text-sm text-white bg-blue-600"
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', width: '100%' }}
          >
            {content}
          </div>
          {showTimestamp && (
            <span className="text-xs text-gray-500 mt-1">{timeString}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start w-full px-4 mb-1">
      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0 mr-2">
        {senderInitial || (senderName?.charAt(0) || 'U').toUpperCase()}
      </div>
      <div className="flex flex-col items-start" style={{ maxWidth: '65%' }}>
        <div
          className="rounded-2xl px-4 py-2 text-sm text-gray-900 bg-[#F0F2F5]"
          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', width: '100%' }}
        >
          {content}
        </div>
        {showTimestamp && (
          <span className="text-xs text-gray-500 mt-1">{timeString}</span>
        )}
      </div>
    </div>
  );
}
