import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { Profile } from '@/types/database';

/**
 * Loads every registered profile except the current user, and keeps the list
 * live via Supabase Realtime so newly signed-up users appear in the contacts
 * panel immediately.
 */
export function useProfiles() {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let active = true;

    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', profile.id)
        .order('name', { ascending: true });
      if (!active) return;
      if (error) {
        console.error('useProfiles load error:', error.message);
      } else {
        setProfiles((data ?? []) as Profile[]);
      }
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel('profiles-directory')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const p = payload.new as Profile;
          if (p.id === profile.id) return;
          setProfiles((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const p = payload.new as Profile;
          setProfiles((prev) => prev.map((x) => (x.id === p.id ? p : x)));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [profile]);

  return { profiles, loading };
}
