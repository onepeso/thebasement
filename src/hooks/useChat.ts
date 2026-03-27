import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';

const MESSAGE_LIMIT = 50;

export function useChat(channelId: string | undefined, userId: string | undefined) {
    const [messages, setMessages] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    const messageCache = useChatStore((state) => state.messageCache);
    const setMessageCache = useChatStore((state) => state.setMessageCache);
    const addMessagesToCache = useChatStore((state) => state.addMessagesToCache);

    useEffect(() => {
        if (!channelId || !userId) {
            setMessages([]);
            setHasMore(false);
            setLoading(false);
            return;
        }

        const cached = messageCache[channelId];
        if (cached && cached.messages.length > 0) {
            setMessages(cached.messages);
            setHasMore(cached.hasMore);
            setLoading(false);
            return;
        }

        setLoading(true);

        const fetchData = async () => {
            try {
                let query = supabase
                    .from('messages')
                    .select('*, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays)')
                    .eq('channel_id', channelId)
                    .order('created_at', { ascending: true })
                    .limit(MESSAGE_LIMIT);

                const { data: msgData } = await query;

                if (msgData && msgData.length > 0) {
                    const replyMsgIds = msgData
                        .filter((m: any) => m.reply_to_id)
                        .map((m: any) => m.reply_to_id);
                    
                    let replyMessagesMap = new Map();
                    if (replyMsgIds.length > 0) {
                        const replyMessagesResult = await supabase
                            .from('messages')
                            .select('*, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays)')
                            .in('id', replyMsgIds);
                        
                        if (replyMessagesResult.data) {
                            replyMessagesMap = new Map(replyMessagesResult.data.map((m: any) => [m.id, m]));
                        }
                    }
                    
                    const enrichedMessages = msgData.map((m: any) => ({
                        ...m,
                        reply_to: m.reply_to_id && replyMessagesMap.has(m.reply_to_id) ? {
                            ...replyMessagesMap.get(m.reply_to_id),
                            profiles: replyMessagesMap.get(m.reply_to_id)?.profiles
                        } : null
                    }));
                    
                    setMessages(enrichedMessages);
                    setHasMore(msgData.length === MESSAGE_LIMIT);
                    setMessageCache(channelId, {
                        messages: enrichedMessages,
                        hasMore: msgData.length === MESSAGE_LIMIT,
                        oldestMessageId: msgData[0]?.id || null
                    });
                } else {
                    setMessages([]);
                    setHasMore(false);
                    setMessageCache(channelId, {
                        messages: [],
                        hasMore: false,
                        oldestMessageId: null
                    });
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const msgSub = supabase.channel(`room:${channelId}`)
            .on('postgres_changes', { 
                event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` 
            }, async (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newMsg = JSON.parse(JSON.stringify(payload.new)) as any; 
                    const { data: prof } = await supabase.from('profiles').select('id, username, avatar_url, bio, status, avatar_effect, avatar_overlays').eq('id', newMsg.user_id).single();
                    
                    let replyToData = null;
                    if (newMsg.reply_to_id) {
                        const { data: replyMsg } = await supabase
                            .from('messages')
                            .select('*, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays)')
                            .eq('id', newMsg.reply_to_id)
                            .single();
                        replyToData = replyMsg;
                    }
                    
                    const enrichedMsg = { ...newMsg, profiles: prof, reply_to: replyToData };
                    setMessages(prev => [...prev, enrichedMsg]);
                    addMessagesToCache(channelId, [enrichedMsg]);
                }
                if (payload.eventType === 'UPDATE') {
                    const updatedMsg = JSON.parse(JSON.stringify(payload.new)) as any;
                    setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg, profiles: m.profiles } : m));
                }
                if (payload.eventType === 'DELETE') {
                    const oldMsg = JSON.parse(JSON.stringify(payload.old)) as any;
                    setMessages(prev => prev.filter(m => m.id !== oldMsg.id));
                }
            }).subscribe();

        return () => {
            supabase.removeChannel(msgSub);
        };
    }, [channelId, userId]);

    const loadMore = useCallback(async () => {
        if (!channelId || loadingMore || !hasMore) return;

        setLoadingMore(true);
        
        try {
            const oldestId = messageCache[channelId]?.oldestMessageId;
            if (!oldestId) {
                setHasMore(false);
                return;
            }

            const { data: oldestMsg } = await supabase
                .from('messages')
                .select('created_at')
                .eq('id', oldestId)
                .single();
            
            if (!oldestMsg) {
                setHasMore(false);
                return;
            }

            const { data: msgData } = await supabase
                .from('messages')
                .select('*, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays)')
                .eq('channel_id', channelId)
                .lt('created_at', oldestMsg.created_at)
                .order('created_at', { ascending: true })
                .limit(MESSAGE_LIMIT);

            if (msgData && msgData.length > 0) {
                const replyMsgIds = msgData
                    .filter((m: any) => m.reply_to_id)
                    .map((m: any) => m.reply_to_id);
                
                let replyMessagesMap = new Map();
                if (replyMsgIds.length > 0) {
                    const replyMessagesResult = await supabase
                        .from('messages')
                        .select('*, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays)')
                        .in('id', replyMsgIds);
                    
                    if (replyMessagesResult.data) {
                        replyMessagesMap = new Map(replyMessagesResult.data.map((m: any) => [m.id, m]));
                    }
                }
                
                const enrichedMessages = msgData.map((m: any) => ({
                    ...m,
                    reply_to: m.reply_to_id && replyMessagesMap.has(m.reply_to_id) ? {
                        ...replyMessagesMap.get(m.reply_to_id),
                        profiles: replyMessagesMap.get(m.reply_to_id)?.profiles
                    } : null
                }));
                
                const existingMessages = messageCache[channelId]?.messages || [];
                const newMessages = [...existingMessages, ...enrichedMessages];
                setMessages(newMessages);
                setMessageCache(channelId, {
                    messages: newMessages,
                    hasMore: msgData.length === MESSAGE_LIMIT,
                    oldestMessageId: msgData[0]?.id
                });
                setHasMore(msgData.length === MESSAGE_LIMIT);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more messages:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [channelId, loadingMore, hasMore, messageCache, setMessageCache]);

    return { messages, hasMore, loading, loadingMore, loadMore };
}
