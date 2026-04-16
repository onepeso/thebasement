"use client";

import { useState } from "react";
import { X, Search, UserPlus, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/useToastStore";

interface MobileInviteModalProps {
  channel: any;
  allProfiles: any[];
  onlineUsers: string[];
  currentUserId?: string;
  onClose: () => void;
}

export function MobileInviteModal({
  channel,
  allProfiles,
  onlineUsers,
  currentUserId,
  onClose,
}: MobileInviteModalProps) {
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState<Record<string, boolean>>({});
  const [invited, setInvited] = useState<Record<string, boolean>>({});
  const toast = useToast();

  const filteredProfiles = allProfiles.filter((p: any) => {
    if (p.id === currentUserId) return false;
    if (!search) return true;
    return p.username.toLowerCase().includes(search.toLowerCase());
  });

  const handleInvite = async (userId: string) => {
    setInviting((prev) => ({ ...prev, [userId]: true }));

    const { error } = await supabase.from("channel_invites").insert({
      channel_id: channel.id,
      inviter_id: currentUserId,
      invited_user_id: userId,
      status: "pending",
    });

    if (error) {
      console.error("Invite error:", error);
      toast.error("Failed to send invite");
    } else {
      setInvited((prev) => ({ ...prev, [userId]: true }));
      toast.success("Invite sent!");
    }

    setInviting((prev) => ({ ...prev, [userId]: false }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Invite to #{channel.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <X size={22} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full bg-zinc-900/80 p-3 pl-11 rounded-xl border border-white/10 focus:border-indigo-500/50 text-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4 opacity-50">
            <UserPlus size={48} className="text-zinc-700" />
            <p className="text-sm text-zinc-500">
              {search ? "No users found" : "No users available"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProfiles.map((profile) => {
              const isOnline = onlineUsers.includes(profile.id);
              const isInvited = invited[profile.id];
              const isInviting = inviting[profile.id];

              return (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-xl"
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-zinc-800 overflow-hidden">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm font-medium">
                          {profile.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${
                        isOnline ? "bg-emerald-500" : "bg-zinc-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {profile.username}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleInvite(profile.id)}
                    disabled={isInviting || isInvited}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      isInvited
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isInviting
                        ? "bg-zinc-800 text-zinc-500"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    {isInvited ? (
                      <span className="flex items-center gap-1">
                        <Check size={14} />
                        Sent
                      </span>
                    ) : isInviting ? (
                      "Sending..."
                    ) : (
                      "Invite"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
