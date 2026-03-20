'use client';

import { useState, useEffect } from 'react';
import { X, Check, Search } from 'lucide-react';
import { fetchContacts, Contact } from '@/lib/contactsService';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (name: string, members: { user_id: string; user_name: string }[]) => void;
  isCreating?: boolean;
}

const avatarColors = [
  '#E8D5B7', '#D4E8D1', '#D1D8E8', '#E8D1D8', '#D1E8E5',
  '#E8E1D1', '#D1D1E8', '#E8D1D1', '#C9E0D4', '#E0D4C9',
];

function getAvatarColor(id: string): string {
  const sum = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return avatarColors[sum % avatarColors.length];
}

export default function CreateGroupModal({ onClose, onCreate, isCreating }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContacts()
      .then(setContacts)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = searchQuery.trim()
    ? contacts.filter((c) => c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : contacts;

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedIds.size === 0) return;
    const members = contacts
      .filter((c) => selectedIds.has(c.user_id))
      .map((c) => ({ user_id: c.user_id, user_name: c.name }));
    onCreate(groupName.trim(), members);
  };

  const canCreate = groupName.trim().length > 0 && selectedIds.size > 0 && !isCreating;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">New Group</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#1E3A5F] transition-colors"
            autoFocus
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="px-5 py-2 border-b border-gray-100 flex flex-wrap gap-2">
            {contacts
              .filter((c) => selectedIds.has(c.user_id))
              .map((c) => (
                <span
                  key={c.user_id}
                  className="inline-flex items-center gap-1 bg-[#EDF2FF] text-[#1E3A5F] text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {c.name}
                  <button onClick={() => toggleContact(c.user_id)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
          </div>
        )}

        <div className="px-5 py-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#1E3A5F] pr-8"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {isLoading ? (
            <div className="space-y-2 px-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">No contacts found</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((contact) => {
                const isSelected = selectedIds.has(contact.user_id);
                return (
                  <button
                    key={contact.user_id}
                    onClick={() => toggleContact(contact.user_id)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isSelected ? 'bg-[#EDF2FF]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-600"
                      style={{ backgroundColor: getAvatarColor(contact.user_id) }}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">{contact.name}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-[#1E3A5F] border-[#1E3A5F]' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              canCreate
                ? 'bg-[#1E3A5F] text-white hover:bg-[#162d4a]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isCreating ? 'Creating...' : `Create Group${selectedIds.size > 0 ? ` (${selectedIds.size} members)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
