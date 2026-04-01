"use client";

import { useState } from "react";
import { X, Crown, UserMinus, Hash, Shield, AlertCircle, RefreshCw, LogOut } from "lucide-react";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";
import type { ChannelMember } from "@/types/database";
import { getUsernameStyle, getTextColor } from "@/utils/fontStyles";

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

interface ChannelMembersModalProps {
  channel: any;
  members: ChannelMember[];
  currentUserId: string;
  onlineUsers: string[];
  loading?: boolean;
  error?: string | null;
  onRemoveMember: (member: ChannelMember) => Promise<{ success?: boolean; error?: string }>;
  onLeaveChannel?: () => Promise<{ success?: boolean; error?: string }>;
  onRefresh?: () => void;
  onClose: () => void;
}

export function ChannelMembersModal({
  channel,
  members,
  currentUserId,
  onlineUsers,
  loading,
  error,
  onRemoveMember,
  onLeaveChannel,
  onRefresh,
  onClose,
}: ChannelMembersModalProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const channelColor = channel?.color || "indigo";
  const color = GRADIENT_COLORS[channelColor] || GRADIENT_COLORS.indigo;
  const emoji = channel?.emoji;
  const hasEmoji = emoji && emoji !== "💬";

  const owner = members.find((m) => m.role === "owner");
  const isCurrentUserOwner = owner?.user_id === currentUserId;

  const handleRemove = async (member: ChannelMember) => {
    setRemovingId(member.id);
    setOpenMenuId(null);
    await onRemoveMember(member);
    setRemovingId(null);
  };

  const canRemove = (member: ChannelMember) => {
    if (member.role === "owner") return false;
    if (member.user_id === currentUserId) return false;
    return isCurrentUserOwner;
  };

  const isOnline = (userId: string) => onlineUsers.includes(userId);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                }}
              >
                {hasEmoji ? (
                  <span className="text-sm">{emoji}</span>
                ) : (
                  <Hash size={14} className="text-white/80" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Members</h2>
                <p className="text-[10px] text-zinc-500">
                  {loading ? "..." : `${members.length} in #${channel?.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <AlertCircle size={32} className="text-red-500" />
                <p className="text-sm text-zinc-400 text-center">{error}</p>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            )}
            {!error && loading && members.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}
            {members.map((member) => {
              const isSelf = member.user_id === currentUserId;
              const online = isOnline(member.user_id);

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <AvatarWithEffect
                    profile={member.profile}
                    size="sm"
                    showStatus={true}
                    isOnline={online}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-white truncate" style={getUsernameStyle(member.profile?.font_style)}>
                        <span style={{ color: getTextColor(member.profile?.text_color) }}>
                          {member.profile?.username || "Unknown"}
                        </span>
                        {isSelf && (
                          <span className="ml-1 text-[9px] text-indigo-400">(you)</span>
                        )}
                      </p>
                      {member.role === "owner" && (
                        <Crown size={10} className="text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-500">
                      {online ? (
                        <span className="text-emerald-500">Online</span>
                      ) : (
                        new Date(member.joined_at).toLocaleDateString()
                      )}
                    </p>
                  </div>

                  {canRemove(member) && (
                    <button
                      onClick={() => handleRemove(member)}
                      disabled={removingId === member.id}
                      className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {removingId === member.id ? (
                        <div className="w-3 h-3 border border-red-500/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <UserMinus size={12} />
                      )}
                    </button>
                  )}
                </div>
              );
            })}

            {members.length === 0 && !loading && (
              <div className="p-8 text-center">
                <Shield size={32} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">No members yet</p>
              </div>
            )}
          </div>

          {onLeaveChannel && !isCurrentUserOwner && (
            <div className="px-4 py-3 border-t border-white/5 bg-black/20">
              <button
                onClick={async () => {
                  setLeaving(true);
                  await onLeaveChannel();
                  setLeaving(false);
                }}
                disabled={leaving}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-red-400 text-xs font-medium hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
              >
                {leaving ? (
                  <div className="w-3 h-3 border border-red-500/30 border-t-red-400 rounded-full animate-spin" />
                ) : (
                  <LogOut size={12} />
                )}
                Leave Channel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
