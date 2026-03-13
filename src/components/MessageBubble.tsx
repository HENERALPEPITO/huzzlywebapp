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
        <div className="flex flex-col items-end" style={{ maxWidth: '65%', minWidth: 0 }}>
          <div
            style={{
              backgroundColor: '#0084ff',
              color: 'white',
              borderRadius: '18px',
              padding: '8px 14px',
              fontSize: '14px',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              width: '100%',
            }}
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
      <div className="flex flex-col items-start" style={{ maxWidth: '65%', minWidth: 0 }}>
        <div
          style={{
            backgroundColor: '#F0F2F5',
            color: '#1c1e21',
            borderRadius: '18px',
            padding: '8px 14px',
            fontSize: '14px',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            width: '100%',
          }}
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
