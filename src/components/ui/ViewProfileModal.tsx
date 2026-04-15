import { useState, useEffect } from 'react';
import { X, Circle, Zap, Trophy, Star, Flame, Sparkles, MessageSquare, ThumbsUp, Pin, CornerDownRight, AtSign, Construction, Heart, UserPlus, PartyPopper, Award, MoreVertical, ShieldAlert, Ban, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';
import { AvatarWithEffect } from './AvatarWithEffect';
import { useAuth } from '@/hooks/useAuth';
import type { UserStatus, BadgeWithStatus } from '@/types/database';
import { getUsernameStyle, getTextColor } from '@/utils/fontStyles';

const BADGE_ICONS: Record<string, string> = {
  'message': '💬', 'message-circle': '💬', 'message-square': '💬',
  'heart': '❤️', 'pin': '📌', 'plus-square': '➕', 'layers': '📚',
  'log-in': '🚪', 'flame': '🔥', 'zap': '⚡', 'at-sign': '@️',
  'corner-down-right': '↩️', 'star': '⭐', 'trophy': '🏆',
  'award': '🏅', 'medal': '🎖️', 'crown': '👑',
};

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
  const { allProfiles, session } = useAuth();
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeWithStatus[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!viewProfile?.id || !session?.user?.id) return;
    
    const checkBlocked = async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.user?.id) return;
      
      const { data } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('user_id', authSession.user.id)
        .eq('blocked_user_id', viewProfile.id)
        .single();
      setIsBlocked(!!data);
    };
    
    checkBlocked();
  }, [viewProfile?.id, session?.user?.id]);

  const handleBlock = async () => {
    if (!viewProfile?.id || !session?.user?.id || actionLoading) return;
    
    setActionLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      
      if (!token) {
        showToast('Not authenticated');
        setActionLoading(false);
        return;
      }
      
      if (isBlocked) {
        const res = await fetch('/api/block', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ blocked_user_id: viewProfile.id }),
        });
        if (res.ok) {
          setIsBlocked(false);
          useChatStore.getState().removeBlockedId(viewProfile.id);
          showToast('User unblocked');
        }
      } else {
        const res = await fetch('/api/block', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ blocked_user_id: viewProfile.id }),
        });
        if (res.ok) {
          setIsBlocked(true);
          useChatStore.getState().addBlockedId(viewProfile.id);
          showToast('User blocked');
        }
      }
    } catch (err) {
      console.error('Block error:', err);
    }
    setActionLoading(false);
    setShowMenu(false);
  };

  const handleReport = async () => {
    if (!selectedReason || !viewProfile?.id || actionLoading) return;
    
    setActionLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      
      if (!token) {
        showToast('Not authenticated');
        setActionLoading(false);
        return;
      }
      
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reported_id: viewProfile.id,
          reason: selectedReason,
          content_snapshot: selectedReason === 'other' ? customReason : undefined,
        }),
      });
      if (res.ok) {
        showToast('Report submitted');
        setShowReportModal(false);
        setSelectedReason('');
        setCustomReason('');
      }
    } catch (err) {
      console.error('Report error:', err);
    }
    setActionLoading(false);
  };

  useEffect(() => {
    if (!viewProfile?.id) return;
    
    let cancelled = false;
    
    const doFetch = async () => {
      setLoadingChallenges(true);
      try {
        const [challengesRes, badgesRes, allBadgesRes] = await Promise.all([
          supabase.from('user_challenges').select('*, challenge:challenges(*)').eq('user_id', viewProfile.id).eq('completed', true),
          supabase.from('user_badges').select('*, badge:badges(*)').eq('user_id', viewProfile.id),
          supabase.from('badges').select('*'),
        ]);

        if (!cancelled) {
          setUserChallenges(challengesRes.data || []);
          setUserBadges(badgesRes.data || []);
          setAllBadges(allBadgesRes.data || []);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
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
  
  const unlockedBadgeIds = new Set(userBadges.map((ub: any) => ub.badge_id));
  const badgesWithStatus: BadgeWithStatus[] = (allBadges || []).map((badge: BadgeWithStatus) => ({
    ...badge,
    unlocked: unlockedBadgeIds.has(badge.id),
    unlocked_at: userBadges.find((ub: any) => ub.badge_id === badge.id)?.unlocked_at,
  }));
  const highlightedBadgeIds = profileData.highlighted_badges || [];
  const highlightedBadges = badgesWithStatus.filter((b: BadgeWithStatus) => b.unlocked && highlightedBadgeIds.includes(b.id));

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && setViewProfile(null)}
    >
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="relative bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
          <div 
            className="h-20 relative bg-cover bg-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
            
            <div className="absolute top-2 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full">
              <Zap size={10} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-400">{userTotalXP} XP</span>
            </div>
            
            <button
              onClick={() => setViewProfile(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white/80 hover:text-white transition-all"
            >
              <X size={14} />
            </button>

            {session?.user?.id && session.user.id !== viewProfile.id && (
              <div className="absolute top-2 right-10">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white/80 hover:text-white transition-all"
                >
                  <MoreVertical size={14} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-36 bg-zinc-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-10">
                    <button
                      onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      <ShieldAlert size={12} className="text-red-400" />
                      Report User
                    </button>
                    <button
                      onClick={handleBlock}
                      disabled={actionLoading}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                      <Ban size={12} className={isBlocked ? "text-green-400" : "text-amber-400"} />
                      {isBlocked ? 'Unblock User' : 'Block User'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="absolute -bottom-8 left-4">
              <AvatarWithEffect 
                profile={profileData} 
                size="lg"
                showStatus={true}
                isOnline={isOnline}
              />
            </div>
          </div>

          <div className="pt-10 px-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-sm font-black text-white">{level}</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white" style={{
                  ...getUsernameStyle(profileData.font_style || viewProfile.font_style),
                  color: getTextColor(profileData.text_color || viewProfile.text_color),
                }}>
                  {profileData.username || viewProfile.username}
                </h2>
                <p className="text-[10px] text-amber-400">{title}</p>
              </div>
            </div>

            <div className="flex gap-3 mb-3">
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/50 rounded-lg border border-white/5">
                <Trophy size={12} className="text-amber-500" />
                <span className="text-xs text-zinc-300">{userChallenges.length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/50 rounded-lg border border-white/5">
                <Star size={12} className="text-amber-500" />
                <span className="text-xs text-zinc-300">{earnedXP}</span>
              </div>
              {userBadges.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/50 rounded-lg border border-white/5">
                  <Award size={12} className="text-purple-500" />
                  <span className="text-xs text-zinc-300">{userBadges.length}</span>
                </div>
              )}
            </div>

            {highlightedBadges.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={10} className="text-indigo-400" />
                  <span className="text-[9px] font-bold text-indigo-400 uppercase">Featured</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {highlightedBadges.map((badge: BadgeWithStatus) => (
                    <div
                      key={badge.id}
                      className="shrink-0 flex flex-col items-center gap-1"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center border"
                        style={{ 
                          backgroundColor: badge.color + '20',
                          borderColor: badge.color + '60',
                        }}
                      >
                        <span className="text-lg">{BADGE_ICONS[badge.icon] || '🏅'}</span>
                      </div>
                      <span className="text-[9px] text-zinc-400 text-center max-w-12 truncate">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 mb-3">
              <Circle size={8} className={`${statusConfig.dot} fill-current`} />
              <span className="text-[10px] text-zinc-400">{statusConfig.label}</span>
            </div>

            {(profileData.bio || viewProfile.bio) && (
              <div className="bg-zinc-800/30 rounded-lg px-3 py-2 mb-3">
                <p className="text-xs text-zinc-300">
                  {profileData.bio || viewProfile.bio}
                </p>
              </div>
            )}

            {userChallenges.length > 0 && (
              <div>
                <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Achievements
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {userChallenges.map((uc) => {
                    if (!uc.challenge) return null;
                    const Icon = getChallengeIcon(uc.challenge);
                    return (
                      <div
                        key={uc.challenge_id}
                        className="flex items-center gap-1 px-1.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full"
                        title={`${uc.challenge.title} - ${uc.challenge.description}`}
                      >
                        <Icon size={10} className="text-amber-400" />
                        <span className="text-[9px] font-medium text-amber-400">{uc.challenge.xp_reward}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {loadingChallenges && (
              <div className="flex items-center justify-center py-3">
                <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {showReportModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowReportModal(false)}
        >
          <div className="w-full max-w-[280px] bg-zinc-900/95 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">Report User</h3>
            <div className="space-y-2 mb-4">
              {[
                { id: 'harassment', label: 'Harassment', desc: 'Bullying or threatening behavior' },
                { id: 'hate_speech', label: 'Hate Speech', desc: 'Content promoting hatred' },
                { id: 'spam', label: 'Spam', desc: 'Unsolicited advertising' },
                { id: 'inappropriate', label: 'Inappropriate', desc: 'Offensive or inappropriate content' },
                { id: 'csam', label: 'Child Safety (CSAM)', desc: 'Child sexual abuse material', isDanger: true },
                { id: 'other', label: 'Other', desc: 'Other violation' },
              ].map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                    selectedReason === reason.id 
                      ? 'border-red-500/50 bg-red-500/10' 
                      : 'border-white/5 bg-zinc-800/50 hover:bg-zinc-800'
                  }`}
                >
                  <span className={`text-xs font-medium ${reason.isDanger ? 'text-red-400' : 'text-white'}`}>{reason.label}</span>
                  <span className="block text-[9px] text-zinc-500">{reason.desc}</span>
                </button>
              ))}
              {selectedReason === 'other' && (
                <input
                  type="text"
                  placeholder="Explain your report..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50"
                  autoFocus
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowReportModal(false); setSelectedReason(''); setCustomReason(''); }}
                className="flex-1 px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim()) || actionLoading}
                className="flex-1 px-3 py-2 text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg transition-colors"
              >
                {actionLoading ? 'Sending...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg shadow-xl z-[220] animate-fade-in">
          <span className="text-xs text-white flex items-center gap-2">
            {toast.includes('blocked') && <Ban size={12} className={isBlocked ? "text-green-400" : "text-amber-400"} />}
            {toast.includes('unblocked') && <Check size={12} className="text-green-400" />}
            {toast.includes('Report') && <ShieldAlert size={12} className="text-red-400" />}
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
