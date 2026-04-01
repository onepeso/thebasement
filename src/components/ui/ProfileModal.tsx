import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Circle, Settings, Star, Trophy, Zap, Flame, Sparkles, MessageSquare, ThumbsUp, Pin, CornerDownRight, AtSign, Construction, Heart, UserPlus, PartyPopper, Award, ChevronDown, ChevronUp, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { AvatarWithEffect } from './AvatarWithEffect';
import { useAuth } from '@/hooks/useAuth';
import type { UserStatus, BadgeWithStatus, FontStyleId } from '@/types/database';
import { FONT_STYLES } from '@/types/database';
import { getUsernameStyle } from '@/utils/fontStyles';

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
  badges?: BadgeWithStatus[];
  onClose: () => void;
}

const BADGE_ICONS: Record<string, string> = {
  'message': '💬',
  'message-circle': '💬',
  'message-square': '💬',
  'heart': '❤️',
  'pin': '📌',
  'plus-square': '➕',
  'layers': '📚',
  'log-in': '🚪',
  'flame': '🔥',
  'zap': '⚡',
  'at-sign': '@️',
  'corner-down-right': '↩️',
  'star': '⭐',
  'trophy': '🏆',
  'award': '🏅',
  'medal': '🎖️',
  'crown': '👑',
};

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

export function ProfileModal({ profile, onlineUsers, challenges, totalXP = 0, badges = [], onClose }: ProfileModalProps) {
  const { setShowSettings } = useChatStore();
  const { refetchProfiles } = useAuth();
  
  const isOnline = profile?.id ? (onlineUsers?.includes(profile.id) ?? true) : false;
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [status, setStatus] = useState<UserStatus>(profile?.status || 'online');
  const [fontStyle, setFontStyle] = useState<FontStyleId>(profile?.font_style as FontStyleId || 'default');
  const [saving, setSaving] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);

  const unlockedBadges = badges.filter((b: BadgeWithStatus) => b.unlocked);
  const lockedBadges = badges.filter((b: BadgeWithStatus) => !b.unlocked);
  const highlightedBadgeIds = profile?.highlighted_badges || [];
  const highlightedBadges = unlockedBadges.filter((b: BadgeWithStatus) => highlightedBadgeIds.includes(b.id));

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
        font_style: fontStyle === 'default' ? null : fontStyle,
      })
      .eq('id', profile.id);

    setSaving(false);
    if (!error) {
      await refetchProfiles();
      onClose();
    }
  };

  const currentFont = FONT_STYLES.find(f => f.id === fontStyle) || FONT_STYLES[0];

  const currentStatus = STATUS_OPTIONS.find(s => s.value === status);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="relative bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden">
          {/* Banner */}
          <div 
            className="h-24 relative"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-transparent" />
            
            {/* XP Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full">
              <Zap size={12} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-400">{userTotalXP} XP</span>
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white/80 hover:text-white transition-all"
            >
              <X size={16} />
            </button>

            {/* Avatar */}
            <button
              onClick={() => { onClose(); setShowSettings(true); }}
              className="absolute -bottom-8 left-4 group"
            >
              <AvatarWithEffect 
                profile={profile} 
                username={username}
                size="xl"
                showStatus={true}
                isOnline={isOnline}
                className="group-hover:opacity-80 transition-opacity ring-2 ring-zinc-900"
              />
            </button>
          </div>

          {/* Content */}
          <div className="pt-10 px-4 pb-4">
            {/* Level & Title */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-sm font-black text-white">{level}</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white" style={getUsernameStyle(fontStyle)}>{username}</h2>
                <p className="text-xs text-amber-400">{title}</p>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mb-4">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>

            {/* Highlighted Badges */}
            {highlightedBadges.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {highlightedBadges.map((badge: BadgeWithStatus) => (
                  <div
                    key={badge.id}
                    className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: badge.color + '20', border: `1px solid ${badge.color}40` }}
                    title={badge.name}
                  >
                    <span className="text-xl">{BADGE_ICONS[badge.icon] || '🏅'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-2 mb-4 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded">
                <Trophy size={10} className="text-amber-500" />
                <span className="text-zinc-400">{completedChallenges.length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded">
                <Star size={10} className="text-amber-500" />
                <span className="text-zinc-400">{earnedXP}</span>
              </div>
              {badges.length > 0 && (
                <button
                  onClick={() => setShowBadges(!showBadges)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded hover:bg-zinc-800 transition-colors"
                >
                  <Award size={10} className="text-purple-500" />
                  <span className="text-zinc-400">{unlockedBadges.length}/{badges.length}</span>
                </button>
              )}
            </div>

            {/* Badges Section */}
            {showBadges && badges.length > 0 && (
              <div className="mb-4 p-3 bg-zinc-800/30 rounded-lg">
                <div className="flex flex-wrap gap-1.5">
                  {unlockedBadges.map((badge: BadgeWithStatus) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: badge.color + '20' }}
                      title={badge.description}
                    >
                      <span>{BADGE_ICONS[badge.icon] || '🏅'}</span>
                      <span className="text-zinc-300">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {completedChallenges.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowChallenges(!showChallenges)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg text-xs transition-colors"
                >
                  <span className="text-zinc-400">Achievements</span>
                  <span className="text-amber-400">{showChallenges ? '−' : '+'}</span>
                </button>
                
                {showChallenges && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {completedChallenges.map((challenge) => {
                      const Icon = getChallengeIcon(challenge);
                      return (
                        <div
                          key={challenge.id}
                          className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded text-xs"
                          title={challenge.title}
                        >
                          <Icon size={12} className="text-amber-400" />
                          <span className="text-amber-400">{challenge.xp_reward} XP</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Status */}
            <div className="mb-3">
              <div className="relative">
                <button
                  onClick={() => setShowStatusPicker(!showStatusPicker)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors w-full text-xs"
                >
                  <Circle size={10} className={`${currentStatus?.color}`} />
                  <span className="text-zinc-300">{currentStatus?.label}</span>
                </button>
                
                {showStatusPicker && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-zinc-800 rounded-lg border border-white/10 shadow-xl py-1 z-10">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setStatus(option.value); setShowStatusPicker(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 text-xs ${status === option.value ? 'bg-indigo-500/20' : ''}`}
                      >
                        <Circle size={10} className={`${option.color}`} />
                        <span className="text-zinc-300">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Font Style */}
            <div className="mb-3">
              <div className="relative">
                <button
                  onClick={() => setShowFontPicker(!showFontPicker)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors w-full text-xs"
                >
                  <Type size={10} className="text-zinc-400" />
                  <span className="text-zinc-300" style={getUsernameStyle(fontStyle)}>Font: {currentFont.name}</span>
                </button>
                
                {showFontPicker && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-800 rounded-lg border border-white/10 shadow-xl py-1 z-10">
                    {FONT_STYLES.map((font) => (
                      <button
                        key={font.id}
                        onClick={() => { setFontStyle(font.id as FontStyleId); setShowFontPicker(false); }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-white/5 text-xs ${fontStyle === font.id ? 'bg-indigo-500/20' : ''}`}
                      >
                        <span className="text-zinc-300" style={getUsernameStyle(font.id)}>{font.name}</span>
                        <span className="text-zinc-600" style={getUsernameStyle(font.id)}>{font.sample}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-3">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 24))}
                placeholder="Add a bio..."
                maxLength={24}
                className="w-full bg-zinc-800/50 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 resize-none transition-colors"
                rows={2}
              />
              <div className="text-[10px] mt-1 text-right text-zinc-600">{bio.length}/24</div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={12} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
