import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function usePresence(userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    // 1. Don't do anything if we don't have a user yet
    if (!userId) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Convert the presence state object into a simple array of user IDs
        const ids = Object.keys(state);
        setOnlineUsers(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // 2. Broadcast our presence as soon as we connect
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]); // 3. IMPORTANT: userId must be in the dependency array

  return onlineUsers;
}