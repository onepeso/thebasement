import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';

export function usePinnedMessages(channelId: string | undefined) {
  const { pinnedMessages, setPinnedMessages, addPinnedMessage, removePinnedMessage } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelIdRef = useRef(channelId);
  const isSubscribedRef = useRef(false);

  const fetchPinnedMessages = useCallback(async () => {
    if (!channelId || channelId !== channelIdRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('pinned_messages')
        .select(`
          *,
          message:messages(*, profiles:user_id(username, avatar_url))
        `)
        .eq('channel_id', channelId);

      if (channelId !== channelIdRef.current) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPinnedMessages(data || []);
        setError(null);
      }
    } catch (err) {
      if (channelId === channelIdRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pinned messages');
      }
    } finally {
      if (channelId === channelIdRef.current) {
        setLoading(false);
      }
    }
  }, [channelId, setPinnedMessages]);

  useEffect(() => {
    channelIdRef.current = channelId;
    isSubscribedRef.current = false;
    setError(null);

    if (!channelId) {
      setPinnedMessages([]);
      return;
    }

    fetchPinnedMessages();

    const channel = supabase
      .channel('pinned-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pinned_messages' },
        (payload) => {
          if (channelId !== channelIdRef.current || !isSubscribedRef.current) return;
          try {
            const newData = JSON.parse(JSON.stringify(payload.new)) as any;
            if (newData.channel_id === channelId) {
              addPinnedMessage(newData);
            }
          } catch (err) {
            console.error('Error handling pinned insert:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pinned_messages' },
        (payload) => {
          if (channelId !== channelIdRef.current || !isSubscribedRef.current) return;
          try {
            const oldData = JSON.parse(JSON.stringify(payload.old)) as Record<string, string>;
            removePinnedMessage(oldData.message_id);
          } catch (err) {
            console.error('Error handling pinned delete:', err);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });

    return () => {
      isSubscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [channelId, fetchPinnedMessages, addPinnedMessage, removePinnedMessage, setPinnedMessages]);

  const pinMessage = async (messageId: string, userId: string) => {
    if (!channelId) return { error: 'No channel selected' };

    const { data, error } = await supabase
      .from('pinned_messages')
      .insert({ message_id: messageId, channel_id: channelId, pinned_by: userId })
      .select(`
        *,
        message:messages(*, profiles:user_id(username, avatar_url))
      `)
      .single();

    if (error) {
      return { error: error.message };
    }

    if (data) {
      addPinnedMessage(data);
    }
    return { success: true };
  };

  const unpinMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('pinned_messages')
      .delete()
      .eq('message_id', messageId);
    
    if (error) {
      return { error: error.message };
    }
    
    removePinnedMessage(messageId);
    return { success: true };
  };

  const isPinned = (messageId: string) => {
    return pinnedMessages.some(p => p.message_id === messageId);
  };

  return { pinnedMessages, loading, error, pinMessage, unpinMessage, isPinned };
}
