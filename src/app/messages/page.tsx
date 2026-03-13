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
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#F6F8FB' }}>
      {/* Sidebar */}
      <div style={{ width: '240px', flexShrink: 0, height: '100%', overflowY: 'auto' }}>
        <LeftSidebar />
      </div>

      {/* Conversation list */}
      <div style={{ width: '320px', flexShrink: 0, height: '100%', overflowY: 'auto' }}>
        <ConversationListPanel
          onSelectContact={setSelectedContact}
          selectedContactId={selectedContact?.user_id}
        />
      </div>

      {/* Middle chat column — CRITICAL */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          background: 'white',
        }}
      >
        {/* fixed height top bar */}
        <div
          style={{
            flexShrink: 0,
            height: 56,
            borderBottom: '1px solid #E5E7EB',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <h1 className="text-xl font-bold text-blue-600">Messaging App</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="autoReply" className="text-sm font-medium text-gray-700">
                Auto-Reply:
              </label>
              <button
                id="autoReply"
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoReplyEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={autoReplyEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoReplyEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              {isAutoReplyGenerating && (
                <span className="text-xs text-purple-600 font-medium">Generating...</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-700 hover:text-red-500 transition-colors font-medium border rounded px-3 py-1 border-gray-300"
            >
              Logout
            </button>
          </div>
        </div>

        {selectedContact ? (
          <>
            <div style={{ flexShrink: 0 }}>
              <ChatHeader userName={selectedContact.name} isOnline={true} />
            </div>

            {/* This wrapper around ChatMessages MUST have both: min-h-0 + relative + overflow-hidden */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', background: 'white' }}>
              <ChatMessages messages={messages} isLoading={isLoading} />
            </div>

            {/* Message input fixed at bottom */}
            <div style={{ flexShrink: 0, background: 'white', borderTop: '1px solid var(--neutral-200)' }}>
              <MessageInputWithFAQ
                onSend={handleSendMessage}
                isLoading={isSending}
                showFAQIndicator={true}
              />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <EmptyConversation />
          </div>
        )}
      </div>

      {/* Right profile panel */}
      <div
        style={{
          width: '280px',
          flexShrink: 0,
          height: '100%',
          overflowY: 'auto',
          background: 'white',
          borderLeft: '1px solid #E5E7EB',
        }}
      >
        <ContactDetails contact={selectedContact} />
      </div>
    </div>
  );
}
