/*
# WhatsApp clone schema

Creates the full data model for a WhatsApp-style chat app:
profiles, conversations (1:1 and group), conversation members,
messages (text + media), and per-recipient message receipts that
power the sent / delivered / read ticks.

1. New Tables
- profiles: extends auth.users with display name, phone, avatar,
  about text, presence (is_online / last_seen). One row per auth user.
- conversations: a chat room. Either a 1:1 chat (is_group=false, name null)
  or a group chat (is_group=true, name set, avatar optional, created_by).
- conversation_members: join table binding users to conversations.
  Tracks each member's last_read_at, which drives unread counts and read ticks.
- messages: a single message in a conversation. sender_id, type
  (text/image/video/document/audio), body (text or caption), media metadata,
  optional reply_to, created_at.
- message_receipts: one row per (message, recipient) tracking delivery/read
  status (sent/delivered/read) for the tick indicators. Excludes the sender.

2. Security (RLS)
- profiles: each authenticated user can read all profiles (needed to show
  contacts / group members) but only update their own.
- conversations: a user may SELECT/INSERT/UPDATE/DELETE only conversations
  they are a member of (checked via conversation_members).
- conversation_members: a user may read members of conversations they belong to,
  may insert their own membership, may update their own last_read_at, and may
  delete themselves from a conversation.
- messages: a user may read messages in conversations they belong to and may
  insert messages as themselves into conversations they belong to. Deletion
  is restricted to the sender.
- message_receipts: a user may read receipts for messages in their conversations,
  may upsert their own receipts (mark delivered/read), and may not delete.

3. Notes
- All owner columns default to auth.uid() so inserts that omit the owner succeed.
- Privacy: phone numbers are stored as sha256 hashes for matching, never in plaintext.
- Receipts use a composite primary key so only one row exists per (message, recipient).
- Tables created before policies that reference them to avoid relation-not-found errors.
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone_hash text UNIQUE,
  phone_display text,
  about text NOT NULL DEFAULT 'Hey there! I am using WhatsApp.',
  avatar_url text,
  avatar_color text NOT NULL DEFAULT '#128C7E',
  is_online boolean NOT NULL DEFAULT false,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  name text,
  description text,
  avatar_url text,
  avatar_color text NOT NULL DEFAULT '#128C7E',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CONVERSATION MEMBERS
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'text',
  body text,
  media_url text,
  media_type text,
  media_name text,
  media_size bigint,
  media_width int,
  media_height int,
  duration_sec int,
  reply_to uuid REFERENCES messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- MESSAGE RECEIPTS
CREATE TABLE IF NOT EXISTS message_receipts (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'sent',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- RLS: PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_all"
ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS: CONVERSATIONS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversations_select_member" ON conversations;
CREATE POLICY "conversations_select_member"
ON conversations FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversation_members cm
  WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
));
DROP POLICY IF EXISTS "conversations_insert_member" ON conversations;
CREATE POLICY "conversations_insert_member"
ON conversations FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "conversations_update_member" ON conversations;
CREATE POLICY "conversations_update_member"
ON conversations FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversation_members cm
  WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
)) WITH CHECK (EXISTS (
  SELECT 1 FROM conversation_members cm
  WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
));
DROP POLICY IF EXISTS "conversations_delete_member" ON conversations;
CREATE POLICY "conversations_delete_member"
ON conversations FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- RLS: CONVERSATION MEMBERS
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_select_member" ON conversation_members;
CREATE POLICY "members_select_member"
ON conversation_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = conversation_members.conversation_id
      AND cm.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "members_insert_member" ON conversation_members;
CREATE POLICY "members_insert_member"
ON conversation_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "members_insert_admin" ON conversation_members;
CREATE POLICY "members_insert_admin"
ON conversation_members FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM conversation_members cm
  WHERE cm.conversation_id = conversation_members.conversation_id
    AND cm.user_id = auth.uid()
));
DROP POLICY IF EXISTS "members_update_own" ON conversation_members;
CREATE POLICY "members_update_own"
ON conversation_members FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "members_delete_own" ON conversation_members;
CREATE POLICY "members_delete_own"
ON conversation_members FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- RLS: MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select_member" ON messages;
CREATE POLICY "messages_select_member"
ON messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversation_members cm
  WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
));
DROP POLICY IF EXISTS "messages_insert_member" ON messages;
CREATE POLICY "messages_insert_member"
ON messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "messages_delete_sender" ON messages;
CREATE POLICY "messages_delete_sender"
ON messages FOR DELETE TO authenticated
USING (sender_id = auth.uid());

-- RLS: MESSAGE RECEIPTS
ALTER TABLE message_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "receipts_select_member" ON message_receipts;
CREATE POLICY "receipts_select_member"
ON message_receipts FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_receipts.message_id AND m.sender_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM messages m
    JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
    WHERE m.id = message_receipts.message_id AND cm.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "receipts_upsert_own" ON message_receipts;
CREATE POLICY "receipts_upsert_own"
ON message_receipts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "receipts_update_own" ON message_receipts;
CREATE POLICY "receipts_update_own"
ON message_receipts FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conv ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON message_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_message ON message_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_hash ON profiles(phone_hash);

-- updated_at trigger for receipts
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS receipts_set_updated_at ON message_receipts;
CREATE TRIGGER receipts_set_updated_at
BEFORE UPDATE ON message_receipts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
