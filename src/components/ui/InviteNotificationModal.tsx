"use client";

import { useEffect, useState } from "react";
import { X, UserPlus, Check, XCircle, Hash } from "lucide-react";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";
import { supabase } from "@/lib/supabase";

const GRADIENT_COLORS: Record<string, { from: string; to: string }> = {
  indigo: { from: "#4f46e5", to: "#7c3aed" },
  blue: { from: "#2563eb", to: "#06b6d4" },
  purple: { from: "#9333ea", to: "#db2777" },
  emerald: { from: "#059669", to: "#10b981" },
  orange: { from: "#ea580c", to: "#f97316" },
  red: { from: "#dc2626", to: "#f43f5e" },
  pink: { from: "#db2777", to: "#e879f9" },
  cyan: { from: "#0891b2", to: "#22d3ee" },
  amber: { from: "#d97706", to: "#fbbf24" },
  slate: { from: "#334155", to: "#64748b" },
};

interface InviteNotification {
  id: string;
  channel_id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  inviter_id?: string;
  inviter?: {
    id: string;
    username: string;
    avatar_url?: string;
    avatar_effect?: string;
  };
  channel?: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    emoji?: string;
  };
}

interface InviteNotificationModalProps {
  notifications: InviteNotification[];
  onlineUsers: string[];
  currentUserId?: string;
  onClose: () => void;
  onProcessed?: (notificationId: string) => void;
}

export function InviteNotificationModal({
  notifications,
  onlineUsers,
  currentUserId,
  onClose,
  onProcessed,
}: InviteNotificationModalProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [processed, setProcessed] = useState<Record<string, "accepted" | "declined">>({});

  const handleAccept = async (notification: InviteNotification) => {
    setProcessing(notification.id);
    
    try {
      const { data: inviteData } = await supabase
        .from('channel_invites')
        .select('*')
        .eq('channel_id', notification.channel_id)
        .eq('invited_user_id', currentUserId)
        .eq('status', 'pending')
        .single();
      
      if (inviteData) {
        await supabase
          .from('channel_invites')
          .update({ status: 'accepted' })
          .eq('id', inviteData.id);
        
        await supabase.from('channel_members').insert({
          channel_id: notification.channel_id,
          user_id: currentUserId,
          role: 'member',
        });
        
        await supabase.from('messages').insert({
          channel_id: notification.channel_id,
          user_id: currentUserId,
          text: 'joined the channel',
          is_system: true,
        });
      }
      
      await supabase.from('user_notifications').delete().eq('id', notification.id);
      setProcessed((prev) => ({ ...prev, [notification.id]: 'accepted' }));
      onProcessed?.(notification.id);
    } catch (error) {
      console.error('Failed to accept invite:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (notification: InviteNotification) => {
    setProcessing(notification.id);
    
    try {
      const { data: inviteData } = await supabase
        .from('channel_invites')
        .select('*')
        .eq('channel_id', notification.channel_id)
        .eq('invited_user_id', currentUserId)
        .eq('status', 'pending')
        .single();
      
      if (inviteData) {
        await supabase
          .from('channel_invites')
          .update({ status: 'declined' })
          .eq('id', inviteData.id);
      }
      
      await supabase.from('user_notifications').delete().eq('id', notification.id);
      setProcessed((prev) => ({ ...prev, [notification.id]: 'declined' }));
      onProcessed?.(notification.id);
    } catch (error) {
      console.error('Failed to decline invite:', error);
    } finally {
      setProcessing(null);
    }
  };

  const inviteNotifications = notifications.filter(
    (n) => n.type === 'invite' && !processed[n.id]
  );
  const hasInvites = inviteNotifications.length > 0;

  useEffect(() => {
    if (!hasInvites) {
      const timer = setTimeout(onClose, 300);
      return () => clearTimeout(timer);
    }
  }, [hasInvites, onClose]);

  if (!hasInvites) return null;

  const notification = inviteNotifications[0];
  const isProcessing = processing === notification.id;

  const channelColor = notification.channel?.color || "indigo";
  const color = GRADIENT_COLORS[channelColor] || GRADIENT_COLORS.indigo;
  const emoji = notification.channel?.emoji;
  const hasEmoji = emoji && emoji !== "💬";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="absolute -inset-1 rounded-2xl" style={{ background: `linear-gradient(135deg, ${color.from}30, ${color.to}30)`, filter: "blur(20px)" }} />

        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 text-center border-b border-white/5">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}>
              {hasEmoji ? (
                <span className="text-2xl">{emoji}</span>
              ) : (
                <Hash size={24} className="text-white/80" />
              )}
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Channel Invitation
            </h2>
            <p className="text-sm text-zinc-400">
              You've been invited to join
            </p>
          </div>

          <div className="p-6 space-y-4">
            {notification.inviter && (
              <div className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                <AvatarWithEffect
                  profile={{
                    ...notification.inviter,
                    avatar_url: notification.inviter?.avatar_url || '',
                    avatar_effect: notification.inviter?.avatar_effect,
                  }}
                  size="md"
                  showStatus={true}
                  isOnline={onlineUsers.includes(notification.inviter_id || '')}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {notification.inviter.username || "Unknown User"}
                  </p>
                  <p className="text-xs text-zinc-500">wants you to join</p>
                </div>
              </div>
            )}

            <div className="text-center py-3 px-4 bg-zinc-900/30 rounded-xl border border-white/5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                Channel
              </p>
              <p className="text-base font-bold text-white">
                # {notification.channel?.name || notification.message || "Unknown Channel"}
              </p>
              {notification.channel?.description && (
                <p className="text-xs text-zinc-500 mt-1 truncate">
                  {notification.channel.description}
                </p>
              )}
            </div>

            {inviteNotifications.length > 1 && (
              <p className="text-center text-xs text-zinc-500">
                +{inviteNotifications.length - 1} more invitation{inviteNotifications.length > 2 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="p-4 flex gap-3 bg-black/20">
            <button
              onClick={() => handleDecline(notification)}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white font-semibold text-sm transition-all rounded-xl disabled:opacity-50"
            >
              <XCircle size={16} />
              Decline
            </button>
            <button
              onClick={() => handleAccept(notification)}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm transition-all rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={16} />
                  Accept
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
