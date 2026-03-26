import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DirectMessage, DMMessage } from '@/types/database';

const HIDDEN_DMS_KEY = 'thebasement_hidden_dms';

function getHiddenDMs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(HIDDEN_DMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addHiddenDM(dmId: string): void {
  if (typeof window === 'undefined') return;
  const hidden = getHiddenDMs();
  if (!hidden.includes(dmId)) {
    hidden.push(dmId);
    localStorage.setItem(HIDDEN_DMS_KEY, JSON.stringify(hidden));
  }
}

function removeHiddenDM(dmId: string): void {
  if (typeof window === 'undefined') return;
  const hidden = getHiddenDMs().filter(id => id !== dmId);
  localStorage.setItem(HIDDEN_DMS_KEY, JSON.stringify(hidden));
}

export function useDirectMessages(userId: string | undefined) {
  const [conversations, setConversations] = useState<DirectMessage[]>([]);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [activeDM, setActiveDM] = useState<DirectMessage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async (updateExisting = true) => {
    if (!userId) return;

    const hiddenDMs = getHiddenDMs();

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
      // Filter out hidden DMs
      const filtered = data.filter((dm: any) => !hiddenDMs.includes(dm.id));
      
      const enriched = filtered.map((dm: any) => ({
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

    // First, always check database for existing conversation (not just local state)
    const { data: existingData } = await supabase
      .from('direct_messages')
      .select(`
        *,
        user1:profiles!user1_id(id, username, avatar_url, status, avatar_effect, avatar_overlays),
        user2:profiles!user2_id(id, username, avatar_url, status, avatar_effect, avatar_overlays),
        last_message:dm_messages(id, text, created_at, sender_id)
      `)
      .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
      .single();

    if (existingData) {
      // Remove from hidden DMs if it was hidden before
      removeHiddenDM(existingData.id);
      
      const existing = {
        ...existingData,
        other_user: existingData.user1_id === userId ? existingData.user2 : existingData.user1,
        last_message: existingData.last_message?.[0] || null,
      };
      setActiveDM(existing);
      // Refresh conversations to show the DM again
      await fetchConversations(false);
      return existing;
    }

    // Create new conversation if none exists
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ user1_id: userId, user2_id: otherUserId })
      .select(`
        *,
        user1:profiles!user1_id(id, username, avatar_url, status, avatar_effect, avatar_overlays),
        user2:profiles!user2_id(id, username, avatar_url, status, avatar_effect, avatar_overlays),
        last_message:dm_messages(id, text, created_at, sender_id)
      `)
      .single();

    if (data) {
      const newDM = { 
        ...data, 
        other_user: data.user1_id === userId ? data.user2 : data.user1,
        last_message: data.last_message?.[0] || null
      };
      
      // Remove from hidden DMs if it was there
      removeHiddenDM(data.id);
      
      setConversations(prev => {
        // Check if already exists
        if (prev.some(dm => dm.id === data.id)) {
          return prev.map(dm => dm.id === data.id ? newDM : dm);
        }
        // Add new conversation at the beginning and sort
        const updated = [newDM, ...prev];
        return updated.sort((a, b) => {
          const dateA = new Date(a.last_message_at || a.created_at || 0).getTime();
          const dateB = new Date(b.last_message_at || b.created_at || 0).getTime();
          return dateB - dateA;
        });
      });
      
      // Force state update for the DM view
      setActiveDM(newDM);
      
      return newDM;
    }

    console.error('Error creating conversation:', error);
    return null;
  }, [userId]);

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

  const deleteConversation = useCallback(async (dmId: string) => {
    if (!userId) return;

    // Soft delete - hide from this user's view using localStorage
    addHiddenDM(dmId);
    
    setConversations(prev => prev.filter(dm => dm.id !== dmId));
    // Clear active DM if it was the deleted one
    setActiveDM(prev => prev?.id === dmId ? null : prev);
    setMessages([]);
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
    deleteConversation,
    loading,
    refreshConversations: fetchConversations,
  };
}
