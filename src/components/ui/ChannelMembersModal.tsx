"use client";

import { useState } from "react";
import { X, Crown, UserMinus, Hash, Shield, MoreVertical, AlertCircle, RefreshCw, LogOut } from "lucide-react";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";
import type { ChannelMember } from "@/types/database";

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
        <div
          className="absolute -inset-1 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${color.from}20, ${color.to}20)`,
            filter: "blur(20px)",
          }}
        />

        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
          <div className="p-4 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                  }}
                >
                  {hasEmoji ? (
                    <span className="text-lg">{emoji}</span>
                  ) : (
                    <Hash size={18} className="text-white/80" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Channel Members</h2>
                  <p className="text-[10px] text-zinc-500">
                    {loading ? "Loading..." : `${members.length} member${members.length !== 1 ? "s" : ""} in #${channel?.name}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
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
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="relative">
                    <AvatarWithEffect
                      profile={member.profile}
                      size="md"
                      showStatus={true}
                      isOnline={online}
                    />
                    {online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {member.profile?.username || "Unknown User"}
                        {isSelf && (
                          <span className="ml-2 text-[10px] text-indigo-400">(you)</span>
                        )}
                      </p>
                      {member.role === "owner" && (
                        <Crown size={12} className="text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      {online ? (
                        <span className="text-emerald-500">Online</span>
                      ) : (
                        `Joined ${new Date(member.joined_at).toLocaleDateString()}`
                      )}
                    </p>
                  </div>

                  {canRemove(member) && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === member.id ? null : member.id)
                        }
                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenuId === member.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-scale-in">
                          <button
                            onClick={() => handleRemove(member)}
                            disabled={removingId === member.id}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            {removingId === member.id ? (
                              <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                              <UserMinus size={14} />
                            )}
                            Remove from channel
                          </button>
                        </div>
                      )}
                    </div>
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
            <div className="p-4 border-t border-white/5 bg-black/20">
              <button
                onClick={async () => {
                  setLeaving(true);
                  await onLeaveChannel();
                  setLeaving(false);
                }}
                disabled={leaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
              >
                {leaving ? (
                  <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-400 rounded-full animate-spin" />
                ) : (
                  <LogOut size={16} />
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
