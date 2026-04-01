"use client";

import { useState, useMemo } from "react";
import { X, Search, UserPlus, Check, Clock, UserCircle } from "lucide-react";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";

interface InviteModalProps {
  channel: any;
  allProfiles: any[];
  onlineUsers: string[];
  currentUserId: string;
  onInvite: (userId: string) => Promise<{ error?: string }>;
  invitedUserIds: string[];
  onClose: () => void;
}

export function InviteModal({
  channel,
  allProfiles,
  onlineUsers,
  currentUserId,
  onInvite,
  invitedUserIds,
  onClose,
}: InviteModalProps) {
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredProfiles = useMemo(() => {
    if (!search.trim()) {
      return allProfiles.filter(
        (p: any) =>
          p.id !== currentUserId &&
          !invitedUserIds.includes(p.id)
      );
    }

    const searchLower = search.toLowerCase();
    return allProfiles.filter(
      (p: any) =>
        p.username.toLowerCase().includes(searchLower) &&
        p.id !== currentUserId &&
        !invitedUserIds.includes(p.id)
    );
  }, [allProfiles, search, invitedUserIds, currentUserId]);

  const handleInvite = async (userId: string) => {
    setInviting(userId);
    setError(null);

    const result = await onInvite(userId);

    if (result.error) {
      setError(result.error);
    }

    setInviting(null);
  };

  const isOnline = (userId: string) => onlineUsers.includes(userId);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div>
              <h2 className="text-sm font-semibold text-white">Invite</h2>
              <p className="text-[10px] text-zinc-500">to #{channel.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-white/5">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                autoFocus
              />
            </div>

            {error && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-[10px] text-red-400">{error}</p>
              </div>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {filteredProfiles.length === 0 ? (
              <div className="p-6 text-center">
                <UserCircle size={24} className="mx-auto text-zinc-700 mb-1" />
                <p className="text-xs text-zinc-500">
                  {search ? "No users found" : "No users available"}
                </p>
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {filteredProfiles.map((profile: any) => {
                  const alreadyInvited = invitedUserIds.includes(profile.id);
                  const isCurrentlyInviting = inviting === profile.id;

                  return (
                    <div
                      key={profile.id}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <AvatarWithEffect
                        profile={profile}
                        size="sm"
                        showStatus={true}
                        isOnline={isOnline(profile.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {profile.username}
                        </p>
                        <p className="text-[9px] text-zinc-500">
                          {isOnline(profile.id) ? (
                            <span className="text-emerald-500">Online</span>
                          ) : (
                            "Offline"
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleInvite(profile.id)}
                        disabled={alreadyInvited || isCurrentlyInviting}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                          alreadyInvited
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white"
                        }`}
                      >
                        {alreadyInvited ? (
                          <Check size={10} />
                        ) : isCurrentlyInviting ? (
                          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <UserPlus size={10} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-white/5 bg-black/20">
            <button
              onClick={onClose}
              className="w-full py-2 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
