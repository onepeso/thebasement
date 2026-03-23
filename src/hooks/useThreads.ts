import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Thread, Message } from '@/types/database';

interface UseThreadsReturn {
  threads: Record<string, Thread>;
  threadMessages: Record<string, Message[]>;
  userThreads: Thread[];
  createThread: (channelId: string, rootMessageId: string, userId: string, username?: string) => Promise<string | null>;
  addThreadMessage: (threadId: string, text: string, userId: string, channelId: string, profile?: { username: string; avatar_url: string }) => Promise<void>;
  fetchThreadMessages: (threadId: string) => Promise<void>;
  fetchThread: (threadId: string) => Promise<void>;
  fetchUserThreads: (userId: string) => Promise<void>;
  deleteThread: (threadId: string, userId: string) => Promise<boolean>;
}

export function useThreads(): UseThreadsReturn {
  const [threads, setThreads] = useState<Record<string, Thread>>({});
  const [threadMessages, setThreadMessages] = useState<Record<string, Message[]>>({});
  const [userThreads, setUserThreads] = useState<Thread[]>([]);

  const createThread = useCallback(async (channelId: string, rootMessageId: string, userId: string, username?: string): Promise<string | null> => {
    // Check if thread already exists for this message
    const { data: existingThread } = await supabase
      .from('threads')
      .select()
      .eq('root_message_id', rootMessageId)
      .single();

    if (existingThread) {
      setThreads(prev => ({ ...prev, [existingThread.id]: existingThread }));
      return existingThread.id;
    }

    const { data, error } = await supabase
      .from('threads')
      .insert({
        channel_id: channelId,
        root_message_id: rootMessageId,
        created_by: userId,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating thread:', error);
      return null;
    }

    setThreads(prev => ({ ...prev, [data.id]: data }));
    
    const { error: updateError } = await supabase
      .from('messages')
      .update({ thread_id: data.id })
      .eq('id', rootMessageId);

    if (updateError) {
      console.error('Error updating message with thread_id:', updateError);
    }

    // Insert system message about thread
    await supabase.from('messages').insert({
      channel_id: channelId,
      user_id: userId,
      user_name: username || 'Someone',
      text: `started a thread`,
      thread_id: data.id,
    });

    return data.id;
  }, []);

  const fetchThreadMessages = useCallback(async (threadId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays)')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (data) {
      setThreadMessages(prev => ({ ...prev, [threadId]: data }));
    }
  }, []);

  const fetchThread = useCallback(async (threadId: string) => {
    const { data } = await supabase
      .from('threads')
      .select()
      .eq('id', threadId)
      .single();

    if (data) {
      setThreads(prev => ({ ...prev, [threadId]: data }));
    }
  }, []);

  const addThreadMessage = useCallback(async (threadId: string, text: string, userId: string, channelId: string, profile?: { username: string; avatar_url: string }) => {
    const username = profile?.username || 'Unknown';

    const { data, error } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        thread_id: threadId,
        user_id: userId,
        user_name: username,
        text,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding thread message:', error);
      return;
    }

    if (data) {
      const enrichedMsg = { ...data, profiles: profile };
      
      // Optimistically update local state first
      const currentCount = threads[threadId]?.reply_count || 0;
      const optimisticThread = {
        ...threads[threadId],
        reply_count: currentCount + 1,
        last_reply_at: new Date().toISOString()
      };
      
      setThreadMessages(prev => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), enrichedMsg],
      }));
      
      setThreads(prev => ({ ...prev, [threadId]: optimisticThread }));

      // Update reply count in database
      await supabase
        .from('threads')
        .update({
          reply_count: currentCount + 1,
          last_reply_at: new Date().toISOString()
        })
        .eq('id', threadId);
    }
  }, [threads]);

  useEffect(() => {
    const threadChannel = supabase
      .channel('threads-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'threads',
      }, (payload) => {
        const newThread = payload.new as Thread;
        if (payload.eventType === 'UPDATE' && newThread) {
          setThreads(prev => ({ ...prev, [newThread.id]: newThread }));
          setUserThreads(prev => prev.map(t => t.id === newThread.id ? { ...t, ...newThread } : t));
        }
        if (payload.eventType === 'INSERT' && newThread) {
          setThreads(prev => ({ ...prev, [newThread.id]: newThread }));
          setUserThreads(prev => [newThread, ...prev]);
        }
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('thread-messages-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg && newMsg.thread_id) {
          const threadId = newMsg.thread_id;
          setThreadMessages(prev => {
            const existing = prev[threadId] || [];
            if (existing.some(m => m.id === newMsg.id)) return prev;
            return { ...prev, [threadId]: [...existing, newMsg] };
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(threadChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  const fetchUserThreads = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('threads')
      .select('*, root_message:messages!root_message_id(text, created_at, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays))')
      .eq('created_by', userId)
      .order('last_reply_at', { ascending: false })
      .limit(20);

    if (data) {
      setUserThreads(data);
      data.forEach((thread: any) => {
        setThreads(prev => ({ ...prev, [thread.id]: thread }));
      });
    }
  }, []);

  const deleteThread = useCallback(async (threadId: string, userId: string): Promise<boolean> => {
    const thread = threads[threadId];
    if (!thread || thread.created_by !== userId) {
      return false;
    }

    // Clear thread_id on root message so it stays in channel
    await supabase
      .from('messages')
      .update({ thread_id: null })
      .eq('id', thread.root_message_id);

    // Delete thread replies (not the root message)
    await supabase
      .from('messages')
      .delete()
      .eq('thread_id', threadId)
      .neq('id', thread.root_message_id);

    // Delete the thread
    const { error } = await supabase
      .from('threads')
      .delete()
      .eq('id', threadId);

    if (error) {
      console.error('Error deleting thread:', error);
      return false;
    }

    setUserThreads(prev => prev.filter(t => t.id !== threadId));
    setThreads(prev => {
      const newThreads = { ...prev };
      delete newThreads[threadId];
      return newThreads;
    });
    setThreadMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[threadId];
      return newMessages;
    });

    return true;
  }, [threads]);

  return {
    threads,
    threadMessages,
    userThreads,
    createThread,
    addThreadMessage,
    fetchThreadMessages,
    fetchThread,
    fetchUserThreads,
    deleteThread,
  };
}
