"use client";

import { useState, useEffect } from "react";
import { Bell, UserPlus, MessageSquare, AtSign, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/useToastStore";

export default function MobileActivityPage() {
  const { session, allProfiles } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select(`
          *,
          inviter:profiles!inviter_id(id, username, avatar_url, avatar_effect),
          channel:channels(id, name, description, color, emoji)
        `)
        .eq("user_id", session?.user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [session?.user?.id]);

  const handleAcceptInvite = async (notification: any) => {
    const { data: inviteData } = await supabase
      .from("channel_invites")
      .select("*")
      .eq("channel_id", notification.channel_id)
      .eq("invited_user_id", session?.user?.id)
      .eq("status", "pending")
      .single();

    if (inviteData) {
      await supabase.from("channel_invites").update({ status: "accepted" }).eq("id", inviteData.id);
      await supabase.from("channel_members").insert({
        channel_id: notification.channel_id,
        user_id: session?.user?.id,
        role: "member",
      });
      await supabase.from("messages").insert({
        channel_id: notification.channel_id,
        user_id: session?.user?.id,
        text: "joined the channel",
        is_system: true,
      });
      await supabase.from("user_notifications").delete().eq("id", notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      toast.success("Joined channel!");
    }
  };

  const handleDeclineInvite = async (notificationId: string) => {
    await supabase.from("user_notifications").delete().eq("id", notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    toast.info("Invite declined");
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "invite":
        return <UserPlus size={20} className="text-indigo-400" />;
      case "mention":
        return <AtSign size={20} className="text-yellow-400" />;
      case "reply":
        return <MessageSquare size={20} className="text-emerald-400" />;
      default:
        return <Bell size={20} className="text-zinc-400" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "invite":
        return "bg-indigo-500/20";
      case "mention":
        return "bg-yellow-500/20";
      case "reply":
        return "bg-emerald-500/20";
      default:
        return "bg-zinc-500/20";
    }
  };

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-zinc-500">Please sign in</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-14 flex items-center px-4 border-b border-white/5 shrink-0">
        <h1 className="text-base font-semibold text-white">Activity</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
            <div className="w-20 h-20 rounded-full bg-zinc-900/50 flex items-center justify-center">
              <Bell size={40} className="text-zinc-700" />
            </div>
            <p className="text-sm text-zinc-500">No activity yet</p>
            <p className="text-xs text-zinc-600">Invites and mentions will appear here</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 bg-zinc-900/50 rounded-xl border border-white/5"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full ${getIconBg(notif.type)} flex items-center justify-center shrink-0`}>
                    {notif.inviter?.avatar_url ? (
                      <img
                        src={notif.inviter.avatar_url}
                        className="w-full h-full rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      getIcon(notif.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-snug">
                      {notif.type === "invite" && notif.inviter && (
                        <>
                          <span className="font-medium text-indigo-400">
                            @{notif.inviter.username}
                          </span>{" "}
                          invited you to{" "}
                          <span className="font-medium">
                            #{notif.channel?.name || "a channel"}
                          </span>
                        </>
                      )}
                      {notif.type !== "invite" && (notif.title || notif.message || notif.body)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatTime(notif.created_at)}
                    </p>
                  </div>
                </div>

                {notif.type === "invite" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAcceptInvite(notif)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-colors active:scale-[0.98]"
                    >
                      <Check size={16} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(notif.id)}
                      className="px-6 flex items-center justify-center py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-300 transition-colors active:scale-[0.98]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
