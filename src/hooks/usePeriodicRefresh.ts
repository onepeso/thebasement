import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface UsePeriodicRefreshOptions {
  userId?: string;
  channels?: any[];
  activeChannel?: any | null;
  onRefreshChannels?: (channels: any[]) => void;
  onRefreshActiveChannel?: (channel: any) => void;
  onRefreshMemberCounts?: (counts: Record<string, number>) => void;
  onRefreshNotifications?: (notifications: any[]) => void;
}

export function usePeriodicRefresh({
  userId,
  channels = [],
  activeChannel,
  onRefreshChannels,
  onRefreshActiveChannel,
  onRefreshMemberCounts,
  onRefreshNotifications,
}: UsePeriodicRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshChannels = useCallback(async () => {
    if (!userId || !onRefreshChannels) return;

    const { data: memberData } = await supabase
      .from('channel_members')
      .select('channel_id')
      .eq('user_id', userId);

    const channelIds = memberData?.map((m: any) => m.channel_id) || [];

    const { data } = await supabase
      .from("channels")
      .select("*")
      .order("name");

    if (data) {
      const filteredChannels = data.filter((c: any) => {
        return !c.is_private || c.created_by === userId || channelIds.includes(c.id);
      });
      
      onRefreshChannels(filteredChannels);
      
      if (activeChannel && !filteredChannels.find((c: any) => c.id === activeChannel.id)) {
        const generalChannel = filteredChannels.find((c: any) => c.slug === "general");
        const newActive = generalChannel || filteredChannels[0] || null;
        if (newActive && onRefreshActiveChannel) {
          onRefreshActiveChannel(newActive);
        }
      }
    }
  }, [userId, activeChannel, onRefreshChannels, onRefreshActiveChannel]);

  const refreshMemberCounts = useCallback(async () => {
    if (!channels.length || !onRefreshMemberCounts) return;

    const channelIds = channels.map((c: any) => c.id);
    
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
      onRefreshMemberCounts(counts);
    }
  }, [channels, onRefreshMemberCounts]);

  const refreshNotifications = useCallback(async () => {
    if (!userId || !onRefreshNotifications) return;

    const { data } = await supabase
      .from('user_notifications')
      .select(`
        *,
        inviter:profiles!inviter_id(id, username, avatar_url, avatar_effect),
        channel:channels(id, name, description, color, emoji)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) {
      // Let the parent handle deduplication with seenNotificationIds
      onRefreshNotifications(data);
    }
  }, [userId, onRefreshNotifications]);

  const refresh = useCallback(async () => {
    await Promise.all([
      refreshChannels(),
      refreshMemberCounts(),
      refreshNotifications(),
    ]);
  }, [refreshChannels, refreshMemberCounts, refreshNotifications]);

  useEffect(() => {
    if (!userId) return;

    intervalRef.current = setInterval(() => {
      refresh();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, refresh]);

  return { refresh };
}
