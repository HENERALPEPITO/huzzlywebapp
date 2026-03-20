'use client';

import { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { Group, fetchGroups, createGroup } from '@/services/groups.service';
import CreateGroupModal from './CreateGroupModal';

interface GroupListProps {
  currentUserId: string | null;
  onSelectGroup: (group: Group) => void;
  selectedGroupId?: string;
}

const groupColors = ['#D1E8E5', '#E8D5B7', '#D4E8D1', '#D1D8E8', '#E8D1D8', '#E8E1D1'];

function getGroupColor(id: string): string {
  const sum = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return groupColors[sum % groupColors.length];
}

export default function GroupList({ currentUserId, onSelectGroup, selectedGroupId }: GroupListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    setIsLoading(true);
    fetchGroups(currentUserId)
      .then(setGroups)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUserId]);

  const handleCreateGroup = async (name: string, members: { user_id: string; user_name: string }[]) => {
    if (!currentUserId) return;
    setIsCreating(true);
    try {
      const newGroup = await createGroup(name, currentUserId, members);
      setGroups((prev) => [newGroup, ...prev]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 px-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="px-3 mb-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Create New Group</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="p-4 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No groups yet</p>
          <p className="text-xs text-gray-300 mt-1">Create a group to start messaging</p>
        </div>
      ) : (
        <div className="space-y-1">
          {groups.map((group) => {
            const isSelected = selectedGroupId === group.id;
            const memberCount = group.members?.length || 0;
            const memberNames = group.members
              ?.map((m) => m.user_name)
              .filter(Boolean)
              .slice(0, 3)
              .join(', ');

            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  isSelected ? 'bg-[#EDF2FF] shadow-sm' : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: getGroupColor(group.id) }}
                >
                  <Users className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{group.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {memberCount} member{memberCount !== 1 ? 's' : ''}{memberNames ? ` · ${memberNames}` : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}
