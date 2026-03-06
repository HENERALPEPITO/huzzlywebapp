'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ContactList from '@/components/ContactList';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import MessageInput from '@/components/MessageInput';
import { Contact } from '@/lib/contactsService';
import { supabase } from '@/lib/supabaseClient';

interface Message {
  id: string;
  content: string;
  isSender: boolean;
  timestamp: Date;
  senderName?: string;
  senderInitial?: string;
  sender_id?: string; // Track sender_id based on auth
}

export default function MessagesPage() {
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Check auth and fetch current user
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      setIsAuthChecking(false);
    };

    checkAuth();
  }, [router]);

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Load messages when contact is selected
  useEffect(() => {
    if (!selectedContact) return;

    setIsLoading(true);
    // Simulate loading messages from the real DB logic
    setTimeout(() => {
      setMessages([
        {
          id: '1',
          content: 'Hey! How are you doing?',
          isSender: false,
          timestamp: new Date(Date.now() - 300000),
          senderName: selectedContact.name,
          senderInitial: selectedContact.name.charAt(0).toUpperCase(),
        },
        {
          id: '2',
          content: 'I\'m doing great! How about you?',
          isSender: true,
          timestamp: new Date(Date.now() - 240000),
          sender_id: currentUserId || undefined,
        },
        {
          id: '3',
          content: 'Doing well! Want to grab coffee later?',
          isSender: false,
          timestamp: new Date(Date.now() - 180000),
          senderName: selectedContact.name,
          senderInitial: selectedContact.name.charAt(0).toUpperCase(),
        },
        {
          id: '4',
          content: 'Sounds perfect! What time works for you?',
          isSender: true,
          timestamp: new Date(Date.now() - 120000),
          sender_id: currentUserId || undefined,
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, [selectedContact, currentUserId]);

  const handleSendMessage = async (messageText: string) => {
    if (!selectedContact || !currentUserId) return;

    setIsSending(true);

    // Simulate sending message
    setTimeout(() => {
      // In real implementation:
      // await supabase.from('messages').insert({ sender_id: currentUserId, content: messageText, ... })

      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageText,
        isSender: true,
        timestamp: new Date(),
        sender_id: currentUserId,
      };

      setMessages((prev) => [...prev, newMessage]);
      setIsSending(false);

      // Simulate a reply after 1 second
      setTimeout(() => {
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Thanks for your message!',
          isSender: false,
          timestamp: new Date(),
          senderName: selectedContact.name,
          senderInitial: selectedContact.name.charAt(0).toUpperCase(),
        };
        setMessages((prev) => [...prev, reply]);
      }, 1000);
    }, 300);
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
