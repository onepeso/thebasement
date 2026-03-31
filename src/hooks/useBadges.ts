"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Badge, UserBadge, BadgeWithStatus } from '@/types/database';
import { useToast } from '@/store/useToastStore';

const BADGE_ICONS: Record<string, string> = {
  'message': '💬',
  'message-circle': '💬',
  'message-square': '💬',
  'heart': '❤️',
  'pin': '📌',
  'plus-square': '➕',
  'layers': '📚',
  'log-in': '🚪',
  'flame': '🔥',
  'zap': '⚡',
  'at-sign': '@️',
  'corner-down-right': '↩️',
  'star': '⭐',
  'trophy': '🏆',
  'award': '🏅',
  'medal': '🎖️',
  'crown': '👑',
};

export function useBadges(userId?: string) {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgesWithStatus, setBadgesWithStatus] = useState<BadgeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const toast = useToast();
  const fetchingRef = useRef(false);
  const userIdRef = useRef(userId);

  const fetchBadges = useCallback(async () => {
    if (!userId || userId !== userIdRef.current) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);

    try {
      const [badgesRes, userBadgesRes] = await Promise.all([
        supabase.from('badges').select('*').order('requirement_value'),
        supabase.from('user_badges').select('*, badge:badges(*)').eq('user_id', userId),
      ]);

      if (userId !== userIdRef.current) return;

      if (badgesRes.data) {
        setAllBadges(badgesRes.data);
      }

      if (userBadgesRes.data) {
        setUserBadges(userBadgesRes.data);
      }

      const unlockedIds = new Set(userBadgesRes.data?.map((ub: any) => ub.badge_id) || []);
      
      const withStatus: BadgeWithStatus[] = (badgesRes.data || []).map((badge: Badge) => {
        const userBadge = userBadgesRes.data?.find((ub: any) => ub.badge_id === badge.id);
        return {
          ...badge,
          unlocked: unlockedIds.has(badge.id),
          unlocked_at: userBadge?.unlocked_at,
        };
      });

      setBadgesWithStatus(withStatus);
    } catch (err) {
      console.error('Error fetching badges:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    userIdRef.current = userId;
    if (!userId) {
      setBadgesWithStatus([]);
      setLoading(false);
      return;
    }

    fetchBadges();
  }, [userId, fetchBadges]);

  const checkAndUnlockBadge = async (requirementType: string, value: number) => {
    if (!userId) return;

    try {
      const { data: unlockedBadge } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_id', requirementType)
        .maybeSingle();

      if (unlockedBadge) return;

      const { data: badge } = await supabase
        .from('badges')
        .select('*')
        .eq('requirement_type', requirementType)
        .lte('requirement_value', value)
        .order('requirement_value', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!badge) return;

      const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badge.id)
        .maybeSingle();

      if (existing) return;

      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
        });

      if (!error) {
        setNewBadge(badge);
        setTimeout(() => setNewBadge(null), 5000);
        
        const updatedBadges = [...userBadges, { badge_id: badge.id, badge }];
        setUserBadges(updatedBadges as UserBadge[]);
        
        setBadgesWithStatus((prev) =>
          prev.map((b) =>
            b.id === badge.id ? { ...b, unlocked: true, unlocked_at: new Date().toISOString() } : b
          )
        );
      }
    } catch (err) {
      console.error('Error checking badge:', err);
    }
  };

  const getBadgeIcon = (iconName: string) => {
    return BADGE_ICONS[iconName] || '🏅';
  };

  const unlockedCount = badgesWithStatus.filter((b) => b.unlocked).length;
  const totalCount = badgesWithStatus.length;

  return {
    badges: badgesWithStatus,
    allBadges,
    userBadges,
    loading,
    unlockedCount,
    totalCount,
    newBadge,
    getBadgeIcon,
    refreshBadges: fetchBadges,
    checkAndUnlockBadge,
  };
}
