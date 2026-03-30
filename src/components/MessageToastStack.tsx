'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export interface MessageToastItem {
  id: string;
  title: string;
  body: string;
  variant: 'dm' | 'group';
  navigateHref?: string;
}

interface MessageToastStackProps {
  toasts: MessageToastItem[];
  onDismiss: (id: string) => void;
}

export default function MessageToastStack({ toasts, onDismiss }: MessageToastStackProps) {
  const router = useRouter();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-3 right-3 z-[100] flex flex-col gap-2 max-w-[min(100vw-1.5rem,360px)]"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="flex items-stretch rounded-xl border border-gray-200/80 bg-white/95 shadow-lg backdrop-blur-sm overflow-hidden toast-slide-in"
        >
          <button
            type="button"
            onClick={() => {
              if (t.navigateHref) router.push(t.navigateHref);
              onDismiss(t.id);
            }}
            className="flex-1 min-w-0 text-left px-4 py-3 hover:bg-gray-50/90 transition-colors"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1E3A5F] mb-0.5">
              {t.variant === 'group' ? 'Group message' : 'New message'}
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.body}</p>
          </button>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="flex-shrink-0 w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 border-l border-gray-100"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
