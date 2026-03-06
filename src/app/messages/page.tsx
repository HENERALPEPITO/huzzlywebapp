'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ContactList from '@/components/ContactList';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import MessageInput from '@/components/MessageInput';
import { Contact } from '@/lib/contactsService';
import { supabase } from '@/lib/supabaseClient';
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
      },
    });

    return () => {
      unsubscribe();
    };
  }, [selectedContact, currentUserId, selectedShiftId]);

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
    <div className="h-screen w-full bg-white flex flex-col">
      {/* Top Application Bar to allow Logout from main frame */}
      <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4">
        <h1 className="text-xl font-bold text-blue-600">Messaging App</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-700 hover:text-red-500 transition-colors font-medium border rounded px-3 py-1 border-gray-300"
        >
          Logout
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Contact List Sidebar - 50% width */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <ContactList
            onSelectContact={setSelectedContact}
            selectedContactId={selectedContact?.user_id}
          />
        </div>

        {/* Chat Area - 50% width */}
        <div className="w-1/2 flex flex-col bg-white overflow-hidden">
          {selectedContact ? (
            <>
              <ChatHeader userName={selectedContact.name} isOnline={true} />
              <div className="flex-1 overflow-y-auto">
                <ChatMessages messages={messages} isLoading={isLoading} />
              </div>
              <MessageInput onSend={handleSendMessage} isLoading={isSending} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl">
                <p className="text-gray-600 text-lg font-medium mb-2">Select a contact to start messaging</p>
                <p className="text-gray-400 text-sm">Choose a contact from the list to view or start a conversation.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
