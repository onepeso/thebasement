"use client";

import { useState, useEffect } from "react";
import { Settings, Trophy, Star, Edit3, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useChallenges } from "@/hooks/useChallenges";
import { useBadges } from "@/hooks/useBadges";
import { MobileSettingsModal } from "@/components/ui/MobileSettingsModal";
import { MobileChallengeModal } from "@/components/mobile/MobileChallengeModal";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";
import { getUsernameStyle, getTextColor } from "@/utils/fontStyles";

export default function MobileProfilePage() {
  const { session, myProfile, allProfiles, refetchProfiles } = useAuth();
  const { challenges, totalXP, trackChannelCreated } = useChallenges(session?.user?.id);
  const { badges } = useBadges(session?.user?.id);

  const [showSettings, setShowSettings] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const completedCount = challenges.filter((c: any) => c.completed).length;
  const unlockedBadges = badges.filter((b: any) => b.unlocked_at);
  const level = Math.floor(totalXP / 1000) + 1;
  const xpForCurrentLevel = totalXP % 1000;
  const xpForNextLevel = 1000;
  const levelProgress = (xpForCurrentLevel / xpForNextLevel) * 100;

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchStats = async () => {
      const [messagesCount, reactionsCount] = await Promise.all([
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session?.user?.id)
          .not("is_system", "eq", true),
        supabase
          .from("message_reactions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session?.user?.id),
      ]);

      setStats({
        messages: messagesCount.count || 0,
        reactions: reactionsCount.count || 0,
        channels: challenges.filter((c: any) => c.type === "channel_created" && c.completed).length,
      });
      setLoadingStats(false);
    };

    fetchStats();
  }, [session?.user?.id]);

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case "online":
        return "bg-emerald-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
      case "dnd":
        return "bg-red-500";
      default:
        return "bg-zinc-500";
    }
  };

  const getStatusLabel = (status?: string | null) => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "busy":
        return "Busy";
      case "dnd":
        return "Do Not Disturb";
      default:
        return "Offline";
    }
  };

  if (!session || !myProfile) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-zinc-500">Please sign in</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
        <h1 className="text-base font-semibold text-white">Profile</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        {/* Profile Card */}
        <div className="p-6 flex flex-col items-center text-center border-b border-white/5">
          <div className="relative mb-4">
            <AvatarWithEffect profile={myProfile} size="xl" showStatus={true} />
          </div>
          <h2
            className="text-xl font-bold mb-1"
            style={{
              ...getUsernameStyle(myProfile.font_style),
              color: getTextColor(myProfile.text_color),
            }}
          >
            {myProfile.username}
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(myProfile.status)}`} />
            <span className="text-sm text-zinc-500">{getStatusLabel(myProfile.status)}</span>
          </div>
          {myProfile.bio && (
            <p className="text-sm text-zinc-400 mt-3 max-w-[280px]">{myProfile.bio}</p>
          )}
        </div>

        {/* Level & XP */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <span className="text-sm font-black text-white">L{level}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Level {level}</p>
                <p className="text-xs text-zinc-500">{totalXP.toLocaleString()} XP</p>
              </div>
            </div>
            <button
              onClick={() => setShowChallenges(true)}
              className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/30 transition-colors flex items-center gap-2"
            >
              <Trophy size={14} />
              {completedCount}/{challenges.length}
            </button>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1 text-right">
            {xpForCurrentLevel}/{xpForNextLevel} XP
          </p>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-white/5">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Statistics
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-zinc-900/50 rounded-xl text-center">
              <p className="text-xl font-bold text-white">
                {loadingStats ? "-" : stats?.messages || 0}
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Messages</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-xl text-center">
              <p className="text-xl font-bold text-white">
                {loadingStats ? "-" : stats?.reactions || 0}
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Reactions</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-xl text-center">
              <p className="text-xl font-bold text-white">
                {loadingStats ? "-" : stats?.channels || 0}
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Channels</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        {unlockedBadges.length > 0 && (
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Badges ({unlockedBadges.length})
              </h3>
              <Star size={14} className="text-amber-400" />
            </div>
            <div className="flex flex-wrap gap-3">
              {unlockedBadges.map((badge: any) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center p-3 bg-zinc-900/50 rounded-xl min-w-[80px]"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl mb-2 shadow-lg shadow-amber-500/20">
                    {badge.icon}
                  </div>
                  <span className="text-xs font-medium text-white text-center">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-4 py-4 bg-zinc-900/50 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <Edit3 size={18} className="text-indigo-400" />
            <span className="text-sm">Edit Profile</span>
          </button>
          <button
            onClick={() => setShowChallenges(true)}
            className="w-full flex items-center gap-3 px-4 py-4 bg-zinc-900/50 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <Trophy size={18} className="text-amber-400" />
            <span className="text-sm">Challenges</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showSettings && (
        <MobileSettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showChallenges && (
        <MobileChallengeModal
          challenges={challenges}
          totalXP={totalXP}
          badges={badges}
          onClose={() => setShowChallenges(false)}
        />
      )}
    </div>
  );
}
