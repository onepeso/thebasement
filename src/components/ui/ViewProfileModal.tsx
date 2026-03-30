import { useState, useEffect } from 'react';
import { X, Circle, Zap, Trophy, Star, Flame, Sparkles, MessageSquare, ThumbsUp, Pin, CornerDownRight, AtSign, Construction, Heart, UserPlus, PartyPopper } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';
import { AvatarWithEffect } from './AvatarWithEffect';
import { useAuth } from '@/hooks/useAuth';
import type { UserStatus } from '@/types/database';

const STATUS_COLORS: Record<string, { dot: string; label: string; text: string }> = {
  online: { dot: 'bg-emerald-500', label: 'Online', text: 'text-emerald-400' },
  away: { dot: 'bg-yellow-500', label: 'Away', text: 'text-yellow-400' },
  busy: { dot: 'bg-red-500', label: 'Busy', text: 'text-red-400' },
  dnd: { dot: 'bg-red-600', label: 'Do Not Disturb', text: 'text-red-500' },
  offline: { dot: 'bg-zinc-600', label: 'Offline', text: 'text-zinc-400' },
};

interface ViewProfileModalProps {
  onlineUsers: string[];
}

interface Challenge {
  id: string;
  type: string;
  title: string;
  description: string;
  goal: number;
  xp_reward: number;
  icon?: string;
}

interface UserChallenge {
  challenge_id: string;
  progress: number;
  completed: boolean;
  challenge?: Challenge;
}

const getLevel = (xp: number): { level: number; title: string } => {
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
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXP) {
      currentLevel = levels[i];
      break;
    }
  }
  
  return {
    level: levels.indexOf(currentLevel) + 1,
    title: currentLevel.title,
  };
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

export function ViewProfileModal({ onlineUsers }: ViewProfileModalProps) {
  const { viewProfile, setViewProfile } = useChatStore();
  const { allProfiles } = useAuth();
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  useEffect(() => {
    if (!viewProfile?.id) return;
    
    let cancelled = false;
    
    const doFetch = async () => {
      setLoadingChallenges(true);
      try {
        const { data: challenges } = await supabase
          .from('user_challenges')
          .select('*, challenge:challenges(*)')
          .eq('user_id', viewProfile.id)
          .eq('completed', true);

        if (!cancelled) {
          setUserChallenges(challenges || []);
        }
      } catch (err) {
        console.error('Error fetching user challenges:', err);
      }
      if (!cancelled) {
        setLoadingChallenges(false);
      }
    };
    
    doFetch();
    
    return () => {
      cancelled = true;
    };
  }, [viewProfile?.id]);

  if (!viewProfile) return null;

  const profileData = allProfiles.find(p => p.id === viewProfile.id) || viewProfile;
  const isOnline = onlineUsers.includes(viewProfile.id);
  const customStatus = profileData.status as UserStatus | undefined;
  const status = isOnline ? (customStatus || 'online') : 'offline';
  const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.offline;
  
  const userTotalXP = profileData.total_xp || 0;
  const { level, title } = getLevel(userTotalXP);
  const earnedXP = userChallenges.reduce((sum, uc) => sum + (uc.challenge?.xp_reward || 0), 0);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && setViewProfile(null)}
    >
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
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
            
            <button
              onClick={() => setViewProfile(null)}
              className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white/80 hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            <div className="absolute -bottom-10 left-4">
              <AvatarWithEffect 
                profile={profileData} 
                size="xl"
                showStatus={true}
                isOnline={isOnline}
              />
            </div>
          </div>

          <div className="pt-14 sm:pt-16 px-4 sm:px-6 pb-6">
            {/* Level & Title */}
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                  <span className="text-lg font-black text-white">{level}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {profileData.username || viewProfile.username}
                  </h2>
                  <p className="text-sm text-amber-400">{title}</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-white/5">
                <Trophy size={14} className="text-amber-500" />
                <span className="text-sm text-zinc-300">{userChallenges.length} achievements</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-white/5">
                <Star size={14} className="text-amber-500" />
                <span className="text-sm text-zinc-300">{earnedXP} XP earned</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              <Circle size={10} className={`${statusConfig.dot} fill-current`} />
              <span className="text-xs text-zinc-400">{statusConfig.label}</span>
            </div>

            {/* Bio */}
            {(profileData.bio || viewProfile.bio) && (
              <div className="bg-zinc-800/30 rounded-lg px-4 py-3 mb-4">
                <p className="text-sm text-zinc-300">
                  {profileData.bio || viewProfile.bio}
                </p>
              </div>
            )}

            {/* Achievements */}
            {userChallenges.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Achievements
                </h3>
                <div className="flex flex-wrap gap-2">
                  {userChallenges.map((uc) => {
                    if (!uc.challenge) return null;
                    const Icon = getChallengeIcon(uc.challenge);
                    return (
                      <div
                        key={uc.challenge_id}
                        className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full"
                        title={`${uc.challenge.title} - ${uc.challenge.description}`}
                      >
                        <Icon size={14} className="text-amber-400" />
                        <span className="text-[10px] font-medium text-amber-400">{uc.challenge.xp_reward} XP</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {loadingChallenges && (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
