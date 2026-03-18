'use client';

import { useState, useEffect } from 'react';
import { fetchContacts, Contact } from '@/lib/contactsService';

interface ContactListProps {
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: string;
}

const avatarColors = [
  '#E8D5B7', '#D4E8D1', '#D1D8E8', '#E8D1D8', '#D1E8E5',
  '#E8E1D1', '#D1D1E8', '#E8D1D1', '#C9E0D4', '#E0D4C9',
];

function getAvatarColor(id: string): string {
  const sum = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return avatarColors[sum % avatarColors.length];
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load contacts';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadContacts();
  }, []);

  if (isLoading) {
    return (
      <div className="px-2 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || contacts.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 text-sm">No contacts available</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {contacts.map((contact) => {
        const sum = contact.user_id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const unread = sum % 4;
        const isSelected = selectedContactId === contact.user_id;
        const initial = contact.name.charAt(0).toUpperCase();

        return (
          <button
            key={contact.user_id}
            onClick={() => onSelectContact(contact)}
            className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
              isSelected
                ? 'bg-[#EDF2FF] shadow-sm'
                : 'hover:bg-gray-50'
            }`}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-600"
              style={{ backgroundColor: getAvatarColor(contact.user_id) }}
            >
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{contact.name}</p>
              <p className="text-xs text-gray-400 truncate">Application for this role...</p>
            </div>

            {unread > 0 && (
              <div className="w-5 h-5 rounded-full bg-[#FF4D4F] flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-white">{unread}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
