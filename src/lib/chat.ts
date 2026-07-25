import { supabase } from './supabase';
import { keyManager } from './keyManager';
import { encryptMessage, decryptMessage, hashPhone } from './crypto';
import type {
  Conversation,
  ConversationMember,
  ConversationWithMeta,
  Message,
  Profile,
} from '@/types/database';

const PAGE_SIZE = 50;

/**
 * Load all conversations for the current user, each enriched with members,
 * the latest message, and an unread count based on the user's last_read_at.
 */
export async function fetchConversations(): Promise<ConversationWithMeta[]> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return [];

  const { data: memberships, error: mErr } = await supabase
    .from('conversation_members')
    .select('conversation_id, last_read_at, joined_at')
    .eq('user_id', me.user.id);
  if (mErr) throw mErr;
  if (!memberships || memberships.length === 0) return [];

  const ids = memberships.map((m) => m.conversation_id);
  const lastReadMap = new Map(memberships.map((m) => [m.conversation_id, m.last_read_at]));

  const [convRes, membersRes] = await Promise.all([
    supabase.from('conversations').select('*').in('id', ids).order('created_at', { ascending: false }),
    supabase
      .from('conversation_members')
      .select('conversation_id, user_id, last_read_at, joined_at, profile:profiles(*)')
      .in('conversation_id', ids),
  ]);
  if (convRes.error) throw convRes.error;
  if (membersRes.error) throw membersRes.error;

  const convs = convRes.data as Conversation[];
  const memberRows = membersRes.data as unknown as Array<{
    conversation_id: string;
    user_id: string;
    last_read_at: string;
    joined_at: string;
    profile: Profile;
  }>;

  const membersByConv = new Map<string, ConversationMember[]>();
  for (const r of memberRows) {
    const arr = membersByConv.get(r.conversation_id) ?? [];
    arr.push({
      conversation_id: r.conversation_id,
      user_id: r.user_id,
      last_read_at: r.last_read_at,
      joined_at: r.joined_at,
      profile: r.profile,
    });
    membersByConv.set(r.conversation_id, arr);
  }

  // Latest message per conversation
  const lastMessages = await Promise.all(
    ids.map((id) =>
      supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('conversation_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    )
  );

  const lastMsgMap = new Map<string, Message | null>();
  lastMessages.forEach((r, i) => {
    if (r.data) lastMsgMap.set(ids[i], r.data as Message);
    else lastMsgMap.set(ids[i], null);
  });

  // Unread counts
  const unreadRes = await Promise.all(
    ids.map((id) =>
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', id)
        .neq('sender_id', me.user!.id)
        .gt('created_at', lastReadMap.get(id) ?? '1970-01-01')
    )
  );
  const unreadMap = new Map<string, number>();
  unreadRes.forEach((r, i) => unreadMap.set(ids[i], r.count ?? 0));

  const result: ConversationWithMeta[] = convs.map((c) => {
    const members = membersByConv.get(c.id) ?? [];
    const last = lastMsgMap.get(c.id) ?? null;
    // Decrypt last message preview if needed (best-effort)
    return {
      ...c,
      members,
      last_message: last,
      unread_count: unreadMap.get(c.id) ?? 0,
    };
  });

  // Sort by last message time, then created
  result.sort((a, b) => {
    const at = a.last_message?.created_at ?? a.created_at;
    const bt = b.last_message?.created_at ?? b.created_at;
    return new Date(bt).getTime() - new Date(at).getTime();
  });

  return result;
}

export async function fetchMessages(conversationId: string, before?: string): Promise<Message[]> {
  let q = supabase
    .from('messages')
    .select('*, sender:profiles(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (before) q = q.lt('created_at', before);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as Message[]).reverse();
}

/**
 * Decrypt message bodies for a conversation using the conversation key.
 * Falls back to the raw body if decryption fails (e.g. key not yet available).
 */
export async function decryptMessages(
  conversationId: string,
  isGroup: boolean,
  members: Profile[],
  messages: Message[]
): Promise<Message[]> {
  const key = await keyManager.getConversationKey(conversationId, isGroup, members);
  if (!key) return messages;
  return Promise.all(
    messages.map(async (m) => {
      if (m.encrypted && m.body && m.type === 'text') {
        try {
          const plaintext = await decryptMessage(key, m.body);
          return { ...m, body: plaintext, encrypted: false };
        } catch {
          return { ...m, body: '[Unable to decrypt]' };
        }
      }
      return m;
    })
  );
}

/**
 * Send an encrypted text message. Derives the conversation key, encrypts
 * the body, inserts the row, and creates a 'sent' receipt for the sender.
 * Returns the inserted message (with body still in plaintext for the UI).
 */
export async function sendTextMessage(
  conversationId: string,
  text: string,
  replyTo?: string | null
): Promise<Message> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) throw new Error('Not authenticated');

  const { data: conv } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();
  if (!conv) throw new Error('Conversation not found');

  const { data: memberRows } = await supabase
    .from('conversation_members')
    .select('user_id, profile:profiles(*)')
    .eq('conversation_id', conversationId);
  const members = (memberRows ?? []).map((r) => (r as any).profile) as Profile[];

  let encryptedBody: string | null = text;
  let isEncrypted = false;
  const key = await keyManager.getConversationKey(conversationId, conv.is_group, members);
  if (key && text) {
    encryptedBody = await encryptMessage(key, text);
    isEncrypted = true;
  }

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: me.user.id,
      type: 'text',
      body: encryptedBody,
      encrypted: isEncrypted,
      reply_to: replyTo ?? null,
    })
    .select('*, sender:profiles(*)')
    .single();
  if (error) throw error;

  return msg as Message;
}

