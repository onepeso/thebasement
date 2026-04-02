import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseRealtimeChannelsOptions {
  userId?: string;
  onChannelsChange?: (channels: any[]) => void;
  onMemberCountsChange?: (counts: Record<string, number>) => void;
}

export function useRealtimeChannels({
  userId,
  onChannelsChange,
  onMemberCountsChange,
}: UseRealtimeChannelsOptions) {
  const channelSubRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const membersSubRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userIdRef = useRef(userId);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const fetchMemberCounts = useCallback(async (channelIds: string[]) => {
    if (!channelIds.length || !onMemberCountsChange) return;

    const { data } = await supabase
      .from('channel_members')
      .select('channel_id');

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((m: any) => {
        if (channelIds.includes(m.channel_id)) {
          counts[m.channel_id] = (counts[m.channel_id] || 0) + 1;
        }
      });
      onMemberCountsChange(counts);
    }
  }, [onMemberCountsChange]);

  useEffect(() => {
    if (!userId || !onChannelsChange) return;

    const channelIdsRef: string[] = [];

    const setupChannelSub = () => {
      if (channelSubRef.current) {
        supabase.removeChannel(channelSubRef.current);
      }

      channelSubRef.current = supabase
        .channel('public:channels')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'channels' },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newChannel = payload.new as any;
              if (!newChannel.is_private || newChannel.created_by === userIdRef.current) {
                const { data: memberData } = await supabase
                  .from('channel_members')
                  .select('channel_id')
                  .eq('user_id', userIdRef.current);

                const myChannelIds = memberData?.map((m: any) => m.channel_id) || [];
                if (!newChannel.is_private || newChannel.created_by === userIdRef.current || myChannelIds.includes(newChannel.id)) {
                  const { data: allData } = await supabase
                    .from('channels')
                    .select('*')
                    .order('name');

                  if (allData) {
                    const filtered = allData.filter((c: any) => {
                      return !c.is_private || c.created_by === userIdRef.current || myChannelIds.includes(c.id);
                    });
                    onChannelsChange(filtered);
                  }
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              const { data: memberData } = await supabase
                .from('channel_members')
                .select('channel_id')
                .eq('user_id', userIdRef.current);

              const myChannelIds = memberData?.map((m: any) => m.channel_id) || [];
              const { data: allData } = await supabase
                .from('channels')
                .select('*')
                .order('name');

              if (allData) {
                const filtered = allData.filter((c: any) => {
                  return !c.is_private || c.created_by === userIdRef.current || myChannelIds.includes(c.id);
                });
                onChannelsChange(filtered);
              }
            } else if (payload.eventType === 'DELETE') {
              const { data: allData } = await supabase
                .from('channels')
                .select('*')
                .order('name');

              if (allData) {
                const filtered = allData.filter((c: any) => {
                  return !c.is_private || c.created_by === userIdRef.current;
                });
                onChannelsChange(filtered);
              }
            }
          }
        )
        .subscribe();
    };

    const setupMembersSub = () => {
      if (membersSubRef.current) {
        supabase.removeChannel(membersSubRef.current);
      }

      membersSubRef.current = supabase
        .channel('public:channel_members')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'channel_members' },
          async () => {
            const { data: memberData } = await supabase
              .from('channel_members')
              .select('channel_id');

            if (memberData) {
              const counts: Record<string, number> = {};
              memberData.forEach((m: any) => {
                counts[m.channel_id] = (counts[m.channel_id] || 0) + 1;
              });
              onMemberCountsChange?.(counts);
            }
          }
        )
        .subscribe();
    };

    setupChannelSub();
    setupMembersSub();

    return () => {
      if (channelSubRef.current) {
        supabase.removeChannel(channelSubRef.current);
        channelSubRef.current = null;
      }
      if (membersSubRef.current) {
        supabase.removeChannel(membersSubRef.current);
        membersSubRef.current = null;
      }
    };
  }, [userId, onChannelsChange, onMemberCountsChange]);

  return { fetchMemberCounts };
}
