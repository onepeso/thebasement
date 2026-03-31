"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { ChannelMember } from "@/types/database";

export function useChannelMembers(channelId?: string | null) {
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const channelIdRef = useRef(channelId);
  const isSubscribedRef = useRef(false);

  const fetchMembers = useCallback(async () => {
    if (!channelId || channelId !== channelIdRef.current) return;

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("channel_members")
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq("channel_id", channelId)
        .order("joined_at", { ascending: true });

      if (channelId !== channelIdRef.current) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setMembers(data || []);
        setError(null);
      }
    } catch (err) {
      if (channelId === channelIdRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch members");
      }
    } finally {
      if (channelId === channelIdRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [channelId]);

  useEffect(() => {
    channelIdRef.current = channelId;
    fetchingRef.current = false;
    isSubscribedRef.current = false;
    setMembers([]);
    setError(null);
    
    if (!channelId) return;

    fetchMembers();

    const channel = supabase
      .channel(`channel-members-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: '*',
          schema: "public",
          table: "channel_members",
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          if (channelId === channelIdRef.current && isSubscribedRef.current) {
            setTimeout(() => fetchMembers(), 500);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });

    return () => {
      isSubscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [channelId, fetchMembers]);

  const addMember = async (userId: string, role: "owner" | "member" = "member") => {
    if (!channelId) return { error: "No channel selected" };

    const { data, error } = await supabase
      .from("channel_members")
      .insert({
        channel_id: channelId,
        user_id: userId,
        role,
      })
      .select(`
        *,
        profile:profiles(*)
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "User is already a member" };
      }
      return { error: error.message };
    }

    if (data) {
      setMembers((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }

    return { data };
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from("channel_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      return { error: error.message };
    }

    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    return { success: true };
  };

  const checkIsMember = async (userId: string) => {
    if (!channelId) return false;

    const { data } = await supabase
      .from("channel_members")
      .select("id")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .maybeSingle();

    return data !== null;
  };

  const isOwner = (userId: string) => {
    return members.some((m) => m.user_id === userId && m.role === "owner");
  };

  return {
    members,
    loading,
    error,
    addMember,
    removeMember,
    checkIsMember,
    isOwner,
    refreshMembers: fetchMembers,
  };
}
