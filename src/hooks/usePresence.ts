import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const CHANNEL_NAME = 'online-users';

let globalChannel: ReturnType<typeof supabase.channel> | null = null;
let globalUserId: string | null = null;

export async function cleanupPresence() {
  if (globalChannel && globalUserId) {
    try {
      await globalChannel.untrack();
    } catch (e) {
      // Ignore cleanup errors
    }
    globalChannel = null;
    globalUserId = null;
  }
}

export function usePresence(userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const userIdRef = useRef(userId);

  useEffect(() => {
    userIdRef.current = userId;
    globalUserId = userId || null;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    if (globalChannel) {
      globalChannel.unsubscribe();
    }

    const channel = supabase.channel(CHANNEL_NAME, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    globalChannel = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const ids = Object.keys(state);
        setOnlineUsers(ids);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => prev.filter(id => id !== key));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    const handleCleanup = async () => {
      if (globalChannel && userIdRef.current) {
        try {
          await globalChannel.untrack();
        } catch (e) {
          // Ignore cleanup errors
        }
        globalChannel = null;
      }
    };

    window.addEventListener('beforeunload', handleCleanup);

    return () => {
      window.removeEventListener('beforeunload', handleCleanup);
      handleCleanup();
    };
  }, [userId]);

  return onlineUsers;
}