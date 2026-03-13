'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import ContactList from './ContactList';

interface ConversationListPanelProps {
  onSelectContact: (c: any) => void;
  selectedContactId?: string;
}

export default function ConversationListPanel({ onSelectContact, selectedContactId }: ConversationListPanelProps) {
  const [tab, setTab] = useState<'Worker' | 'Groups' | 'Support'>('Worker');

  return (
    <div className="w-72 bg-[#F6F8FB] border-r" style={{ borderColor: 'var(--neutral-200)' }}>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input placeholder="Search..." className="w-full rounded-full px-4 py-2 text-sm bg-white border" style={{ borderColor: 'var(--neutral-200)' }} />
            <div className="absolute right-3 top-2"><Search className="w-4 h-4 text-[var(--neutral-400)]" /></div>
          </div>
        </div>

        <div className="mt-4 flex gap-4 text-sm text-[var(--neutral-600)]">
          {(['Worker', 'Groups', 'Support'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`pb-2 ${tab === t ? 'font-semibold border-b-2 border-[var(--huzly-500)] text-[var(--neutral-700)]' : 'text-[var(--neutral-500)]'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[calc(100vh-140px)] overflow-y-auto px-2 py-3">
        <ContactList onSelectContact={onSelectContact} selectedContactId={selectedContactId} />
      </div>
    </div>
  );
}
