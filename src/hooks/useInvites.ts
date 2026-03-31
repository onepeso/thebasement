"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { ChannelInvite } from "@/types/database";

export function useInvites(userId?: string) {
  const [pendingInvites, setPendingInvites] = useState<ChannelInvite[]>([]);
  const [sentInvites, setSentInvites] = useState<ChannelInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const userIdRef = useRef(userId);
  const isSubscribedRef = useRef(false);

  const fetchInvites = useCallback(async () => {
    if (!userId || userId !== userIdRef.current) return;

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const [receivedRes, sentRes] = await Promise.all([
        supabase
          .from("channel_invites")
          .select(`
            *,
            channel:channels(*),
            inviter:profiles!inviter_id(*)
          `)
          .eq("invited_user_id", userId)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("channel_invites")
          .select(`
            *,
            channel:channels(*),
            invited_user:profiles!invited_user_id(*)
          `)
          .eq("inviter_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (userId !== userIdRef.current) return;

      if (receivedRes.error || sentRes.error) {
        setError(receivedRes.error?.message || sentRes.error?.message || "Failed to fetch invites");
      } else {
        setPendingInvites(receivedRes.data || []);
        setSentInvites(sentRes.data || []);
        setError(null);
      }
    } catch (err) {
      if (userId === userIdRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch invites");
      }
    } finally {
      if (userId === userIdRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    userIdRef.current = userId;
    fetchingRef.current = false;
    isSubscribedRef.current = false;
    setPendingInvites([]);
    setSentInvites([]);
    setError(null);

    if (!userId) return;

    fetchInvites();

    const channel = supabase
      .channel("invite-changes")
      .on(
        "postgres_changes",
        {
          event: '*',
          schema: "public",
          table: "channel_invites",
          filter: `invited_user_id=eq.${userId}`,
        },
        () => {
          if (userId === userIdRef.current && isSubscribedRef.current) {
            setTimeout(() => fetchInvites(), 500);
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
  }, [userId, fetchInvites]);

  const sendInvite = async (channelId: string, invitedUserId: string) => {
    if (!userId) return { error: "Not logged in" };

    if (userId === invitedUserId) {
      return { error: "You cannot invite yourself" };
    }

    const { data, error } = await supabase
      .from("channel_invites")
      .insert({
        channel_id: channelId,
        inviter_id: userId,
        invited_user_id: invitedUserId,
        status: "pending",
      })
      .select(`
        *,
        channel:channels(*),
        invited_user:profiles!invited_user_id(*)
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "User has already been invited to this channel" };
      }
      return { error: error.message };
    }

    if (data) {
      setSentInvites((prev) => {
        if (prev.some((i) => i.id === data.id)) return prev;
        return [data, ...prev];
      });
    }

    return { data };
  };

  const acceptInvite = async (invite: ChannelInvite) => {
    if (!userId) return { error: "Not logged in" };

    const { error } = await supabase
      .from("channel_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    if (error) {
      return { error: error.message };
    }

    setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
    return { success: true };
  };

  const declineInvite = async (invite: ChannelInvite) => {
    if (!userId) return { error: "Not logged in" };

    const { error } = await supabase
      .from("channel_invites")
      .update({ status: "declined" })
      .eq("id", invite.id);

    if (error) {
      return { error: error.message };
    }

    setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
    return { success: true };
  };

  const checkUserInvited = async (channelId: string, targetUserId: string) => {
    const { data } = await supabase
      .from("channel_invites")
      .select("id, status")
      .eq("channel_id", channelId)
      .eq("invited_user_id", targetUserId)
      .in("status", ["pending", "accepted"])
      .maybeSingle();

    return data !== null;
  };

  return {
    pendingInvites,
    sentInvites,
    loading,
    error,
    sendInvite,
    acceptInvite,
    declineInvite,
    checkUserInvited,
    refreshInvites: fetchInvites,
  };
}
