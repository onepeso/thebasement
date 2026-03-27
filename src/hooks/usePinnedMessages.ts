import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';

export function usePinnedMessages(channelId: string | undefined) {
  const { pinnedMessages, setPinnedMessages, addPinnedMessage, removePinnedMessage } = useChatStore();

  useEffect(() => {
    if (!channelId) return;

    setPinnedMessages([]);

    const fetchPinnedMessages = async () => {
      const { data } = await supabase
        .from('pinned_messages')
        .select(`
          *,
          message:messages(*, profiles:user_id(username, avatar_url))
        `)
        .eq('channel_id', channelId);

      if (data) {
        setPinnedMessages(data);
      }
    };

    fetchPinnedMessages();

    const channel = supabase
      .channel('pinned-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pinned_messages' },
        async (payload) => {
          const newData = JSON.parse(JSON.stringify(payload.new)) as Record<string, string>;
          const { data } = await supabase
            .from('pinned_messages')
            .select(`
              *,
              message:messages(*, profiles:user_id(username, avatar_url))
            `)
            .eq('id', newData.id)
            .single();
          
          if (data) {
            addPinnedMessage(JSON.parse(JSON.stringify(data)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pinned_messages' },
        (payload) => {
          const oldData = JSON.parse(JSON.stringify(payload.old)) as Record<string, string>;
          removePinnedMessage(oldData.message_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, setPinnedMessages, addPinnedMessage, removePinnedMessage]);

  const pinMessage = async (messageId: string, userId: string) => {
    if (!channelId) return;

    const { data, error } = await supabase
      .from('pinned_messages')
      .insert({ message_id: messageId, channel_id: channelId, pinned_by: userId })
      .select(`
        *,
        message:messages(*, profiles:user_id(username, avatar_url))
      `)
      .single();

    if (data && !error) {
      addPinnedMessage(data);
    }
  };

  const unpinMessage = async (messageId: string) => {
    await supabase
      .from('pinned_messages')
      .delete()
      .eq('message_id', messageId);
    
    removePinnedMessage(messageId);
  };

  const isPinned = (messageId: string) => {
    return pinnedMessages.some(p => p.message_id === messageId);
  };

  return { pinnedMessages, pinMessage, unpinMessage, isPinned };
}
