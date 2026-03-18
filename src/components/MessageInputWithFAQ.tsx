'use client';

import { useMemo, useRef, useState } from 'react';
import { Send, Sparkles, BookOpen, Paperclip, Smile, X, FileText, ImageIcon, File } from 'lucide-react';
import { useFAQGrokReply } from '@/hooks/useFAQGrokReply';
import { uploadMessageFile } from '@/services/messages.service';

interface AttachmentData {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface MessageInputWithFAQProps {
  onSend: (message: string, attachment?: AttachmentData) => void;
  isLoading?: boolean;
  defaultCategory?: string;
  showFAQIndicator?: boolean;
  senderId?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon;
  if (type === 'application/pdf') return FileText;
  return File;
}

export default function MessageInputWithFAQ({
  onSend,
  isLoading = false,
  defaultCategory,
  showFAQIndicator = true,
  senderId,
}: MessageInputWithFAQProps) {
  const [message, setMessage] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    reply: suggestion,
    isLoading: isGeneratingReply,
    faqUsed,
    faqItemsUsed,
    categories,
    selectedCategory,
    generateReply,
    setSelectedCategory,
  } = useFAQGrokReply({
    category: defaultCategory,
  });

  const hasMessage = useMemo(() => message.trim().length > 0, [message]);
  const canSend = hasMessage || pendingFile;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File too large (max ${formatFileSize(MAX_FILE_SIZE)})`);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
    if (!ALLOWED_TYPES.includes(file.type) && !allowedExts.includes(ext)) {
      setUploadError('File type not supported. Allowed: images, PDFs, documents');
      return;
    }

    setPendingFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = () => {
    setPendingFile(null);
    setUploadError(null);
  };

  const handleSend = async () => {
    if ((!hasMessage && !pendingFile) || isLoading || isUploading) return;

    let attachmentData: AttachmentData | undefined;

    if (pendingFile) {
      if (!senderId) {
        setUploadError('Unable to upload: not authenticated');
        return;
      }
      setIsUploading(true);
      setUploadError(null);
      try {
        attachmentData = await uploadMessageFile(pendingFile, senderId);
      } catch (err: any) {
        console.error('Upload failed:', err);
        setUploadError(err?.message || 'Upload failed');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const trimmed = message.trim();
    onSend(trimmed, attachmentData);
    setMessage('');
    setPendingFile(null);
    setUploadError(null);
    setShowSuggestion(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateSuggestion = async () => {
    if (!hasMessage || isGeneratingReply) return;
    await generateReply(message);
    setShowSuggestion(true);
  };

  const handleUseSuggestion = () => {
    if (suggestion) {
      onSend(suggestion);
      setMessage('');
      setShowSuggestion(false);
    }
  };

  const FileIcon = pendingFile ? getFileIcon(pendingFile.type) : File;

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3">
      {uploadError && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
          <span className="text-xs text-red-600">{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {pendingFile && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-[#F3F4F6] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center flex-shrink-0">
            <FileIcon className="w-4 h-4 text-[#1E3A5F]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{pendingFile.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(pendingFile.size)}</p>
          </div>
          <button
            onClick={handleRemoveFile}
            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            title="Remove file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showSuggestion && suggestion && (
        <div className="mb-3 p-3 rounded-xl bg-[#F0F4FF] border border-[#D6E0F5]">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#1E3A5F] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1E3A5F] mb-1 flex items-center gap-2">
                AI Suggestion
                {faqUsed && showFAQIndicator && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    <BookOpen className="w-3 h-3" />
                    {faqItemsUsed} FAQ
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-700 break-words">{suggestion}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleUseSuggestion}
              className="text-xs font-medium px-3 py-1.5 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162D4A] transition-colors"
            >
              Use
            </button>
            <button
              onClick={() => setShowSuggestion(false)}
              className="text-xs font-medium px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#1E3A5F] hover:bg-gray-50 transition-colors"
            title="FAQ Category"
            type="button"
          >
            <BookOpen className="w-[18px] h-[18px]" />
          </button>

          {showCategoryDropdown && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-max">
              <div className="p-2 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setSelectedCategory(undefined); setShowCategoryDropdown(false); }}
                  className={`block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${!selectedCategory ? 'bg-[#EDF2FF] text-[#1E3A5F] font-semibold' : 'text-gray-700'}`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => { setSelectedCategory(category); setShowCategoryDropdown(false); }}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${selectedCategory === category ? 'bg-[#EDF2FF] text-[#1E3A5F] font-semibold' : 'text-gray-700'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isLoading}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            pendingFile
              ? 'text-[#1E3A5F] bg-[#EDF2FF]'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          } ${(isUploading || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Attach file"
          type="button"
        >
          <Paperclip className="w-[18px] h-[18px]" />
        </button>

        <div className="flex-1 flex items-center bg-[#F3F4F6] rounded-xl px-4 py-2.5">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? "Add a message (optional)..." : "Type a message..."}
            disabled={isLoading || isUploading}
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 disabled:cursor-not-allowed"
          />
          <button className="text-gray-400 hover:text-gray-600 ml-2" type="button">
            <Smile className="w-[18px] h-[18px]" />
          </button>
        </div>

        <button
          onClick={handleGenerateSuggestion}
          disabled={!hasMessage || isGeneratingReply || isLoading}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            hasMessage && !isGeneratingReply && !isLoading
              ? 'text-purple-600 hover:bg-purple-50'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="AI suggestion"
          type="button"
        >
          {isGeneratingReply ? (
            <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-[18px] h-[18px]" />
          )}
        </button>

        <button
          onClick={handleSend}
          disabled={!canSend || isLoading || isUploading}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            canSend && !isLoading && !isUploading
              ? 'bg-[#1E3A5F] text-white hover:bg-[#162D4A]'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
          title="Send"
          type="button"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-[16px] h-[16px]" />
          )}
        </button>
      </div>
    </div>
  );
}
