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

const senderColors = [
  { bg: '#1E3A5F', text: '#FFFFFF', dot: '#1E3A5F' },
  { bg: '#2A9D8F', text: '#FFFFFF', dot: '#2A9D8F' },
  { bg: '#FFFFFF', text: '#374151', dot: '#6B7280', border: '1px solid #E5E7EB' },
  { bg: '#3B82F6', text: '#FFFFFF', dot: '#3B82F6' },
];

function getSenderColor(name?: string) {
  if (!name) return senderColors[0];
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return senderColors[sum % senderColors.length];
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
  senderInitial,
  isGroupedWithPrev = false,
  isGroupedWithNext = false,
}: MessageBubbleProps) {
  const showMeta = !isGroupedWithNext;
  const sentColor = { bg: '#4CAF50', text: '#FFFFFF', dot: '#4CAF50' };
  const color = isSender ? sentColor : getSenderColor(senderName);
  const relTime = formatRelativeTime(timestamp);
  const displayName = isSender ? (senderName || 'You') : (senderName || 'Unknown');

  return (
    <div className={`flex w-full px-4 ${isGroupedWithPrev ? 'mt-1' : 'mt-3'} ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`} style={{ maxWidth: '70%' }}>
        <div
          style={{
            backgroundColor: color.bg,
            color: color.text,
            borderRadius: '12px',
            padding: '10px 16px',
            fontSize: '13px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            border: (color as any).border || 'none',
          }}
        >
          {content}
        </div>
        {showMeta && (
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color.dot }}
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
