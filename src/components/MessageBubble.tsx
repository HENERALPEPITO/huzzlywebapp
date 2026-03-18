'use client';

import { FileText, Download, File } from 'lucide-react';

interface Attachment {
  url: string;
  type?: string;
  name?: string;
  size?: number;
}

interface MessageBubbleProps {
  content: string;
  isSender: boolean;
  timestamp: Date;
  senderName?: string;
  senderInitial?: string;
  isGroupedWithPrev?: boolean;
  isGroupedWithNext?: boolean;
  attachments?: Attachment[] | null;
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

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(type?: string): boolean {
  if (!type) return false;
  return type === 'image' || type.startsWith('image/');
}

function isPdfType(type?: string): boolean {
  if (!type) return false;
  return type === 'pdf' || type === 'application/pdf';
}

function AttachmentRenderer({ attachment, isSender }: { attachment: Attachment; isSender: boolean }) {
  if (isImageType(attachment.type)) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={attachment.url}
          alt={attachment.name || 'Image'}
          className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div className="hidden items-center gap-2 p-3 rounded-lg bg-white/10" style={{ display: 'none' }}>
          <File className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm truncate">{attachment.name || 'Image'}</span>
        </div>
      </a>
    );
  }

  const icon = isPdfType(attachment.type) ? FileText : File;
  const Icon = icon;
  const sizeStr = formatFileSize(attachment.size);

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isSender ? 'bg-white/15 hover:bg-white/25' : 'bg-white/10 hover:bg-white/20'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isSender ? 'bg-white/20' : 'bg-white/15'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.name || 'File'}</p>
        {sizeStr && <p className="text-xs opacity-70">{sizeStr}</p>}
      </div>
      <Download className="w-4 h-4 opacity-60 flex-shrink-0" />
    </a>
  );
}

export default function MessageBubble({
  content,
  isSender,
  timestamp,
  senderName,
  isGroupedWithPrev = false,
  isGroupedWithNext = false,
  attachments,
}: MessageBubbleProps) {
  const showMeta = !isGroupedWithNext;
  const relTime = formatRelativeTime(timestamp);
  const displayName = isSender ? (senderName || 'You') : (senderName || 'Unknown');

  const bubbleStyle = isSender
    ? { backgroundColor: '#2A9D8F', color: '#FFFFFF' }
    : { backgroundColor: '#1E3A5F', color: '#FFFFFF' };

  const dotColor = isSender ? '#2A9D8F' : '#1E3A5F';

  const hasAttachments = attachments && attachments.length > 0;
  const hasContent = content && content.trim().length > 0;

  if (!hasContent && !hasAttachments) return null;

  return (
    <div className={`flex w-full px-2 md:px-4 ${isGroupedWithPrev ? 'mt-1' : 'mt-3'} ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
        <div
          style={{
            ...bubbleStyle,
            borderRadius: '12px',
            padding: hasAttachments ? '8px' : '10px 16px',
            fontSize: '13px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            overflow: 'hidden',
          }}
        >
          {hasAttachments && (
            <div className={`space-y-2 ${hasContent ? 'mb-2' : ''}`}>
              {attachments!.map((att, i) => (
                <AttachmentRenderer key={i} attachment={att} isSender={isSender} />
              ))}
            </div>
          )}
          {hasContent && (
            <div style={{ padding: hasAttachments ? '4px 8px 4px 8px' : undefined }}>
              {content}
            </div>
          )}
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
