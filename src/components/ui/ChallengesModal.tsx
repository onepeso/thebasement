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
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Trophy size={14} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Challenges</h2>
                <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                  <Star size={8} className="text-amber-500" />
                  <span>{totalXP} XP</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex gap-1 px-4 py-2 border-b border-white/5">
            {(['all', 'active', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${
                  filter === tab
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'all' ? 'All' : tab === 'active' ? `Active (${activeCount})` : `Done (${completedCount})`}
              </button>
            ))}
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-2 space-y-2">
            {filteredChallenges.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                {filter === 'completed' ? 'No completed challenges yet' : 'No active challenges'}
              </div>
            ) : (
              filteredChallenges.map((challenge) => {
                const Icon = getChallengeIcon(challenge);
                
                return (
                  <div
                    key={challenge.id}
                    className={`relative p-2.5 rounded-lg border transition-all ${
                      challenge.completed
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-zinc-900/50 border-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`shrink-0 ${challenge.completed ? 'text-emerald-500' : 'text-orange-500'} ${challenge.completed ? '' : 'opacity-50'}`}>
                        <Icon size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className={`text-xs font-medium ${
                            challenge.completed ? 'text-emerald-400' : 'text-zinc-200'
                          }`}>
                            {challenge.title}
                          </h3>
                          {challenge.completed && (
                            <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-0.5">{challenge.description}</p>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          {challenge.completed ? (
                            <div className="flex items-center gap-0.5 text-[10px] text-amber-500">
                              <Zap size={10} />
                              <span>+{challenge.xp_reward}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-0.5 text-[9px] text-zinc-500">
                                <Circle size={10} className={
                                  challenge.progress >= challenge.goal
                                    ? 'fill-emerald-500 text-emerald-500'
                                    : 'text-zinc-600'
                                } />
                                <span>{challenge.progress}/{challenge.goal}</span>
                              </div>
                              <div className="flex items-center gap-0.5 text-[9px] text-amber-500/70">
                                <Zap size={8} />
                                <span>{challenge.xp_reward}</span>
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

          <div className="px-4 py-2 border-t border-white/5 bg-black/20">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-600">
                {completedCount}/{challenges.length}
              </span>
              <div className="flex items-center gap-0.5 text-amber-500">
                <Trophy size={10} />
                <span className="font-medium">{totalXP} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
