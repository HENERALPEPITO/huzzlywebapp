import { supabase } from '@/lib/supabaseClient';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

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
  attachments?: { fileUrl: string; fileName: string; fileSize: number; fileType: string } | null;
}

export async function sendMessage({
  senderId,
  receiverId,
  content,
  shiftId,
  attachments,
}: SendMessageParams): Promise<MessageRecord | null> {
  const payload: Record<string, any> = {
    sender_id: senderId,
    receiver_id: receiverId,
    content,
    shift_id: shiftId ?? null,
  };

  if (attachments) {
    payload.attachments = attachments;
  }

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

export async function uploadMessageFile(
  file: File,
  senderId: string,
): Promise<{ fileUrl: string; fileName: string; fileSize: number; fileType: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `message_attachments/${senderId}_${timestamp}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('message-files')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw uploadError;
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from('message-files')
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (signedError || !signedData?.signedUrl) {
    console.error('Error creating signed URL:', signedError);
    throw signedError || new Error('Failed to create signed URL');
  }

  return {
    fileUrl: signedData.signedUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/octet-stream',
  };
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
      (payload: RealtimePostgresInsertPayload<MessageRecord>) => {
        const message = payload.new;

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

