import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';

interface ReactionData {
  message_id: string;
  user_id: string;
  emoji: string;
}

interface GroupedReaction {
  message_id: string;
  emoji: string;
  count: number;
  userIds: string[];
}

export function useReactions(channelId: string | undefined) {
  const { reactions, setReactions, addReaction, removeReaction } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelIdRef = useRef(channelId);
  const isSubscribedRef = useRef(false);

  const fetchReactions = useCallback(async () => {
    if (!channelId || channelId !== channelIdRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id')
        .eq('channel_id', channelId);

      if (channelId !== channelIdRef.current) return;

      if (msgError) {
        setError(msgError.message);
        setLoading(false);
        return;
      }

      if (messages && messages.length > 0) {
        const messageIds = messages.map(m => m.id);
        
        const { data: reactionsData, error: reactionError } = await supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', messageIds);

        if (channelId !== channelIdRef.current) return;

        if (reactionError) {
          setError(reactionError.message);
        } else if (reactionsData && reactionsData.length > 0) {
          const grouped: Record<string, ReactionData[]> = {};
          reactionsData.forEach(r => {
            if (!grouped[r.message_id]) {
              grouped[r.message_id] = [];
            }
            grouped[r.message_id].push({
              message_id: r.message_id,
              user_id: r.user_id,
              emoji: r.emoji,
            });
          });

          Object.keys(grouped).forEach(msgId => {
            const emojiGroups: Record<string, GroupedReaction> = {};
            grouped[msgId].forEach(r => {
              if (!emojiGroups[r.emoji]) {
                emojiGroups[r.emoji] = { message_id: msgId, emoji: r.emoji, count: 0, userIds: [] };
              }
              emojiGroups[r.emoji].count++;
              emojiGroups[r.emoji].userIds.push(r.user_id);
            });
            setReactions(msgId, Object.values(emojiGroups));
          });
        }
        setError(null);
      }
    } catch (err) {
      if (channelId === channelIdRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reactions');
      }
    } finally {
      if (channelId === channelIdRef.current) {
        setLoading(false);
      }
    }
  }, [channelId, setReactions]);

  useEffect(() => {
    channelIdRef.current = channelId;
    isSubscribedRef.current = false;
    setError(null);

    if (!channelId) return;

    fetchReactions();

    const channel = supabase
      .channel('reactions-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reactions' },
        (payload) => {
          if (channelId !== channelIdRef.current || !isSubscribedRef.current) return;
          try {
            const newData = JSON.parse(JSON.stringify(payload.new)) as Record<string, string>;
            addReaction(newData.message_id, newData.emoji, newData.user_id);
          } catch (err) {
            console.error('Error handling reaction insert:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'message_reactions' },
        (payload) => {
          if (channelId !== channelIdRef.current || !isSubscribedRef.current) return;
          try {
            const oldData = JSON.parse(JSON.stringify(payload.old)) as Record<string, string>;
            removeReaction(oldData.message_id, oldData.emoji, oldData.user_id);
          } catch (err) {
            console.error('Error handling reaction delete:', err);
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
  }, [channelId, fetchReactions, addReaction, removeReaction]);

  const toggleReaction = async (messageId: string, emoji: string, userId: string) => {
    const messageReactions = reactions[messageId] || [];
    const existingReaction = messageReactions.find(r => r.emoji === emoji);
    
    if (existingReaction?.userIds.includes(userId)) {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);
      if (error) {
        return { error: error.message };
      }
      removeReaction(messageId, emoji, userId);
    } else {
      const { error } = await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: userId, emoji });
      if (error) {
        return { error: error.message };
      }
      addReaction(messageId, emoji, userId);
    }
    return { success: true };
  };

  return { reactions, loading, error, toggleReaction };
}
