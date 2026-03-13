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
      <div className="p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || contacts.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-600 font-medium mb-2">No contacts available</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="px-2">
      {contacts.map((contact) => {
        // deterministic mock unread count for demo
        const sum = contact.user_id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const unread = sum % 4; // 0-3
        return (
          <button
            key={contact.user_id}
            onClick={() => onSelectContact(contact)}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 ${
              selectedContactId === contact.user_id ? 'bg-[#EEF3FF] border border-[var(--huzly-500)]' : 'hover:bg-[#F4F7FC]'
            }`}
            style={{ padding: '12px 16px' }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white" style={{ boxShadow: '0 1px 2px rgba(16,24,40,0.06)', border: '1px solid var(--neutral-100)' }}>
              <span className="text-[var(--huzly-800)] font-semibold">{contact.name.charAt(0).toUpperCase()}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--neutral-700)] truncate">{contact.name}</p>
              <p className="text-xs text-[var(--neutral-500)] truncate">Application for this role...</p>
            </div>

            <div className="flex items-center gap-2">
              {unread > 0 && (
                <div className="bg-[#FF4D4F] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
                  {unread}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
