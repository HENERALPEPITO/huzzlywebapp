'use client';

/**
 * Messenger-style typing indicator: avatar + animated bouncing dots.
 * Bubble styles and animation are defined in globals.css.
 */
interface TypingIndicatorProps {
  senderInitial?: string;
  senderName?: string;
}

export default function TypingIndicator({
  senderInitial,
  senderName,
}: TypingIndicatorProps) {
  const initial = senderInitial ?? (senderName?.charAt(0) ?? '?').toUpperCase();

  return (
    <div className="typing-indicator-wrapper mt-2 flex items-end gap-2">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, var(--teal-400), var(--teal-500))',
          color: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}
      >
        {initial}
      </div>

      {/* Messenger-style grey bubble with three bouncing dots */}
      <div
        className="typing-bubble"
        title={senderName ? `${senderName} is typing…` : 'Typing…'}
      >
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
