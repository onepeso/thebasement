"use client";

import { X, Trophy, Star } from "lucide-react";

interface Challenge {
  id: string;
  name?: string;
  description?: string;
  type: string;
  target?: number;
  xp_reward: number;
  completed: boolean;
  progress: number;
}

interface Badge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  unlocked_at?: string | null;
}

interface MobileChallengeModalProps {
  challenges: Challenge[];
  totalXP: number;
  badges: Badge[];
  onClose: () => void;
}

export function MobileChallengeModal({
  challenges,
  totalXP,
  badges,
  onClose,
}: MobileChallengeModalProps) {
  const completedCount = challenges.filter((c) => c.completed).length;
  const unlockedBadges = badges.filter((b) => b.unlocked_at);

  const getProgressPercent = (challenge: Challenge) => {
    return Math.min((challenge.progress / (challenge.target || 1)) * 100, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          <h2 className="text-base font-semibold text-white">Challenges</h2>
          <span className="text-xs text-zinc-500">
            {completedCount}/{challenges.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <X size={22} />
        </button>
      </div>

      {/* XP Banner */}
      <div className="px-4 py-4 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Total XP</p>
            <p className="text-2xl font-bold text-white">{totalXP.toLocaleString()}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <span className="text-xl font-black text-white">Lvl</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Challenges */}
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
          Active Challenges
        </h3>
        <div className="space-y-3 mb-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border ${
                challenge.completed
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-zinc-900/50 border-white/5"
              }`}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{challenge.name}</span>
                    {challenge.completed && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{challenge.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-medium text-amber-400">+{challenge.xp_reward} XP</span>
                </div>
              </div>
              {!challenge.completed && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {challenge.progress}/{challenge.target}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${getProgressPercent(challenge)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Badges */}
        {unlockedBadges.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
              Badges ({unlockedBadges.length})
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {unlockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center p-4 bg-zinc-900/50 rounded-xl border border-white/5"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-2 text-xl">
                    {badge.icon}
                  </div>
                  <span className="text-xs font-medium text-white text-center">{badge.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
