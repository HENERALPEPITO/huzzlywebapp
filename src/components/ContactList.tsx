'use client';

import { useState, useEffect } from 'react';
import { fetchContacts, Contact } from '@/lib/contactsService';
import { debugFetchWorkers } from '@/lib/debugService';

interface ContactListProps {
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: string;
}

export default function ContactList({ onSelectContact, selectedContactId }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchContacts();
        setContacts(data);
        
        if (data.length === 0) {
          console.warn('No contacts found. Running debug...');
          // Run debug check in the background
          setTimeout(() => debugFetchWorkers(), 100);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load contacts';
        setError(message);
        console.error('Error loading contacts:', err);
        
        // Trigger debug info on error
        setTimeout(() => debugFetchWorkers(), 100);
      } finally {
        setIsLoading(false);
      }
    };

    loadContacts();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white border-r border-gray-200 h-screen overflow-y-auto">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-r border-gray-200 h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Failed to load contacts</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <p className="text-xs text-gray-400">Check the browser console for debug information</p>
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-white border-r border-gray-200 h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 font-medium mb-2">No contacts available</p>
          <p className="text-sm text-gray-500">
            Make sure the worker table has records with associated users
          </p>
          <p className="text-xs text-gray-400 mt-4">Check the console for debug info</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
        <div className="space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.user_id}
              onClick={() => onSelectContact(contact)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedContactId === contact.user_id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {contact.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{contact.user_id}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
