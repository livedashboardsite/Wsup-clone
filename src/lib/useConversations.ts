import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { fetchConversations } from './chat';
import { useAuth } from './auth';
import type { ConversationWithMeta } from '@/types/database';

/**
 * Loads the current user's conversations and keeps them in sync via Supabase
 * Realtime: new messages update the last_message + unread count, and new
 * conversation memberships add conversations to the list.
 */
export function useConversations() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const convs = await fetchConversations();
      setConversations(convs);
    } catch (err) {
      console.error('useConversations load error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Realtime subscriptions
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => setRefreshKey((k) => k + 1)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${profile.id}` },
        () => setRefreshKey((k) => k + 1)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${profile.id}` },
        () => setRefreshKey((k) => k + 1)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_receipts' },
        () => setRefreshKey((k) => k + 1)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'message_receipts' },
        () => setRefreshKey((k) => k + 1)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  return { conversations, loading, refresh: () => setRefreshKey((k) => k + 1) };
}
