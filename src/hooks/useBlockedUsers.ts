import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useBlockedUsers(userId: string | undefined) {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchBlockedUsers = useCallback(async () => {
    if (!userId || typeof userId !== 'string') {
      setBlockedIds(new Set());
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('blocked_users')
      .select('blocked_user_id')
      .eq('user_id', userId);

    if (data) {
      setBlockedIds(new Set(data.map(b => b.blocked_user_id)));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const isBlocked = useCallback((userIdToCheck: string) => {
    return blockedIds.has(userIdToCheck);
  }, [blockedIds]);

  return { blockedIds: Array.from(blockedIds), isBlocked, loading, refetch: fetchBlockedUsers };
}
