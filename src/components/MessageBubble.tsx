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

  const showAvatar = !isSender && !isGroupedWithNext;
  const showTimestamp = !isGroupedWithNext;

  if (isSender) {
    return (
      <div className={isGroupedWithPrev ? 'mt-1 flex justify-end' : 'mt-3 flex justify-end'}>
        <div className="flex flex-col items-end gap-1 max-w-full">
          <div
            className="bg-[#0084FF] text-white rounded-2xl px-4 py-2 max-w-[70%] shadow-sm transition-transform duration-150 hover:scale-[1.01]"
          >
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{content}</p>
          </div>
          {showTimestamp ? <span className="text-xs text-[#8A8D91]">{timeString}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={isGroupedWithPrev ? 'mt-1 flex items-end gap-2' : 'mt-3 flex items-end gap-2'}>
      <div className="w-8 flex-shrink-0">
        {showAvatar ? (
          <div className="w-8 h-8 rounded-full bg-[#F0F2F5] flex items-center justify-center text-xs font-semibold text-[#111827]">
            {senderInitial || (senderName?.charAt(0) || 'U').toUpperCase()}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col items-start gap-1 max-w-full">
        <div
          className="bg-[#F0F2F5] text-[#111827] rounded-2xl px-4 py-2 max-w-[70%] shadow-sm transition-transform duration-150 hover:scale-[1.01]"
        >
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{content}</p>
        </div>
        {showTimestamp ? <span className="text-xs text-[#8A8D91]">{timeString}</span> : null}
      </div>
    </div>
  );
}
