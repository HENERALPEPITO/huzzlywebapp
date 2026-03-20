export interface GroupMember {
  user_id: string;
  user_name: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  members: GroupMember[];
}

let tablesInitialized = false;

async function ensureTables() {
  if (tablesInitialized) return;
  try {
    const res = await fetch('/api/groups/setup', { method: 'POST' });
    if (res.ok) {
      tablesInitialized = true;
    } else {
      console.error('Failed to initialize group tables:', await res.text());
    }
  } catch (err) {
    console.error('Failed to initialize group tables:', err);
  }
}

export async function fetchGroups(userId: string): Promise<Group[]> {
  await ensureTables();
  const res = await fetch(`/api/groups?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch groups');
  }
  return res.json();
}

export async function createGroup(
  name: string,
  createdBy: string,
  members: GroupMember[]
): Promise<Group> {
  await ensureTables();
  const res = await fetch('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, createdBy, members }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create group');
  }
  return res.json();
}

export async function addMembersToGroup(
  groupId: string,
  members: GroupMember[]
): Promise<Group> {
  const res = await fetch(`/api/groups/${groupId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ members }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add members');
  }
  return res.json();
}

export async function fetchUnreadCounts(userId: string): Promise<{ counts: Record<string, number>; total: number }> {
  const res = await fetch(`/api/unread-counts?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return { counts: {}, total: 0 };
  return res.json();
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  attachments: any;
  sent_at: string;
}

export async function fetchGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const res = await fetch(`/api/groups/${groupId}/messages`);
  if (!res.ok) return [];
  return res.json();
}

export async function sendGroupMessage(
  groupId: string,
  senderId: string,
  senderName: string,
  content: string,
  attachments?: any
): Promise<GroupMessage | null> {
  const res = await fetch(`/api/groups/${groupId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId, senderName, content, attachments }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send group message');
  }
  return res.json();
}
