import { useEffect, useRef } from 'react';
import { setPresence } from './chat';
import { useAuth } from './auth';

/**
 * Maintains the current user's presence: sets online on mount, sends a
 * heartbeat every 30s to keep last_seen fresh, and marks offline on
 * tab-hide / unload.
 */
export function usePresenceHeartbeat() {
  const { profile } = useAuth();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    setPresence(true);

    intervalRef.current = window.setInterval(() => {
      setPresence(true);
    }, 30000);

    const onVisibility = () => {
      if (document.hidden) setPresence(false);
      else setPresence(true);
    };
    const onBeforeUnload = () => {
      // best-effort; navigator.sendBeacon would be better but we use fetch via supabase
      setPresence(false);
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      setPresence(false);
    };
  }, [profile]);
}
