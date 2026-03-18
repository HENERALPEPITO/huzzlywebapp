'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import MessageInputWithFAQ from '@/components/MessageInputWithFAQ';
import EmptyConversation from '@/components/EmptyConversation';
import LeftSidebar from '@/components/LeftSidebar';
import ConversationListPanel from '@/components/ConversationListPanel';
import ContactDetails from '@/components/ContactDetails';
import { Contact } from '@/lib/contactsService';
import { supabase } from '@/lib/supabaseClient';
import { useAutoReply } from '@/hooks/useAutoReply';
import {
  fetchMessages,
  sendMessage as sendMessageApi,
  subscribeToMessages,
  markMessagesAsRead,
  MessageRecord,
} from '@/services/messages.service';

interface Attachment {
  url: string;
  type?: string;
  name?: string;
  size?: number;
}

interface Message {
  id: string;
  content: string;
  isSender: boolean;
  timestamp: Date;
  senderName?: string;
  senderInitial?: string;
  sender_id?: string;
  attachments?: Attachment[] | null;
}

function extractUrl(obj: any): string {
  if (typeof obj === 'string') return obj;
  if (!obj || typeof obj !== 'object') return '';
  return obj.fileUrl || obj.url || obj.uri || obj.file_url || obj.publicUrl || obj.signedUrl ||
    obj.public_url || obj.signed_url || obj.download_url || obj.src || obj.href || obj.path || '';
}

function parseAttachments(raw: any): Attachment[] | null {
  if (!raw) return null;
  try {
    let parsed = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          return [{ url: raw, type: guessType(raw), name: raw.split('/').pop() || 'Attachment' }];
        }
        return null;
      }
    }

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      parsed = [parsed];
    }

    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const results: Attachment[] = [];
    for (const a of parsed) {
      if (typeof a === 'string') {
        results.push({ url: a, type: guessType(a), name: a.split('/').pop() || 'Attachment' });
        continue;
      }
      if (!a || typeof a !== 'object') continue;

      const url = extractUrl(a);
      if (!url) {
        console.warn('[Attachments] Could not find URL in attachment object:', JSON.stringify(a));
        continue;
      }

      results.push({
        url,
        type: a.fileType || a.type || a.mime_type || a.content_type || a.mimeType || guessType(url + ' ' + (a.name || a.fileName || '')),
        name: a.fileName || a.name || a.filename || a.file_name || url.split('/').pop() || 'Attachment',
        size: a.fileSize || a.size || a.file_size || undefined,
      });
    }

    return results.length > 0 ? results : null;
  } catch (err) {
    console.error('[Attachments] Failed to parse:', raw, err);
    return null;
  }
}

function guessType(urlOrName: string): string {
  const lower = urlOrName.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|heic)/.test(lower)) return 'image';
  if (/\.(pdf)/.test(lower)) return 'pdf';
  if (/\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv)/.test(lower)) return 'document';
  if (/\.(mp4|mov|avi|webm)/.test(lower)) return 'video';
  if (/image/.test(lower)) return 'image';
  if (/pdf/.test(lower)) return 'pdf';
  return 'file';
}

type MobileView = 'contacts' | 'chat' | 'details';

