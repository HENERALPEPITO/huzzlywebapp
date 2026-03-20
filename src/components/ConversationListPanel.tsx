'use client';

import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import ContactList from './ContactList';
import GroupList from './GroupList';
import { Group } from '@/services/groups.service';

interface ConversationListPanelProps {
  onSelectContact: (c: any) => void;
  selectedContactId?: string;
  currentUserId?: string | null;
  unreadCounts?: Record<string, number>;
  totalUnread?: number;
  onSelectGroup?: (group: Group) => void;
  selectedGroupId?: string;
}

const tabs = ['Worker', 'Groups', 'Support'] as const;

export default function ConversationListPanel({
  onSelectContact,
  selectedContactId,
  currentUserId,
  unreadCounts,
  totalUnread,
  onSelectGroup,
  selectedGroupId,
}: ConversationListPanelProps) {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Worker');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-100">
      <div className="md:hidden flex items-center gap-3 px-3 pt-4 pb-2">
        <img src="/images/logo.png" alt="Huzzly" className="w-8 h-8 object-contain" />
        <h1 className="text-lg font-bold text-gray-900">Huzzly</h1>
      </div>
      <div className="px-3 md:px-4 pt-2 md:pt-5 pb-2">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full px-4 py-2 text-sm bg-[#F3F4F6] border border-gray-200 outline-none focus:border-[#1E3A5F] transition-colors pr-9"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          {(totalUnread ?? 0) > 0 && (
            <span className="bg-[#E8F0FE] text-[#1E3A5F] text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          {tabs.map((tab) => {
            const hasUnread = tab === 'Worker' && (totalUnread ?? 0) > 0;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm pb-1 transition-colors relative ${
                  activeTab === tab
                    ? 'font-semibold text-gray-900 border-b-2 border-[#1E3A5F]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {hasUnread && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF4D4F] ml-0.5 -translate-y-1" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{activeTab}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {activeTab === 'Worker' && (
          <ContactList
            onSelectContact={onSelectContact}
            selectedContactId={selectedContactId}
            searchQuery={searchQuery}
            unreadCounts={unreadCounts}
          />
        )}
        {activeTab === 'Groups' && (
          <GroupList
            currentUserId={currentUserId ?? null}
            onSelectGroup={(group) => onSelectGroup?.(group)}
            selectedGroupId={selectedGroupId}
          />
        )}
        {activeTab === 'Support' && (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-400">Support conversations</p>
          </div>
        )}
      </div>
    </div>
  );
}
