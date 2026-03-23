import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

interface TypingState {
  [channelId: string]: TypingUser[];
}

const TYPING_TIMEOUT = 3000;

export function useTyping(userId: string | undefined, username: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<TypingState>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const clearTypingTimeout = useCallback((channelId: string) => {
    if (typingTimeoutRef.current[channelId]) {
      clearTimeout(typingTimeoutRef.current[channelId]);
      delete typingTimeoutRef.current[channelId];
    }
  }, []);

  const startTyping = useCallback(async (channelId: string) => {
    if (!userId || !username) return;

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId,
          username,
          channelId,
          timestamp: Date.now(),
        },
      });
    }

    clearTypingTimeout(channelId);
    typingTimeoutRef.current[channelId] = setTimeout(() => {
      stopTyping(channelId);
    }, TYPING_TIMEOUT);
  }, [userId, username, clearTypingTimeout]);

  const stopTyping = useCallback(async (channelId: string) => {
    if (!userId || !username) return;

    clearTypingTimeout(channelId);

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: {
          userId,
          channelId,
        },
      });
    }
  }, [userId, username, clearTypingTimeout]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('typing-indicators', {
      config: {
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === userId) return;
        
        setTypingUsers((prev) => {
          const channelTyping = prev[payload.channelId] || [];
          const filtered = channelTyping.filter((u) => u.userId !== payload.userId);
          const updated = {
            ...prev,
            [payload.channelId]: [
              ...filtered,
              {
                userId: payload.userId,
                username: payload.username,
                timestamp: payload.timestamp,
              },
            ],
          };
          return updated;
        });

        setTimeout(() => {
          setTypingUsers((prev) => {
            const channelTyping = prev[payload.channelId] || [];
            return {
              ...prev,
              [payload.channelId]: channelTyping.filter(
                (u) => u.userId !== payload.userId
              ),
            };
          });
        }, TYPING_TIMEOUT);
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
        if (payload.userId === userId) return;
        
        setTypingUsers((prev) => ({
          ...prev,
          [payload.channelId]: (prev[payload.channelId] || []).filter(
            (u) => u.userId !== payload.userId
          ),
        }));
      })
      .subscribe();

    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      channel.unsubscribe();
    };
  }, [userId]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}
