import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const CHANNEL_NAME = 'online-users';

let globalChannel: ReturnType<typeof supabase.channel> | null = null;

export async function cleanupPresence() {
  if (globalChannel) {
    globalChannel.untrack();
    globalChannel.unsubscribe();
    globalChannel = null;
  }
}

export function usePresence(userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const userIdRef = useRef(userId);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(CHANNEL_NAME);
    globalChannel = channel;

    const handleSync = () => {
      const state = channel.presenceState();
      // Get unique IDs and deduplicate
      const uniqueIds = [...new Set(Object.keys(state))];
      
      // If tracked, ensure current user is in the list
      if (hasTrackedRef.current && !uniqueIds.includes(userIdRef.current || '')) {
        uniqueIds.push(userIdRef.current || '');
      }
      
      setOnlineUsers(uniqueIds);
    };

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId });
          hasTrackedRef.current = true;
        }
      });

    return () => {
      channel.unsubscribe();
      globalChannel = null;
      hasTrackedRef.current = false;
    };
  }, [userId]);

  return onlineUsers;
}