export default function MessagesPage() {
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>('contacts');

  const { isGenerating: isAutoReplyGenerating, generateAndSendAutoReply } = useAutoReply({
    enabled: autoReplyEnabled,
    useFAQ: true,
  });

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (!session) {
          router.push('/');
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (isMounted && user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('[MessagesPage] Auth check error:', error);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    };

    const timeout = setTimeout(() => {
      if (isMounted) setIsAuthChecking(false);
    }, 5000);

    checkAuth();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const receiverId = searchParams.get('receiver_id');
    const receiverName = searchParams.get('receiver_name');
    const shiftId = searchParams.get('shift_id');
    if (receiverId && receiverName) {
      const contact: Contact = {
        worker_id: receiverId,
        user_id: receiverId,
        name: decodeURIComponent(receiverName),
      };
      setSelectedContact(contact);
      setMobileView('chat');
    }
    if (shiftId) setSelectedShiftId(shiftId);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    if (!selectedContact || !currentUserId) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMessages(currentUserId, selectedContact.user_id, selectedShiftId || undefined);
        const mapped: Message[] = data.map((m: MessageRecord) => ({
          id: m.id,
          content: m.content,
          isSender: m.sender_id === currentUserId,
          timestamp: new Date(m.sent_at),
          senderName: m.sender_id === currentUserId ? 'You' : selectedContact.name,
          senderInitial: m.sender_id === currentUserId ? undefined : selectedContact.name.charAt(0).toUpperCase(),
          sender_id: m.sender_id,
          attachments: parseAttachments(m.attachments),
        }));
        setMessages(mapped);
        await markMessagesAsRead(currentUserId, selectedContact.user_id, selectedShiftId || undefined);
      } catch (error) {
        console.error('[MessagesPage] Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [selectedContact, currentUserId, selectedShiftId]);

  useEffect(() => {
    if (!selectedContact || !currentUserId) return;
    const unsubscribe = subscribeToMessages({
      currentUserId,
      otherUserId: selectedContact.user_id,
      shiftId: selectedShiftId || undefined,
      onNewMessage: (m) => {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === m.id)) return prev;
          return [
            ...prev,
            {
              id: m.id,
              content: m.content,
              isSender: m.sender_id === currentUserId,
              timestamp: new Date(m.sent_at),
              senderName: m.sender_id === currentUserId ? 'You' : selectedContact.name,
              senderInitial: m.sender_id === currentUserId ? undefined : selectedContact.name.charAt(0).toUpperCase(),
              sender_id: m.sender_id,
              attachments: parseAttachments(m.attachments),
            },
          ];
        });
        if (m.sender_id !== currentUserId && autoReplyEnabled) {
          generateAndSendAutoReply(m.content, m.sender_id, currentUserId);
        }
      },
    });
    return () => { unsubscribe(); };
  }, [selectedContact, currentUserId, selectedShiftId, autoReplyEnabled, generateAndSendAutoReply]);

  const handleSendMessage = async (messageText: string, attachment?: { fileUrl: string; fileName: string; fileSize: number; fileType: string }) => {
    if (!selectedContact || !currentUserId) return;
    if (!messageText && !attachment) return;
    setIsSending(true);
    try {
      const created = await sendMessageApi({
        senderId: currentUserId,
        receiverId: selectedContact.user_id,
        content: messageText,
        shiftId: selectedShiftId || undefined,
        attachments: attachment || undefined,
      });
      if (created) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === created.id)) return prev;
          return [
            ...prev,
            {
              id: created.id,
              content: created.content,
              isSender: true,
              timestamp: new Date(created.sent_at),
              sender_id: created.sender_id,
              attachments: parseAttachments(created.attachments),
            },
          ];
        });
      }
    } catch (error) {
      console.error('[MessagesPage] Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A5F] flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setMobileView('chat');
  };

  const handleMobileBack = () => {
    setMobileView('contacts');
  };

  const handleShowDetails = () => {
    setMobileView('details');
  };

  const handleCloseDetails = () => {
    setMobileView('chat');
  };

  return (
    <div className="flex h-dvh overflow-hidden w-full bg-[#F8F9FB]">
      <LeftSidebar onLogout={handleLogout} />

      <div className="flex flex-1 min-w-0 overflow-hidden relative">
        {/* Contact list panel */}
        <div className={`
          w-full md:w-[280px] flex-shrink-0 h-full overflow-hidden
          ${mobileView === 'contacts' ? 'block' : 'hidden md:block'}
          pb-16 md:pb-0
        `}>
          <ConversationListPanel
            onSelectContact={handleSelectContact}
            selectedContactId={selectedContact?.user_id}
          />
        </div>

        {/* Chat panel */}
        <div className={`
          flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-white md:border-x border-gray-100
          ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}
          pb-14 md:pb-0
        `}>
          <div className="flex-shrink-0">
            {selectedContact ? (
              <div className="flex items-center justify-between border-b border-gray-100 h-14 bg-white">
                <div className="flex-1 min-w-0">
                  <ChatHeader
                    userName={selectedContact.name}
                    isOnline={true}
                    onBack={handleMobileBack}
                    onShowDetails={handleShowDetails}
                  />
                </div>
                <div className="flex items-center gap-2 px-3 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-500 hidden sm:inline">Auto-Reply</span>
                  <button
                    onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      autoReplyEnabled ? 'bg-[#1E3A5F]' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={autoReplyEnabled}
                    aria-label="Toggle auto reply"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        autoReplyEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                  {isAutoReplyGenerating && (
                    <span className="text-[10px] text-purple-600 font-semibold">AI...</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-14 border-b border-gray-100 flex items-center px-4">
                <span className="text-sm text-gray-400">Select a conversation</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 relative overflow-hidden">
            {selectedContact ? (
              <ChatMessages messages={messages} isLoading={isLoading} />
            ) : (
              <EmptyConversation />
            )}
          </div>

          <div className="flex-shrink-0">
            {selectedContact && (
              <MessageInputWithFAQ onSend={handleSendMessage} isLoading={isSending} showFAQIndicator={true} senderId={currentUserId} />
            )}
          </div>
        </div>

        {/* Contact details panel - desktop */}
        <div className="hidden lg:block w-[260px] flex-shrink-0 h-full overflow-y-auto">
          <ContactDetails contact={selectedContact} />
        </div>

        {/* Contact details panel - mobile overlay */}
        {mobileView === 'details' && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-white flex flex-col">
            <div className="h-14 border-b border-gray-100 flex items-center px-4 gap-3 flex-shrink-0">
              <button
                onClick={handleCloseDetails}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span className="text-sm font-semibold text-gray-800">Contact Details</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ContactDetails contact={selectedContact} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
