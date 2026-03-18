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

function formatRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}hr`;
  return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MessageBubble({
  content,
  isSender,
  timestamp,
  senderName,
  isGroupedWithPrev = false,
  isGroupedWithNext = false,
}: MessageBubbleProps) {
  const showMeta = !isGroupedWithNext;
  const relTime = formatRelativeTime(timestamp);
  const displayName = isSender ? (senderName || 'You') : (senderName || 'Unknown');

  const bubbleStyle = isSender
    ? { backgroundColor: '#2A9D8F', color: '#FFFFFF' }
    : { backgroundColor: '#1E3A5F', color: '#FFFFFF' };

  const dotColor = isSender ? '#2A9D8F' : '#1E3A5F';

  return (
    <div className={`flex w-full px-4 ${isGroupedWithPrev ? 'mt-1' : 'mt-3'} ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`} style={{ maxWidth: '70%' }}>
        <div
          style={{
            ...bubbleStyle,
            borderRadius: '12px',
            padding: '10px 16px',
            fontSize: '13px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          {content}
        </div>
        {showMeta && (
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: dotColor }}
            />
            <span className="text-[11px] text-gray-500">
              {displayName} • {relTime}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
