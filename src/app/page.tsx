'use client';

import { useState, useEffect } from 'react';
import ContactList from '@/components/ContactList';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import MessageInput from '@/components/MessageInput';
import { Contact } from '@/lib/contactsService';

interface Message {
  id: string;
  content: string;
  isSender: boolean;
  timestamp: Date;
  senderName?: string;
  senderInitial?: string;
}

export default function Home() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load messages when contact is selected
  useEffect(() => {
    if (!selectedContact) return;

    setIsLoading(true);
    // Simulate loading messages
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
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, [selectedContact]);

  const handleSendMessage = (messageText: string) => {
    if (!selectedContact) return;

    setIsSending(true);

    // Simulate sending message
    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageText,
        isSender: true,
        timestamp: new Date(),
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

  return (
    <div className="h-screen w-full bg-white flex">
      {/* Contact List Sidebar - 50% width */}
      <div className="w-1/2 border-r border-gray-200">
        <ContactList
          onSelectContact={setSelectedContact}
          selectedContactId={selectedContact?.user_id}
        />
      </div>

      {/* Chat Area - 50% width */}
      <div className="w-1/2 flex flex-col">
        {selectedContact ? (
          <>
            <ChatHeader userName={selectedContact.name} isOnline={true} />
            <ChatMessages messages={messages} isLoading={isLoading} />
            <MessageInput onSend={handleSendMessage} isLoading={isSending} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 text-lg font-medium mb-2">Select a contact to start messaging</p>
              <p className="text-gray-400 text-sm">Choose a contact from the list to view or start a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
