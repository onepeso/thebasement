import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Circle, Settings, Star, Trophy, Zap, Flame, Sparkles, MessageSquare, ThumbsUp, Pin, CornerDownRight, AtSign, Construction, Heart, UserPlus, PartyPopper } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { AvatarWithEffect } from './AvatarWithEffect';
import { useAuth } from '@/hooks/useAuth';
import type { UserStatus } from '@/types/database';

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: 'online', label: 'Online', color: 'bg-emerald-500' },
  { value: 'away', label: 'Away', color: 'bg-yellow-500' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500' },
  { value: 'dnd', label: 'Do Not Disturb', color: 'bg-red-600' },
];

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

interface ProfileModalProps {
  profile: any;
  onlineUsers?: string[];
  challenges?: Challenge[];
  totalXP?: number;
  onClose: () => void;
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

const getLevel = (xp: number): { level: number; title: string; currentXP: number; nextLevelXP: number } => {
  const levels = [
    { minXP: 0, title: 'Newcomer' },
    { minXP: 50, title: 'Regular' },
    { minXP: 150, title: 'Active' },
    { minXP: 300, title: 'Contributor' },
    { minXP: 500, title: 'Veteran' },
    { minXP: 800, title: 'Expert' },
    { minXP: 1200, title: 'Master' },
    { minXP: 2000, title: 'Legend' },
  ];
  
  let currentLevel = levels[0];
  let nextLevel = levels[1];
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXP) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || { minXP: currentLevel.minXP + 1000, title: 'Max Level' };
      break;
    }
  }
  
  const currentLevelXP = xp - currentLevel.minXP;
  const xpNeeded = nextLevel.minXP - currentLevel.minXP;
  
  return {
    level: levels.indexOf(currentLevel) + 1,
    title: currentLevel.title,
    currentXP: currentLevelXP,
    nextLevelXP: xpNeeded,
  };
};

export function ProfileModal({ profile, onlineUsers, challenges, totalXP = 0, onClose }: ProfileModalProps) {
  const { setShowSettings } = useChatStore();
  const { refetchProfiles } = useAuth();
  
  const isOnline = profile?.id ? (onlineUsers?.includes(profile.id) ?? true) : false;
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [status, setStatus] = useState<UserStatus>(profile?.status || 'online');
  const [saving, setSaving] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);

  const userTotalXP = profile?.total_xp || totalXP;
  const { level, title, currentXP, nextLevelXP } = getLevel(userTotalXP);
  const completedChallenges = challenges?.filter(c => c.completed) || [];
  const earnedXP = completedChallenges.reduce((sum, c) => sum + c.xp_reward, 0);
  const xpProgress = Math.round((currentXP / nextLevelXP) * 100);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        bio,
        status,
      })
      .eq('id', profile.id);

    setSaving(false);
    if (!error) {
      await refetchProfiles();
      onClose();
    }
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === status);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Banner */}
          <div 
            className="h-32 sm:h-40 relative bg-cover bg-center shrink-0"
            style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
            
            {/* XP Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full border border-amber-500/30">
              <Zap size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-amber-400">{userTotalXP} XP</span>
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white/80 hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            {/* Avatar - clickable to settings */}
            <button
              onClick={() => { onClose(); setShowSettings(true); }}
              className="absolute -bottom-10 left-4 group"
            >
              <AvatarWithEffect 
                profile={profile} 
                username={username}
                size="xl"
                showStatus={true}
                isOnline={isOnline}
                className="group-hover:opacity-80 transition-opacity ring-4 ring-zinc-900"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-2 bg-black/60 rounded-full">
                  <Settings size={16} className="text-white" />
                </div>
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="pt-14 sm:pt-16 px-4 sm:px-6 pb-6">
            {/* Level & Title */}
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                  <span className="text-lg font-black text-white">{level}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{username}</h2>
                  <p className="text-sm text-amber-400">{title}</p>
                </div>
              </div>
              
              {/* XP Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                  <span>{currentXP} / {nextLevelXP} XP to next level</span>
                  <span>{xpProgress}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-white/5">
                <Trophy size={14} className="text-amber-500" />
                <span className="text-sm text-zinc-300">{completedChallenges.length} completed</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-white/5">
                <Star size={14} className="text-amber-500" />
                <span className="text-sm text-zinc-300">{earnedXP} XP earned</span>
              </div>
            </div>

            {/* Completed Challenges Toggle */}
            {completedChallenges.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowChallenges(!showChallenges)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg border border-white/5 transition-colors"
                >
                  <span className="text-xs font-medium text-zinc-400">My Achievements</span>
                  <span className="text-xs text-amber-400">{showChallenges ? 'Hide' : 'Show'}</span>
                </button>
                
                {showChallenges && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {completedChallenges.map((challenge) => {
                      const Icon = getChallengeIcon(challenge);
                      return (
                        <div
                          key={challenge.id}
                          className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full"
                          title={`${challenge.title} - ${challenge.xp_reward} XP`}
                        >
                          <Icon size={14} className="text-amber-400" />
                          <span className="text-[10px] font-medium text-amber-400">{challenge.xp_reward} XP</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Status Picker */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                Status
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowStatusPicker(!showStatusPicker)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors w-full"
                >
                  <Circle size={12} className={`fill-current ${currentStatus?.color.replace('bg-', 'text-')}`} />
                  <span className="text-sm text-zinc-300">{currentStatus?.label}</span>
                </button>
                
                {showStatusPicker && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-800 rounded-xl border border-white/10 shadow-xl py-2 z-10">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setStatus(option.value); setShowStatusPicker(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors ${status === option.value ? 'bg-indigo-500/20' : ''}`}
                      >
                        <Circle size={12} className={`${option.color}`} />
                        <span className="text-sm text-zinc-300">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                What you&apos;re doing
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 24))}
                placeholder="Add a bio..."
                maxLength={24}
                className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 resize-none h-16 transition-colors"
              />
              <div className="text-[10px] mt-1 text-right">
                {bio.length >= 24 ? (
                  <span className="text-red-400 animate-pulse">Max 24 characters</span>
                ) : (
                  <span className="text-zinc-600">{bio.length}/24</span>
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
