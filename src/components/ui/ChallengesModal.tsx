"use client";

import { useState } from 'react';
import { X, Trophy, CheckCircle2, Circle, Star, Zap, Flame, Sparkles, MessageSquare, Coffee, Bird, ThumbsUp, PartyPopper, Pin, CornerDownRight, AtSign, Construction, Heart, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Challenge {
  id: string;
  type: string;
  title: string;
  description: string;
  goal: number;
  xp_reward: number;
  icon?: string;
  progress: number;
  completed: boolean;
}

interface ChallengesModalProps {
  open: boolean;
  onClose: () => void;
  challenges: Challenge[];
  totalXP: number;
}

const getChallengeIcon = (challenge: Challenge): LucideIcon => {
  if (challenge.type === 'login_streak') {
    if (challenge.id.includes('3-day')) return Flame;
    if (challenge.id.includes('7-day')) return Sparkles;
    return UserPlus;
  }
  if (challenge.type === 'first_message' || challenge.type === 'send_messages') {
    return MessageSquare;
  }
  if (challenge.type === 'reactions_given') {
    return ThumbsUp;
  }
  if (challenge.type === 'pins_created') {
    return Pin;
  }
  if (challenge.type === 'replies_sent') {
    return CornerDownRight;
  }
  if (challenge.type === 'mentions_sent') {
    return AtSign;
  }
  if (challenge.type === 'channels_created') {
    return Construction;
  }
  if (challenge.type === 'reactions_received') {
    return Heart;
  }
  return PartyPopper;
};

export function ChallengesModal({ open, onClose, challenges, totalXP }: ChallengesModalProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  if (!open) return null;

  const filteredChallenges = challenges.filter(challenge => {
    if (filter === 'active') return !challenge.completed;
    if (filter === 'completed') return challenge.completed;
    return true;
  });

  const completedCount = challenges.filter(c => c.completed).length;
  const activeCount = challenges.length - completedCount;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Trophy size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Challenges</h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Star size={12} className="text-amber-500" />
                    <span>{totalXP} XP earned</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mt-4">
              {(['all', 'active', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filter === tab
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'active' ? `Active (${activeCount})` : `Done (${completedCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Challenges list */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
            {filteredChallenges.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                {filter === 'completed' ? 'No completed challenges yet' : 'No active challenges'}
              </div>
            ) : (
              filteredChallenges.map((challenge) => {
                const Icon = getChallengeIcon(challenge);
                
                return (
                  <div
                    key={challenge.id}
                    className={`relative p-4 rounded-xl border transition-all ${
                      challenge.completed
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Progress bar background */}
                    {!challenge.completed && (
                      <div className="absolute inset-0 rounded-xl bg-zinc-800/50 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 transition-all duration-500"
                          style={{ width: `${Math.min((challenge.progress / challenge.goal) * 100, 100)}%` }}
                        />
                      </div>
                    )}

                    <div className="relative flex items-start gap-3">
                      {/* Icon */}
                      <div className={`shrink-0 ${challenge.completed ? 'text-emerald-500' : 'text-orange-500'} ${challenge.completed ? '' : 'opacity-50'}`}>
                        <Icon size={24} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-sm ${
                            challenge.completed ? 'text-emerald-400' : 'text-zinc-200'
                          }`}>
                            {challenge.title}
                          </h3>
                          {challenge.completed && (
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{challenge.description}</p>
                        
                        {/* Progress / XP */}
                        <div className="flex items-center gap-3 mt-2">
                          {challenge.completed ? (
                            <div className="flex items-center gap-1 text-xs text-amber-500">
                              <Zap size={12} />
                              <span>+{challenge.xp_reward} XP</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <Circle size={12} className={
                                  challenge.progress >= challenge.goal
                                    ? 'fill-emerald-500 text-emerald-500'
                                    : 'text-zinc-600'
                                } />
                                <span>{challenge.progress}/{challenge.goal}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-amber-500/70">
                                <Zap size={10} />
                                <span>{challenge.xp_reward} XP</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600">
                {completedCount}/{challenges.length} completed
              </span>
              <div className="flex items-center gap-1 text-amber-500">
                <Trophy size={12} />
                <span className="font-medium">{totalXP} Total XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
