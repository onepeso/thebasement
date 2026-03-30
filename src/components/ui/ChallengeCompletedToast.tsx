"use client";

import { useEffect } from 'react';
import { Trophy, X, Star, Zap, Flame, Sparkles, MessageSquare, ThumbsUp, Pin, CornerDownRight, AtSign, Construction, Heart, UserPlus, PartyPopper, Coffee, Bird } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ChallengeWithProgress {
  id: string;
  type: string;
  title: string;
  xp_reward: number;
}

interface ChallengeCompletedToastProps {
  challenge: ChallengeWithProgress | null;
  onClose: () => void;
}

const getChallengeIcon = (challenge: ChallengeWithProgress): LucideIcon => {
  if (!challenge) return PartyPopper;
  
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

export function ChallengeCompletedToast({ challenge, onClose }: ChallengeCompletedToastProps) {
  useEffect(() => {
    if (challenge) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [challenge, onClose]);

  if (!challenge) return null;

  const Icon = getChallengeIcon(challenge);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[400] animate-slide-up">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/50 via-orange-500/50 to-amber-500/50 rounded-2xl blur-lg animate-pulse" />
        
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-3 p-4">
            <div className="text-orange-500">
              <Icon size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Challenge Complete!</span>
              </div>
              <h3 className="font-bold text-white mt-0.5">{challenge.title}</h3>
              <div className="flex items-center gap-1 text-sm text-amber-400">
                <Zap size={14} />
                <span>+{challenge.xp_reward} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
