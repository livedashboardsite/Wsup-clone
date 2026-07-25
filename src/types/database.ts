export type MessageStatus = 'sent' | 'delivered' | 'read';

export type MessageType = 'text' | 'image' | 'video' | 'document' | 'audio';

export interface Profile {
  id: string;
  name: string;
  phone_hash: string | null;
  phone_display: string | null;
  about: string;
  avatar_url: string | null;
  avatar_color: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  public_key: string | null;
  key_generated_at: string | null;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  avatar_color: string;
  created_by: string;
  created_at: string;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  joined_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  media_name: string | null;
  media_size: number | null;
  media_width: number | null;
  media_height: number | null;
  duration_sec: number | null;
  reply_to: string | null;
  encrypted: boolean;
  created_at: string;
  sender?: Profile;
}

export interface MessageReceipt {
  message_id: string;
  user_id: string;
  status: MessageStatus;
  updated_at: string;
}

export interface ConversationWithMeta extends Conversation {
  members: ConversationMember[];
  last_message?: Message | null;
  unread_count?: number;
}

export interface ConversationKey {
  conversation_id: string;
  user_id: string;
  wrapped_key: string;
  wrapped_at: string;
}
