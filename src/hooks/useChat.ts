import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useChat(channelId: string | undefined, userId: string | undefined) {
    const [messages, setMessages] = useState<any[]>([]);
    const [receipts, setReceipts] = useState<any[]>([]);

    useEffect(() => {
        if (!channelId || !userId) return;

        const fetchInitialData = async () => {
            const { data: msgData } = await supabase
                .from('messages')
                .select('*')
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true });
            
            if (msgData) {
                const replyMsgIds = msgData
                    .filter((m: any) => m.reply_to_id)
                    .map((m: any) => m.reply_to_id);
                
                const replyMessagesResult = replyMsgIds.length > 0 
                    ? await supabase
                        .from('messages')
                        .select('*, profiles:user_id(username, avatar_url)')
                        .in('id', replyMsgIds)
                    : { data: [] };
                
                const replyMessagesMap = new Map((replyMessagesResult.data || []).map((m: any) => [m.id, m]));
                
                const [msgWithProfiles] = await Promise.all([
                    supabase
                        .from('messages')
                        .select('*, profiles:user_id(username, avatar_url)')
                        .eq('channel_id', channelId)
                        .order('created_at', { ascending: true })
                ]);
                
                const enrichedMessages = (msgWithProfiles.data || []).map((m: any) => ({
                    ...m,
                    reply_to: m.reply_to_id && replyMessagesMap.has(m.reply_to_id) ? {
                        ...replyMessagesMap.get(m.reply_to_id),
                        profiles: replyMessagesMap.get(m.reply_to_id)?.profiles
                    } : null
                }));
                
                setMessages(enrichedMessages);
            }

            const { data: recData } = await supabase
                .from('read_receipts')
                .select('*')
                .eq('channel_id', channelId);
            if (recData) setReceipts(recData);
        };

        fetchInitialData();

        const msgSub = supabase.channel(`room:${channelId}`)
            .on('postgres_changes', { 
                event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` 
            }, async (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newMsg = JSON.parse(JSON.stringify(payload.new)) as any; 
                    const { data: prof } = await supabase.from('profiles').select('username, avatar_url').eq('id', newMsg.user_id).single();
                    
                    let replyToData = null;
                    if (newMsg.reply_to_id) {
                        const { data: replyMsg } = await supabase
                            .from('messages')
                            .select('*, profiles:user_id(username, avatar_url)')
                            .eq('id', newMsg.reply_to_id)
                            .single();
                        replyToData = replyMsg;
                    }
                    
                    setMessages(prev => [...prev, { ...newMsg, profiles: prof, reply_to: replyToData }]);
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

        const receiptSub = supabase.channel(`receipts:${channelId}`)
            .on('postgres_changes', { 
                event: '*', schema: 'public', table: 'read_receipts', filter: `channel_id=eq.${channelId}` 
            }, (payload) => {
                const newReceipt = JSON.parse(JSON.stringify(payload.new)) as any;
                setReceipts(prev => {
                    const filtered = prev.filter(r => r.user_id !== newReceipt.user_id);
                    return [...filtered, newReceipt];
                });
            }).subscribe();

        return () => {
            supabase.removeChannel(msgSub);
            supabase.removeChannel(receiptSub);
        };
    }, [channelId, userId]);

    return { messages, receipts };
}