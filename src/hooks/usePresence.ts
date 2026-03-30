import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const CHANNEL_NAME = 'online-users';

let globalChannel: ReturnType<typeof supabase.channel> | null = null;

export function usePresence(userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const fetchOnlineUsers = useCallback(() => {
    if (!globalChannel) return;
    const state = globalChannel.presenceState();
    const users: string[] = [];
    Object.values(state).forEach((presences: any[]) => {
      presences.forEach((p: any) => {
        if (p.user_id && typeof p.user_id === 'string') {
          users.push(p.user_id);
        }
      });
    });
    const unique = [...new Set(users)];
    setOnlineUsers(unique);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(CHANNEL_NAME);
    globalChannel = channel;

    channel
      .on('presence', { event: 'sync' }, fetchOnlineUsers)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            user_id: userId, 
            online_at: new Date().toISOString() 
          });
          setTimeout(fetchOnlineUsers, 100);
        }
      });

    return () => {
      channel.unsubscribe();
      globalChannel = null;
    };
  }, [userId, fetchOnlineUsers]);

  return onlineUsers;
}

export async function cleanupPresence() {
  if (globalChannel) {
    await globalChannel.untrack();
    globalChannel.unsubscribe();
    globalChannel = null;
  }
}
