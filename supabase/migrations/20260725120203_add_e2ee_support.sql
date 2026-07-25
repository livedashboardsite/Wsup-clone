/*
# End-to-end encryption support

Adds the columns and table needed for real client-side E2EE of message
bodies using the Web Crypto API (ECDH key agreement + AES-GCM symmetric
encryption).

1. Modified Tables
- profiles: add `public_key` (text, base64 SPKI ECDH public key) and
  `key_generated_at` (timestamptz). The private key never leaves the device
  (stored in browser localStorage); only the public key is published so
  other users can derive a shared secret.
- messages: add `encrypted` (boolean, default false). When true, `body`
  holds base64(iv || ciphertext) produced by AES-GCM with a shared key.

2. New Tables
- conversation_keys: per-member wrapped group key. For group chats the
  creator generates a random 256-bit AES key, wraps (encrypts) it once per
  member using the pairwise ECDH shared secret (creator private + member
  public), and stores the wrap here. Members fetch their wrap, unwrap it
  to recover the group key, and use it to encrypt/decrypt group messages.
  Columns: conversation_id, user_id, wrapped_key (base64 iv||ciphertext),
  wrapped_at. One row per member.

3. Security (RLS)
- conversation_keys: a user may read only their own wrapped key rows, and
  may insert wraps for conversations they are a member of (the creator
  distributes keys to existing members). Updates/deletes not needed.

4. Notes
- The server (Supabase) only ever relays encrypted blobs and public keys.
- Private keys are generated on-device and never transmitted or stored server-side.
- Metadata (type, media_url, timestamps) is not encrypted; only message bodies are.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_key text,
  ADD COLUMN IF NOT EXISTS key_generated_at timestamptz;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS encrypted boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS conversation_keys (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wrapped_key text NOT NULL,
  wrapped_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE conversation_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ckeys_select_own" ON conversation_keys;
CREATE POLICY "ckeys_select_own"
ON conversation_keys FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ckeys_insert_member" ON conversation_keys;
CREATE POLICY "ckeys_insert_member"
ON conversation_keys FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = conversation_keys.conversation_id
      AND cm.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_conversation_keys_user ON conversation_keys(user_id);
