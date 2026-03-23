import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DirectMessage, DMMessage } from '@/types/database';

export function useDirectMessages(userId: string | undefined) {
  const [conversations, setConversations] = useState<DirectMessage[]>([]);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [activeDM, setActiveDM] = useState<DirectMessage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async (updateExisting = true) => {
    if (!userId) return;

    const { data } = await supabase
      .from('direct_messages')
      .select(`
        *,
        user1:profiles!user1_id(id, username, avatar_url, status, avatar_effect, avatar_overlays),
        user2:profiles!user2_id(id, username, avatar_url, status, avatar_effect, avatar_overlays),
        last_message:dm_messages(id, text, created_at, sender_id)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (data) {
      const enriched = data.map((dm: any) => ({
        ...dm,
        other_user: dm.user1_id === userId ? dm.user2 : dm.user1,
        last_message: dm.last_message?.[0] || null,
      }));
      
      if (updateExisting) {
        setConversations(prev => {
          const existingMap = new Map(prev.map(dm => [dm.id, dm]));
          return enriched.map(newDm => ({
            ...newDm,
            other_user: existingMap.has(newDm.id) 
              ? { ...newDm.other_user, ...existingMap.get(newDm.id)?.other_user }
              : newDm.other_user
          }));
        });
      } else {
        setConversations(enriched);
      }
    }
    setLoading(false);
  }, [userId]);

  const fetchMessages = useCallback(async (dmId: string) => {
    const { data } = await supabase
      .from('dm_messages')
      .select('*, profiles:sender_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays)')
      .eq('dm_id', dmId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  }, []);

  const startConversation = useCallback(async (otherUserId: string) => {
    if (!userId) return null;

    const existing = conversations.find(
      dm => (dm.user1_id === userId && dm.user2_id === otherUserId) ||
            (dm.user1_id === otherUserId && dm.user2_id === userId)
    );

    if (existing) {
      setActiveDM(existing);
      return existing;
    }

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ user1_id: userId, user2_id: otherUserId })
      .select(`
        *,
        user1:profiles!user1_id(id, username, avatar_url, status, avatar_effect, avatar_overlays),
        user2:profiles!user2_id(id, username, avatar_url, status, avatar_effect, avatar_overlays)
      `)
      .single();

    if (data) {
      const newDM = { ...data, other_user: data.user1_id === userId ? data.user2 : data.user1 };
      setConversations(prev => [newDM, ...prev]);
      setActiveDM(newDM);
      return newDM;
    }

    return null;
  }, [userId, conversations]);

  const sendMessage = useCallback(async (dmId: string, text: string) => {
    if (!userId || !text.trim()) return;

    const { data } = await supabase
      .from('dm_messages')
      .insert({ dm_id: dmId, sender_id: userId, text })
      .select('*, profiles:sender_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays)')
      .single();

    if (data) {
      setMessages(prev => [...prev, data]);
      await supabase
        .from('direct_messages')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', dmId);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchConversations();

    const channel = supabase
      .channel('dm-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages'
      }, () => fetchConversations())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => fetchConversations())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations]);

  useEffect(() => {
    if (!activeDM) return;
    fetchMessages(activeDM.id);

    const channel = supabase
      .channel(`dm:${activeDM.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
        filter: `dm_id=eq.${activeDM.id}`
      }, () => fetchMessages(activeDM.id))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeDM, fetchMessages]);

  return {
    conversations,
    messages,
    activeDM,
    setActiveDM,
    startConversation,
    sendMessage,
    loading,
    refreshConversations: fetchConversations,
  };
}