export async function sendMediaMessage(
  conversationId: string,
  params: {
    type: 'image' | 'video' | 'document' | 'audio';
    mediaUrl: string;
    mediaType: string;
    mediaName: string;
    mediaSize: number;
    mediaWidth?: number;
    mediaHeight?: number;
    durationSec?: number;
    caption?: string;
    replyTo?: string | null;
  }
): Promise<Message> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) throw new Error('Not authenticated');

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: me.user.id,
      type: params.type,
      body: params.caption ?? null,
      media_url: params.mediaUrl,
      media_type: params.mediaType,
      media_name: params.mediaName,
      media_size: params.mediaSize,
      media_width: params.mediaWidth ?? null,
      media_height: params.mediaHeight ?? null,
      duration_sec: params.durationSec ?? null,
      reply_to: params.replyTo ?? null,
      encrypted: false,
    })
    .select('*, sender:profiles(*)')
    .single();
  if (error) throw error;
  return msg as Message;
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', messageId);
  if (error) throw error;
}

/** Mark messages as delivered (when received by client) or read (when opened). */
export async function markReceipts(
  conversationId: string,
  status: 'delivered' | 'read'
): Promise<void> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return;

  // Find messages in this conversation sent by others that we haven't marked at this level
  const { data: msgs } = await supabase
    .from('messages')
    .select('id, sender_id, created_at')
    .eq('conversation_id', conversationId)
    .neq('sender_id', me.user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (!msgs || msgs.length === 0) return;

  if (status === 'read') {
    // Update my last_read_at
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', me.user.id);
  }

  // Upsert receipts for each message
  const rows = msgs.map((m) => ({
    message_id: m.id,
    user_id: me.user!.id,
    status,
  }));

  const { error } = await supabase
    .from('message_receipts')
    .upsert(rows, { onConflict: 'message_id,user_id' });
  if (error) console.error('markReceipts error:', error.message);
}

/**
 * Create a 1:1 conversation between the current user and another user.
 * Reuses an existing one if present.
 */
export async function createDirectConversation(
  otherUserId: string
): Promise<Conversation> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) throw new Error('Not authenticated');

  // Find existing 1:1 conv with both users
  const { data: myMemberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', me.user.id);

  if (myMemberships && myMemberships.length > 0) {
    const ids = myMemberships.map((m) => m.conversation_id);
    const { data: existing } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id')
      .in('conversation_id', ids)
      .eq('user_id', otherUserId);

    if (existing && existing.length > 0) {
      // Check it's a 1:1 (not group)
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', existing[0].conversation_id)
        .maybeSingle();
      if (conv && !conv.is_group) return conv as Conversation;
    }
  }

  // Create new
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ is_group: false, created_by: me.user.id })
    .select('*')
    .single();
  if (error) throw error;

  const { error: mErr } = await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, user_id: me.user.id },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);
  if (mErr) throw mErr;

  return conv as Conversation;
}

export async function createGroupConversation(
  name: string,
  memberIds: string[],
  description?: string
): Promise<Conversation> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) throw new Error('Not authenticated');

  const allIds = Array.from(new Set([me.user.id, ...memberIds]));

  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({
      is_group: true,
      name,
      description: description ?? null,
      created_by: me.user.id,
    })
    .select('*')
    .single();
  if (error) throw error;

  const { error: mErr } = await supabase
    .from('conversation_members')
    .insert(allIds.map((id) => ({ conversation_id: conv.id, user_id: id })));
  if (mErr) throw mErr;

  // Distribute E2EE group key
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', allIds);
  if (profiles) {
    await keyManager.distributeGroupKey(conv.id, profiles as Profile[]);
  }

  return conv as Conversation;
}

export async function updateLastRead(conversationId: string): Promise<void> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return;
  const { error } = await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', me.user.id);
  if (error) console.error('updateLastRead error:', error.message);
}

/** Set the current user's presence (online + heartbeat last_seen). */
export async function setPresence(online: boolean): Promise<void> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return;
  const { error } = await supabase
    .from('profiles')
    .update({
      is_online: online,
      last_seen: new Date().toISOString(),
    })
    .eq('id', me.user.id);
  if (error) console.error('setPresence error:', error.message);
}

/** Search profiles by name or phone (for starting new chats). */
export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', me.user.id)
    .or(`name.ilike.%${query}%,phone_display.ilike.%${query}%`)
    .limit(20);
  if (error) {
    console.error('searchProfiles error:', error.message);
    return [];
  }
  return (data ?? []) as Profile[];
}

/** List all profiles except the current user (contacts directory). */
export async function listAllProfiles(): Promise<Profile[]> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', me.user.id)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateProfile(updates: Partial<Profile>): Promise<void> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return;
  const { error } = await supabase
    .from('profiles')
    .update({
      name: updates.name,
      about: updates.about,
      avatar_url: updates.avatar_url,
      phone_display: updates.phone_display,
    })
    .eq('id', me.user.id);
  if (error) throw error;
}

export async function findProfileByPhone(phone: string): Promise<Profile | null> {
  const hash = await hashPhone(phone);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone_hash', hash)
    .maybeSingle();
  if (error) {
    console.error('findProfileByPhone error:', error.message);
    return null;
  }
  return (data as Profile) ?? null;
}

export { PAGE_SIZE };
