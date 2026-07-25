import { supabase } from './supabase';
import {
  ensureKeyPair,
  exportSymmetricKey,
  generateGroupKey,
  getPairwiseKey,
  importSymmetricKey,
  unwrapAndImportKey,
  wrapKey,
  type Base64,
} from './crypto';
import type { Profile } from '@/types/database';

/**
 * Manages the symmetric key for each conversation, with an in-memory cache.
 *
 * - 1:1 conversations: the key is derived on-the-fly from the local private
 *   key and the other user's public key via ECDH. No storage needed.
 * - Group conversations: the key is stored server-side wrapped per-member.
 *   The creator generates and distributes wraps; members fetch + unwrap.
 *
 * The cache holds CryptoKey objects keyed by conversation id.
 */
class KeyManager {
  private cache = new Map<string, CryptoKey>();
  private privateKey: CryptoKey | null = null;
  private userId: string | null = null;
  private publicKeyB64: Base64 | null = null;

  async init(userId: string): Promise<{ publicKeyB64: Base64; isNew: boolean }> {
    this.userId = userId;
    const { publicKeyB64, privateKey, isNew } = await ensureKeyPair(userId);
    this.privateKey = privateKey;
    this.publicKeyB64 = publicKeyB64;
    return { publicKeyB64, isNew };
  }

  getPublicKeyB64(): Base64 | null {
    return this.publicKeyB64;
  }

  clear() {
    this.cache.clear();
    this.privateKey = null;
    this.userId = null;
    this.publicKeyB64 = null;
  }

  /** Get or derive the AES-GCM key for a conversation. */
  async getConversationKey(
    conversationId: string,
    isGroup: boolean,
    members: Profile[]
  ): Promise<CryptoKey | null> {
    const cached = this.cache.get(conversationId);
    if (cached) return cached;

    if (!this.privateKey || !this.userId) return null;

    if (!isGroup) {
      const other = members.find((m) => m.id !== this.userId!);
      if (!other?.public_key) return null;
      const key = await getPairwiseKey(this.privateKey, other.public_key);
      this.cache.set(conversationId, key);
      return key;
    }

    // Group: try to fetch + unwrap our stored wrapped key.
    const { data, error } = await supabase
      .from('conversation_keys')
      .select('wrapped_key')
      .eq('conversation_id', conversationId)
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch wrapped key:', error.message);
      return null;
    }

    if (data?.wrapped_key) {
      // Need a pairwise key with the creator to unwrap.
      const creator = members.find((m) => m.id !== this.userId);
      if (!creator?.public_key) return null;
      const pairwise = await getPairwiseKey(this.privateKey, creator.public_key);
      const key = await unwrapAndImportKey(pairwise, data.wrapped_key);
      this.cache.set(conversationId, key);
      return key;
    }

    return null;
  }

  /**
   * Create and distribute a new group key. The creator generates a random
   * AES-GCM key, exports it, wraps it once per member with the pairwise shared
   * key (creator private + member public), and inserts all wraps.
   */
  async distributeGroupKey(
    conversationId: string,
    members: Profile[]
  ): Promise<void> {
    if (!this.privateKey || !this.userId) return;
    const groupKey = await generateGroupKey();
    const rawB64 = await exportSymmetricKey(groupKey);
    this.cache.set(conversationId, groupKey);

    const rows = await Promise.all(
      members.map(async (m) => {
        if (m.id === this.userId) {
          // Self: wrap with our own pairwise key so we can recover it.
          if (!m.public_key) return null;
          const pairwise = await getPairwiseKey(this.privateKey!, m.public_key);
          const wrapped = await wrapKey(pairwise, rawB64);
          return { conversation_id: conversationId, user_id: m.id, wrapped_key: wrapped };
        }
        if (!m.public_key) return null;
        const pairwise = await getPairwiseKey(this.privateKey!, m.public_key);
        const wrapped = await wrapKey(pairwise, rawB64);
        return { conversation_id: conversationId, user_id: m.id, wrapped_key: wrapped };
      })
    );

    const valid = rows.filter((r): r is NonNullable<typeof r> => r !== null);
    if (valid.length === 0) return;

    const { error } = await supabase.from('conversation_keys').upsert(valid, {
      onConflict: 'conversation_id,user_id',
    });
    if (error) console.error('Failed to distribute group key:', error.message);
  }

  /** Add a new member to an existing group by wrapping the current key for them. */
  async addMemberKey(
    conversationId: string,
    newMember: Profile,
    existingMembers: Profile[]
  ): Promise<void> {
    if (!this.privateKey || !this.userId) return;
    const key = await this.getConversationKey(conversationId, true, existingMembers);
    if (!key) return;
    if (!newMember.public_key) return;
    const rawB64 = await exportSymmetricKey(key);
    const pairwise = await getPairwiseKey(this.privateKey, newMember.public_key);
    const wrapped = await wrapKey(pairwise, rawB64);
    const { error } = await supabase.from('conversation_keys').upsert(
      {
        conversation_id: conversationId,
        user_id: newMember.id,
        wrapped_key: wrapped,
      },
      { onConflict: 'conversation_id,user_id' }
    );
    if (error) console.error('Failed to add member key:', error.message);
  }

  /** Decrypt a raw key string wrapped for the local user (utility). */
  async unwrapGroupKey(
    conversationId: string,
    wrappedKeyB64: Base64,
    creatorPublicKey: Base64
  ): Promise<CryptoKey | null> {
    if (!this.privateKey) return null;
    const pairwise = await getPairwiseKey(this.privateKey, creatorPublicKey);
    const key = await unwrapAndImportKey(pairwise, wrappedKeyB64);
    this.cache.set(conversationId, key);
    return key;
  }

  /** Import a raw base64 key directly (used when restoring cached keys). */
  async importRawKey(conversationId: string, rawB64: Base64): Promise<CryptoKey> {
    const key = await importSymmetricKey(rawB64);
    this.cache.set(conversationId, key);
    return key;
  }
}

export const keyManager = new KeyManager();
