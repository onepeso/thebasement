"use client";

import { useState } from "react";
import { X, MoreVertical, Crown, Shield, UserMinus } from "lucide-react";
import { useMobileNav } from "./MobileNavContext";

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url?: string;
    status?: string;
  };
}

interface MobileMemberSheetProps {
  members: Member[];
  onlineUsers: string[];
  currentUserId?: string;
  onRemoveMember?: (member: Member) => void;
  onOpenProfile?: (userId: string) => void;
}

export function MobileMemberSheet({
  members,
  onlineUsers,
  currentUserId,
  onRemoveMember,
  onOpenProfile,
}: MobileMemberSheetProps) {
  const { showMemberSheet, setShowMemberSheet } = useMobileNav();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!showMemberSheet) return null;

  const online = members.filter((m) => onlineUsers.includes(m.user_id));
  const offline = members.filter((m) => !onlineUsers.includes(m.user_id));

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? "bg-emerald-500" : "bg-zinc-600";
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowMemberSheet(false)}
      />

      {/* Sheet */}
      <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-zinc-950 border-l border-white/10 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
          <h2 className="text-base font-semibold text-white">
            Members ({members.length})
          </h2>
          <button
            onClick={() => setShowMemberSheet(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Online */}
          {online.length > 0 && (
            <div className="px-3 py-2">
              <h3 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 px-2">
                Online — {online.length}
              </h3>
              <div className="space-y-0.5">
                {online.map((member) => (
                  <div key={member.id}>
                    <button
                      onClick={() => onOpenProfile?.(member.user_id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all active:scale-[0.98]"
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                          {member.profiles?.avatar_url && (
                            <img
                              src={member.profiles.avatar_url}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          )}
                        </div>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${getStatusColor(
                            true
                          )}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-white truncate">
                          {member.profiles?.username || "Unknown"}
                        </p>
                        <div className="flex items-center gap-1">
                          {member.role === "owner" && (
                            <Crown
                              size={10}
                              className="text-amber-400 fill-amber-400"
                            />
                          )}
                          {member.role === "admin" && (
                            <Shield size={10} className="text-indigo-400" />
                          )}
                        </div>
                      </div>
                      {member.user_id === currentUserId && (
                        <span className="text-[10px] text-zinc-500">You</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(
                            expandedId === member.id ? null : member.id
                          );
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-500"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </button>
                    {expandedId === member.id && (
                      <div className="ml-14 mr-3 mb-2 p-2 bg-zinc-900/50 rounded-lg">
                        {(member.role === "owner" || member.role === "admin") &&
                        member.user_id !== currentUserId ? null : member.user_id !==
                          currentUserId ? (
                          <button
                            onClick={() => {
                              onRemoveMember?.(member);
                              setExpandedId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-400 hover:bg-white/5 rounded transition-all"
                          >
                            <UserMinus size={14} />
                            Remove from channel
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline */}
          {offline.length > 0 && (
            <div className="px-3 py-2">
              <h3 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 px-2">
                Offline — {offline.length}
              </h3>
              <div className="space-y-0.5">
                {offline.map((member) => (
                  <div key={member.id}>
                    <button
                      onClick={() => onOpenProfile?.(member.user_id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all active:scale-[0.98]"
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden opacity-50">
                          {member.profiles?.avatar_url && (
                            <img
                              src={member.profiles.avatar_url}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          )}
                        </div>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${getStatusColor(
                            false
                          )}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-zinc-400 truncate">
                          {member.profiles?.username || "Unknown"}
                        </p>
                      </div>
                      {member.user_id === currentUserId && (
                        <span className="text-[10px] text-zinc-600">You</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
