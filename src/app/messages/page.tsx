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

interface Message {
  id: string;
  content: string;
  isSender: boolean;
  timestamp: Date;
  senderName?: string;
  senderInitial?: string;
  sender_id?: string;
}

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

  const { isGenerating: isAutoReplyGenerating, generateAndSendAutoReply } = useAutoReply({
    enabled: autoReplyEnabled,
    useFAQ: true,
  });

  // Check auth and fetch current user
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      console.log('[MessagesPage] Starting auth check...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[MessagesPage] Session check complete:', !!session);

        if (!isMounted) return;

        if (!session) {
          console.log('[MessagesPage] No session found, redirecting to home');
          router.push('/');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        console.log('[MessagesPage] User check complete:', !!user);
        if (isMounted && user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('[MessagesPage] Auth check error:', error);
      } finally {
        if (isMounted) {
          console.log('[MessagesPage] Auth check finished');
          setIsAuthChecking(false);
        }
      }
    };

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn('[MessagesPage] Auth check timeout - proceeding anyway');
        setIsAuthChecking(false);
      }
    }, 5000);

    checkAuth();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [router]);

  // Handle URL parameters to auto-select contact and optional shift
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
    }

    if (shiftId) {
      setSelectedShiftId(shiftId);
    }
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Load messages when contact is selected
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

  // Realtime subscription for new messages in the active conversation
  useEffect(() => {
    if (!selectedContact || !currentUserId) return;

    const unsubscribe = subscribeToMessages({
      currentUserId,
      otherUserId: selectedContact.user_id,
      shiftId: selectedShiftId || undefined,
      onNewMessage: (m) => {
        setMessages((prev) => {
          // Avoid adding duplicates if this message is already in state
          if (prev.some((msg) => msg.id === m.id)) {
            return prev;
          }

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
            },
          ];
        });

        // Auto-reply if message is from the other user
        if (m.sender_id !== currentUserId && autoReplyEnabled) {
          // Trigger auto-reply without conversation history (to avoid format issues)
          generateAndSendAutoReply(m.content, m.sender_id, currentUserId);
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [selectedContact, currentUserId, selectedShiftId, autoReplyEnabled, generateAndSendAutoReply]);

  const handleSendMessage = async (messageText: string) => {
    if (!selectedContact || !currentUserId) return;

    setIsSending(true);

    try {
      const created = await sendMessageApi({
        senderId: currentUserId,
        receiverId: selectedContact.user_id,
        content: messageText,
        shiftId: selectedShiftId || undefined,
      });

      if (created) {
        setMessages((prev) => {
          // Avoid duplicate if realtime already added this message
          if (prev.some((msg) => msg.id === created.id)) {
            return prev;
          }

          return [
            ...prev,
            {
              id: created.id,
              content: created.content,
              isSender: true,
              timestamp: new Date(created.sent_at),
              sender_id: created.sender_id,
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
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 border-t-4 border-blue-600">
        <p className="text-gray-500 font-medium">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', width: '100%' }}>
      {/* Top navbar — fixed height */}
      <div
        style={{
          flexShrink: 0,
          height: '56px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          background: 'white',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#2563EB', margin: 0 }}>Messaging App</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Auto-Reply</span>
            <button
              id="autoReply"
              onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoReplyEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={autoReplyEnabled}
              aria-label="Toggle auto reply"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoReplyEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            {isAutoReplyGenerating && (
              <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>Generating...</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              fontSize: 13,
              color: '#374151',
              fontWeight: 600,
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              padding: '6px 10px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Column layout below navbar */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden', width: '100%' }}>
        {/* Left icon nav — narrow */}
        <div style={{ width: '60px', flexShrink: 0, height: '100%', overflow: 'hidden', background: '#F6F8FB' }}>
          <LeftSidebar />
        </div>

        {/* Sidebar contact list */}
        <div style={{ width: '260px', flexShrink: 0, height: '100%', overflowY: 'auto', background: 'white' }}>
          <ConversationListPanel
            onSelectContact={setSelectedContact}
            selectedContactId={selectedContact?.user_id}
          />
        </div>

        {/* Center chat — takes remaining space */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            background: 'white',
          }}
        >
          <div style={{ flexShrink: 0 }}>
            {selectedContact ? (
              <ChatHeader userName={selectedContact.name} isOnline={true} />
            ) : (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: 13 }}>
                Select a conversation
              </div>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
            {selectedContact ? (
              <ChatMessages messages={messages} isLoading={isLoading} />
            ) : (
              <EmptyConversation />
            )}
          </div>

          <div style={{ flexShrink: 0 }}>
            {selectedContact && (
              <div style={{ background: 'white', borderTop: '1px solid var(--neutral-200)' }}>
                <MessageInputWithFAQ onSend={handleSendMessage} isLoading={isSending} showFAQIndicator={true} />
              </div>
            )}
          </div>
        </div>

        {/* Right profile panel */}
        <div style={{ width: '260px', flexShrink: 0, height: '100%', overflowY: 'auto', background: 'white', borderLeft: '1px solid #E5E7EB' }}>
          <ContactDetails contact={selectedContact} />
        </div>
      </div>
    </div>
  );
}
