import { useEffect } from 'react';
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

  useEffect(() => {
    if (!channelId) return;

    const fetchReactions = async () => {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id')
        .eq('channel_id', channelId);

      if (msgError || !messages) return;

      if (messages.length > 0) {
        const messageIds = messages.map(m => m.id);
        
        const { data: reactionsData, error: reactionError } = await supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', messageIds);

        if (reactionError || !reactionsData) return;

        if (reactionsData.length > 0) {
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
      }
    };

    fetchReactions();

    const channel = supabase
      .channel('reactions-changes')
        .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const newData = JSON.parse(JSON.stringify(payload.new)) as Record<string, string>;
          const oldData = JSON.parse(JSON.stringify(payload.old)) as Record<string, string>;
          if (payload.eventType === 'INSERT') {
            addReaction(newData.message_id, newData.emoji, newData.user_id);
          } else if (payload.eventType === 'DELETE') {
            removeReaction(oldData.message_id, oldData.emoji, oldData.user_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, setReactions, addReaction, removeReaction]);

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
        console.error('[Reactions] Delete error:', error);
        return;
      }
      removeReaction(messageId, emoji, userId);
    } else {
      const { error } = await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: userId, emoji });
      if (error) {
        console.error('[Reactions] Insert error:', error);
        return;
      }
      addReaction(messageId, emoji, userId);
    }
  };

  return { reactions, toggleReaction };
}
