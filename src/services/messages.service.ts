import { supabase } from '@/lib/supabaseClient';

export interface MessageRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  attachments: any | null;
  is_read: boolean;
  sent_at: string;
  shift_id: string | null;
}

export async function fetchMessages(
  currentUserId: string,
  otherUserId: string,
  shiftId?: string
): Promise<MessageRecord[]> {
  if (!currentUserId || !otherUserId) return [];

  let query = supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
    )
    .order('sent_at', { ascending: true });

  if (shiftId) {
    query = query.eq('shift_id', shiftId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return (data as MessageRecord[]) || [];
}

export interface SendMessageParams {
  senderId: string;
  receiverId: string;
  content: string;
  shiftId?: string;
}

export async function sendMessage({
  senderId,
  receiverId,
  content,
  shiftId,
}: SendMessageParams): Promise<MessageRecord | null> {
  const payload: Partial<MessageRecord> = {
    sender_id: senderId,
    receiver_id: receiverId,
    content,
    shift_id: shiftId ?? null,
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data as MessageRecord;
}

export interface SubscribeParams {
  currentUserId: string;
  otherUserId: string;
  shiftId?: string;
  onNewMessage: (message: MessageRecord) => void;
}

export function subscribeToMessages({
  currentUserId,
  otherUserId,
  shiftId,
  onNewMessage,
}: SubscribeParams): () => void {
  const channel = supabase
    .channel('realtime-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        const message = payload.new as MessageRecord;

        const isBetweenUsers =
          (message.sender_id === currentUserId && message.receiver_id === otherUserId) ||
          (message.sender_id === otherUserId && message.receiver_id === currentUserId);

        const shiftMatches = !shiftId || message.shift_id === shiftId;

        if (isBetweenUsers && shiftMatches) {
          onNewMessage(message);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markMessagesAsRead(
  currentUserId: string,
  otherUserId: string,
  shiftId?: string
): Promise<void> {
  if (!currentUserId || !otherUserId) return;

  let query = supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', currentUserId)
    .eq('sender_id', otherUserId)
    .eq('is_read', false);

  if (shiftId) {
    query = query.eq('shift_id', shiftId);
  }

  const { error } = await query;

  if (error) {
    console.error('Error marking messages as read:', error);
  }
}

