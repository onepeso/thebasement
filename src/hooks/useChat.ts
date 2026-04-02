import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';

const MESSAGE_LIMIT = 50;

export function useChat(channelId: string | undefined, userId: string | undefined, onNewMessage?: (msg: any) => void) {
    const [messages, setMessages] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const messageCache = useChatStore((state) => state.messageCache);
    const setMessageCache = useChatStore((state) => state.setMessageCache);
    const lastReadTimestamps = useChatStore((state) => state.lastReadTimestamps);
    
    const fetchingRef = useRef(false);
    const channelIdRef = useRef(channelId);
    const isSubscribedRef = useRef(false);
    const initialFetchDoneRef = useRef(false);
    const optimisticMessagesRef = useRef<Set<string>>(new Set());

    const fetchData = useCallback(async (skipCache = false) => {
        if (!channelId || !userId || channelId !== channelIdRef.current) return;
        if (fetchingRef.current && !skipCache) return;
        
        fetchingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            if (!skipCache) {
                const cached = messageCache[channelId];
                if (cached && cached.messages.length > 0) {
                    setMessages(cached.messages);
                    setHasMore(cached.hasMore);
                    setLoading(false);
                    fetchingRef.current = false;
                    return;
                }
            }

            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select('*, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays, font_style, text_color)')
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true })
                .limit(MESSAGE_LIMIT);

            if (channelId !== channelIdRef.current) {
                fetchingRef.current = false;
                return;
            }

            if (msgError) {
                setError(msgError.message);
                setLoading(false);
                fetchingRef.current = false;
                return;
            }

            if (msgData && msgData.length > 0) {
                const replyMsgIds = msgData
                    .filter((m: any) => m.reply_to_id)
                    .map((m: any) => m.reply_to_id);
                
                let replyMessagesMap = new Map();
                if (replyMsgIds.length > 0) {
                    const replyMessagesResult = await supabase
                        .from('messages')
                        .select('*, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays, font_style, text_color)')
                        .in('id', replyMsgIds);
                    
                    if (replyMessagesResult.data && channelId === channelIdRef.current) {
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
            setError(null);
        } catch (err) {
            if (channelId === channelIdRef.current) {
                setError(err instanceof Error ? err.message : 'Failed to fetch messages');
            }
        } finally {
            if (channelId === channelIdRef.current) {
                setLoading(false);
            }
            fetchingRef.current = false;
        }
    }, [channelId, userId, setMessageCache]);

    useEffect(() => {
        channelIdRef.current = channelId;
        fetchingRef.current = false;
        isSubscribedRef.current = false;
        initialFetchDoneRef.current = false;
        setMessages([]);
        setError(null);
        setHasMore(false);
        
        if (!channelId || !userId) {
            setLoading(false);
            return;
        }

        fetchData(true);

        const msgSub = supabase.channel(`room:${channelId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages', 
                filter: `channel_id=eq.${channelId}` 
            }, async (payload) => {
                if (channelId !== channelIdRef.current) return;
                if (!isSubscribedRef.current) return;
                if (!initialFetchDoneRef.current) return;
                
                try {
                    const newMsg = JSON.parse(JSON.stringify(payload.new)) as any; 
                    
                    if (newMsg.is_optimistic) return;
                    
                    if (newMsg.user_id === userId) {
                        const optimisticMsg = Array.from(optimisticMessagesRef.current).find(id => {
                            return true;
                        });
                        if (optimisticMsg) {
                            optimisticMessagesRef.current.delete(optimisticMsg as string);
                            setMessages(prev => prev.filter((m: any) => m.id !== optimisticMsg));
                        }
                    }
                    
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('id, username, avatar_url, bio, status, avatar_effect, avatar_overlays, font_style, text_color')
                        .eq('id', newMsg.user_id)
                        .single();
                    
                    if (profileData) {
                        newMsg.profiles = profileData;
                    }
                    
                    if (newMsg.reply_to_id) {
                        const { data: replyMsg } = await supabase
                            .from('messages')
                            .select('id, text, user_id, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays, font_style, text_color)')
                            .eq('id', newMsg.reply_to_id)
                            .single();
                        
                        if (replyMsg) {
                            newMsg.reply_to = replyMsg;
                        }
                    }
                    
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    
                    const lastRead = lastReadTimestamps[channelIdRef.current || ''] || '1970-01-01';
                    if (newMsg.user_id !== userId && new Date(newMsg.created_at) > new Date(lastRead)) {
                        onNewMessage?.(newMsg);
                    }
                } catch (err) {
                    console.error('Error handling message insert:', err);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    isSubscribedRef.current = true;
                    initialFetchDoneRef.current = true;
                }
            });

        return () => {
            isSubscribedRef.current = false;
            initialFetchDoneRef.current = false;
            supabase.removeChannel(msgSub);
        };
    }, [channelId, userId, fetchData]);

    const loadMore = useCallback(async () => {
        if (!channelId || loadingMore || !hasMore) return;

        setLoadingMore(true);
        
        try {
            const oldestId = messageCache[channelId]?.oldestMessageId;
            if (!oldestId) {
                setHasMore(false);
                setLoadingMore(false);
                return;
            }

            const { data: oldestMsg } = await supabase
                .from('messages')
                .select('created_at')
                .eq('id', oldestId)
                .single();
            
            if (!oldestMsg) {
                setHasMore(false);
                setLoadingMore(false);
                return;
            }

            const { data: msgData } = await supabase
                .from('messages')
                .select('*, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays, font_style, text_color)')
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
                        .select('*, profiles:user_id(id, username, avatar_url, bio, status, avatar_effect, avatar_overlays, font_style, text_color)')
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
        } catch (err) {
            console.error('Error loading more messages:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [channelId, loadingMore, hasMore, messageCache, setMessageCache]);

    const deleteMessage = useCallback((messageId: string) => {
        const currentChannelId = channelIdRef.current;
        if (!currentChannelId) return;
        
        setMessages(prev => prev.filter((m: any) => m.id !== messageId));
        setMessageCache(currentChannelId, {
            messages: messageCache[currentChannelId]?.messages.filter((m: any) => m.id !== messageId) || [],
            hasMore: messageCache[currentChannelId]?.hasMore || false,
            oldestMessageId: messageCache[currentChannelId]?.oldestMessageId || null
        });
    }, [messageCache, setMessageCache]);

    const addOptimisticMessage = useCallback((message: any) => {
        optimisticMessagesRef.current.add(message.id);
        setMessages(prev => [...prev, message]);
        
        const currentChannelId = channelIdRef.current;
        if (currentChannelId) {
            const cached = messageCache[currentChannelId];
            if (cached) {
                setMessageCache(currentChannelId, {
                    ...cached,
                    messages: [...cached.messages, message]
                });
            }
        }
    }, [messageCache, setMessageCache]);

    return { messages, hasMore, loading, loadingMore, error, loadMore, deleteMessage, addOptimisticMessage };
}
