import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';
import { useToast } from '@/store/useToastStore';
import { useAuth } from '@/hooks/useAuth';
import { useUpdate } from '@/hooks/useUpdate';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { MobileSettingsModal } from './MobileSettingsModal';
import { User, Palette, Save, X, Circle, Bell, AtSign, MessageCircle, Volume2, VolumeX, UserCog, BellRing, RefreshCw, Download, Info, Trophy, Zap, Star, Type, Trash2, AlertTriangle, Check, Loader2, ChevronRight, Shield, Ban, UserX } from 'lucide-react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { getVersion } from '@tauri-apps/api/app';
import type { UserStatus, BadgeWithStatus } from '@/types/database';
import { FONT_STYLES, TEXT_COLORS } from '@/types/database';
import { getUsernameStyle } from '@/utils/fontStyles';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FontStyleId, TextColorId } from '@/types/database';
import { AdminReportsDashboard } from './AdminReportsDashboard';

const AVATAR_SEEDS = ['cool', 'tech', 'gamer', 'bit', 'shade', 'neo', 'pixel', 'basement', 'vapor', 'retro', 'funky', 'bottts'];

const IMAGE_OVERLAYS = [
  { id: 'none', name: 'None', url: null },
  { id: 'crown', name: 'Crown', url: '/overlays/crown.png' },
  { id: 'halo', name: 'Halo', url: '/overlays/halo.png' },
  { id: 'sparkles', name: 'Sparkles', url: '/overlays/sparkles.png' },
  { id: 'flames', name: 'Flames', url: '/overlays/flames.png' },
  { id: 'stars', name: 'Stars', url: '/overlays/stars.png' },
  { id: 'heart', name: 'Heart', url: '/overlays/heart.png' },
  { id: 'diamond', name: 'Diamond', url: '/overlays/diamond.png' },
  { id: 'lightning', name: 'Lightning', url: '/overlays/lightning.png' },
];

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string; bgColor: string }[] = [
  { value: 'online', label: 'Online', color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
  { value: 'away', label: 'Away', color: 'text-yellow-400', bgColor: 'bg-yellow-500' },
  { value: 'busy', label: 'Busy', color: 'text-red-400', bgColor: 'bg-red-500' },
  { value: 'dnd', label: 'DND', color: 'text-red-500', bgColor: 'bg-red-600' },
];

const EFFECTS = [
  { 
    id: 'none', 
    name: 'None', 
    preview: () => (
      <div className="w-14 h-14 rounded-full bg-zinc-800" />
    )
  },
  { 
    id: 'fire', 
    name: 'Fire', 
    preview: () => (
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-b from-orange-400 to-red-600 animate-pulse" />
        <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-gradient-to-b from-yellow-400 to-red-500" />
      </div>
    )
  },
  { 
    id: 'basketball', 
    name: 'Basketball', 
    preview: () => (
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 relative overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 49%, rgba(0,0,0,0.3) 50%, transparent 51%),
              linear-gradient(90deg, transparent 49%, rgba(0,0,0,0.3) 50%, transparent 51%)
            `,
            backgroundSize: '100% 100%'
          }} />
        </div>
        <div className="absolute inset-0 rounded-full ring-2 ring-orange-600 animate-spin" style={{ animationDuration: '4s' }} />
      </div>
    )
  },
];

const OVERLAYS = [
  { id: 'none', name: 'None', icon: X },
  { id: 'crown', name: 'Crown', icon: () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#fbbf24">
      <path d="M5 16L3 6l5 4 4-7 4 7 5-4-2 10H5z"/>
      <rect x="5" y="17" width="14" height="3" rx="1"/>
    </svg>
  )},
  { id: 'halo', name: 'Halo', icon: () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#fef08a">
      <ellipse cx="12" cy="8" rx="8" ry="3" fill="none" stroke="#fef08a" strokeWidth="2"/>
    </svg>
  )},
  { id: 'horns', name: 'Devil Horns', icon: () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#ef4444">
      <path d="M4 8c0-4 3-8 8-8 0 4-3 8-8 8z"/>
      <path d="M20 8c0-4-3-8-8-8 0 4 3 8 8 8z"/>
    </svg>
  )},
  { id: 'peeking-cat', name: 'Peeking Cat', icon: () => (
    <svg viewBox="0 0 40 30" className="w-8 h-6">
      <ellipse cx="20" cy="22" rx="15" ry="8" fill="#f5a623"/>
      <circle cx="12" cy="20" r="4" fill="#f5a623"/>
      <circle cx="28" cy="20" r="4" fill="#f5a623"/>
      <ellipse cx="20" cy="24" rx="3" ry="2" fill="#ffb6c1"/>
      <circle cx="14" cy="18" r="2" fill="#333"/>
      <circle cx="26" cy="18" r="2" fill="#333"/>
      <path d="M18 22 Q20 24 22 22" stroke="#333" strokeWidth="1" fill="none"/>
      <path d="M8 8 Q12 16 14 14" stroke="#f5a623" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M32 8 Q28 16 26 14" stroke="#f5a623" strokeWidth="4" fill="none" strokeLinecap="round"/>
    </svg>
  )},
  { id: 'ssj-hair', name: 'SSJ Hair', icon: () => (
    <svg viewBox="0 0 40 30" className="w-8 h-6">
      <path d="M8 18 L4 6 L10 12 L12 2 L16 14 L20 0 L24 14 L28 2 L30 12 L36 6 L32 18" fill="#facc15" stroke="#eab308" strokeWidth="1"/>
      <path d="M10 20 L6 12 L12 16 L20 10 L28 16 L34 12 L30 20" fill="#facc15"/>
    </svg>
  )},
];

const SIDEBAR_TABS = [
  { id: 'profile', label: 'Profile', icon: UserCog },
  { id: 'avatar', label: 'Avatar', icon: Palette },
  { id: 'status', label: 'Status', icon: Circle },
  { id: 'notifications', label: 'Notifications', icon: BellRing },
  { id: 'gamification', label: 'Gamification', icon: Trophy },
  { id: 'account', label: 'Account', icon: User },
  { id: 'blocked', label: 'Blocked', icon: Ban },
  { id: 'admin', label: 'Admin', icon: Shield },
  { id: 'about', label: 'About', icon: Info },
];

const BADGE_ICONS: Record<string, string> = {
  'message': '💬', 'message-circle': '💬', 'message-square': '💬',
  'heart': '❤️', 'pin': '📌', 'plus-square': '➕', 'layers': '📚',
  'log-in': '🚪', 'flame': '🔥', 'zap': '⚡', 'at-sign': '@️',
  'corner-down-right': '↩️', 'star': '⭐', 'trophy': '🏆',
  'award': '🏅', 'medal': '🎖️', 'crown': '👑',
};

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

const getChallengeIcon = (challenge: Challenge): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    'login_streak': Zap,
    'first_message': MessageCircle,
    'send_messages': MessageCircle,
    'reactions_given': AtSign,
    'pins_created': Bell,
    'replies_sent': MessageCircle,
    'mentions_sent': AtSign,
    'channels_created': User,
  };
  return icons[challenge.type] || Star;
};

interface SettingsModalProps {
  myProfile?: any;
  challenges?: Challenge[];
  totalXP?: number;
  badges?: BadgeWithStatus[];
}

export function SettingsModal({ myProfile, challenges = [], totalXP = 0, badges = [] }: SettingsModalProps) {
  const { showSettings, setShowSettings, notificationSettings, toggleNotificationSetting, updateUserProfile } = useChatStore();
  const toast = useToast();
  const { session, updateProfile } = useAuth();
  const { update: updateInfo, isChecking, isDownloading, downloadProgress, checkForUpdates, downloadAndInstall } = useUpdate();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editStatus, setEditStatus] = useState<UserStatus>('online');
  const [editEffect, setEditEffect] = useState<string>('none');
  const [editOverlay, setEditOverlay] = useState<string>('none');
  const [editOverlayUrl, setEditOverlayUrl] = useState<string | null>(null);
  const [editFontStyle, setEditFontStyle] = useState<FontStyleId>('default');
  const [editTextColor, setEditTextColor] = useState<TextColorId>('default');
  const [notifPermission, setNotifPermission] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [highlightedBadges, setHighlightedBadges] = useState<string[]>([]);
  const [deleteStep, setDeleteStep] = useState<number>(0);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => {});
  }, []);

  useEffect(() => {
    if (showSettings && myProfile) {
      setEditUsername(myProfile.username || '');
      setEditAvatar(myProfile.avatar_url || '');
      setEditStatus(myProfile.status || 'online');
      setEditEffect(myProfile.avatar_effect || 'none');
      setEditOverlay(myProfile.avatar_overlays || 'none');
      setEditOverlayUrl(myProfile.avatar_overlay_url || null);
      setEditFontStyle(myProfile.font_style || 'default');
      setEditTextColor(myProfile.text_color || 'default');
      setHighlightedBadges(myProfile.highlighted_badges || []);
      setActiveTab('profile');
    }
  }, [showSettings, myProfile]);

  useEffect(() => {
    async function checkPermission() {
      const granted = await isPermissionGranted();
      setNotifPermission(granted);
    }
    if (showSettings) checkPermission();
  }, [showSettings]);

  useEffect(() => {
    async function fetchMessageCount() {
      if (activeTab === 'account' && session?.user?.id) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);
        setMessageCount(count || 0);
      }
    }
    fetchMessageCount();
  }, [activeTab, session?.user?.id]);

  const handleRequestPermission = async () => {
    const permission = await requestPermission();
    setNotifPermission(permission === 'granted');
  };

  const handleTestNotification = () => {
    sendNotification({ title: '🔔 The Basement', body: 'Notifications are working!' });
  };

  const fetchBlockedUsers = async () => {
    setBlockedLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.user?.id) {
        setBlockedLoading(false);
        return;
      }
      
      const { data: blockedData } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', authSession.user.id);
      
      if (!blockedData || blockedData.length === 0) {
        setBlockedUsers([]);
        useChatStore.getState().setBlockedIds([]);
        setBlockedLoading(false);
        return;
      }
      
      const blockedIdsList = blockedData.map(b => b.blocked_user_id);
      useChatStore.getState().setBlockedIds(blockedIdsList);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', blockedIdsList);
      
      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.id] = p; });
      
      const blockedWithProfiles = blockedData.map(b => ({
        ...b,
        blocked_user: profileMap[b.blocked_user_id] || null,
      }));
      
      setBlockedUsers(blockedWithProfiles);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
    setBlockedLoading(false);
  };

  const handleUnblock = async (blockedUserId: string) => {
    if (!session?.user?.id) return;
    setUnblockingId(blockedUserId);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token || session.access_token;
      
      const res = await fetch('/api/block', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ blocked_user_id: blockedUserId }),
      });
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.blocked_user_id !== blockedUserId));
        useChatStore.getState().removeBlockedId(blockedUserId);
        toast.success('User unblocked');
      }
    } catch (err) {
      console.error('Error unblocking:', err);
    }
    setUnblockingId(null);
  };

  useEffect(() => {
    if (activeTab === 'blocked') {
      fetchBlockedUsers();
    }
  }, [activeTab]);

  if (!showSettings) return null;

  const handleSave = async () => {
    const updates: Record<string, any> = { 
      username: editUsername, 
      avatar_url: editAvatar, 
      status: editStatus, 
      avatar_effect: editEffect === 'none' ? null : editEffect,
      avatar_overlays: editOverlay === 'none' ? null : editOverlay,
      highlighted_badges: highlightedBadges,
      font_style: editFontStyle === 'default' ? null : editFontStyle,
      text_color: editTextColor === 'default' ? null : editTextColor,
    };
    if (editOverlayUrl) updates.avatar_overlay_url = editOverlayUrl;
    else updates.avatar_overlay_url = null;
    
    updateUserProfile(updates);
    updateProfile(session?.user?.id, updates);
    
    const { error } = await supabase.from('profiles').update(updates).eq('id', myProfile.id);
    if (!error) toast.success('Settings saved successfully');
    else toast.error('Failed to save settings');
  };

  const renderOverlayPreview = (overlayId: string) => {
    const overlay = OVERLAYS.find(o => o.id === overlayId);
    if (!overlay) return null;
    const avatarUrl = editAvatar || myProfile?.avatar_url || `https://ui-avatars.com/api/?name=${editUsername || myProfile?.username || 'U'}`;
    
    if (overlayId === 'crown') return (
      <div className="relative">
        <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <svg viewBox="0 0 24 24" className="w-10 h-10" fill="#fbbf24"><path d="M5 16L3 6l5 4 4-7 4 7 5-4-2 10H5z"/><rect x="5" y="17" width="14" height="3" rx="1"/></svg>
        </div>
      </div>
    );
    if (overlayId === 'halo') return (
      <div className="relative">
        <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
          <svg viewBox="0 0 24 24" className="w-12 h-12" fill="#fef08a"><ellipse cx="12" cy="4" rx="8" ry="3"/></svg>
        </div>
      </div>
    );
    if (overlayId === 'horns') return (
      <div className="relative">
        <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
          <svg viewBox="0 0 24 24" className="w-10 h-10" fill="#ef4444"><path d="M3 6c0-3 2.5-5 5-5 0 3-2.5 5-5 5z"/><path d="M21 6c0-3-2.5-5-5-5 0 3 2.5 5 5 5z"/></svg>
        </div>
      </div>
    );
    if (overlayId === 'peeking-cat') return (
      <div className="relative">
        <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
        <div className="absolute -bottom-1 -right-1 z-10">
          <svg viewBox="0 0 40 30" className="w-10 h-8"><ellipse cx="20" cy="22" rx="15" ry="8" fill="#f5a623"/><circle cx="12" cy="20" r="4" fill="#f5a623"/><circle cx="28" cy="20" r="4" fill="#f5a623"/><ellipse cx="20" cy="24" rx="3" ry="2" fill="#ffb6c1"/><circle cx="14" cy="18" r="1.5" fill="#333"/><circle cx="26" cy="18" r="1.5" fill="#333"/></svg>
        </div>
      </div>
    );
    if (overlayId === 'ssj-hair') return (
      <div className="relative">
        <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <svg viewBox="0 0 40 30" className="w-16 h-12"><path d="M5 22 L2 8 L8 14 L10 2 L14 16 L20 0 L26 16 L30 2 L32 14 L38 8 L35 22" fill="#facc15" stroke="#eab308" strokeWidth="0.5" strokeLinejoin="round"/><path d="M8 24 L4 14 L10 18 L14 10 L20 14 L26 10 L30 18 L36 14 L32 24 Z" fill="#facc15" stroke="#eab308" strokeWidth="0.5"/></svg>
        </div>
      </div>
    );
    return <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />;
  };

  const userTotalXP = myProfile?.total_xp || totalXP;
  const completedChallenges = challenges.filter((c: Challenge) => c.completed);
  const earnedXP = completedChallenges.reduce((sum, c) => sum + c.xp_reward, 0);
  const unlockedBadges = badges.filter((b: BadgeWithStatus) => b.unlocked);
  const lockedBadges = badges.filter((b: BadgeWithStatus) => !b.unlocked);

  const getLevelTitle = (xp: number): string => {
    if (xp >= 2000) return 'Legend';
    if (xp >= 1200) return 'Master';
    if (xp >= 800) return 'Expert';
    if (xp >= 500) return 'Veteran';
    if (xp >= 300) return 'Contributor';
    if (xp >= 150) return 'Active';
    if (xp >= 50) return 'Regular';
    return 'Newcomer';
  };

  const getLevel = (xp: number): number => {
    if (xp >= 2000) return 8;
    if (xp >= 1200) return 7;
    if (xp >= 800) return 6;
    if (xp >= 500) return 5;
    if (xp >= 300) return 4;
    if (xp >= 150) return 3;
    if (xp >= 50) return 2;
    return 1;
  };

  if (isMobile) {
    return <MobileSettingsModal onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
      <div className="relative w-full max-w-4xl h-[580px] animate-scale-in flex">
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl text-white overflow-hidden flex w-full">
          {/* Vertical Sidebar */}
          <div className="w-40 border-r border-white/5 flex flex-col shrink-0">
            <div className="h-12 flex items-center px-4 border-b border-white/5">
              <span className="text-sm font-semibold">Settings</span>
            </div>
            <nav className="flex-1 py-2">
              {SIDEBAR_TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-[13px] transition-all ${
                      activeTab === tab.id
                        ? 'text-white bg-white/5 border-r-2 border-indigo-500'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                    {tab.id === 'gamification' && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                        {completedChallenges.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
              <h2 className="text-base font-semibold capitalize">{activeTab}</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-2">Username</label>
                    <input 
                      className="w-full bg-zinc-900/80 p-2.5 rounded-lg outline-none border border-white/5 focus:border-indigo-500/50 text-sm transition-all" 
                      value={editUsername} onChange={(e) => setEditUsername(e.target.value)} 
                      placeholder="Enter username..."
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <Type size={10} className="text-zinc-600" />
                      <span className="text-[10px] text-zinc-600">
                        Preview: <span style={{ ...getUsernameStyle(editFontStyle), color: TEXT_COLORS.find(c => c.id === editTextColor)?.color || '#818cf8' }}>{editUsername || 'Username'}</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-2">Text Color</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TEXT_COLORS.map(color => (
                        <button
                          key={color.id}
                          onClick={() => setEditTextColor(color.id as TextColorId)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editTextColor === color.id ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color.color }}
                          title={color.name}
                        >
                          {color.id === 'default' && <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-purple-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-2">Font Style</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {FONT_STYLES.map(font => (
                        <button
                          key={font.id}
                          onClick={() => setEditFontStyle(font.id as FontStyleId)}
                          className={`px-3 py-2 rounded-lg text-xs transition-all ${editFontStyle === font.id ? 'bg-indigo-600/30 border border-indigo-500/50' : 'bg-zinc-900/50 border border-transparent hover:border-white/10'}`}
                          style={getUsernameStyle(font.id)}
                        >
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Avatar Tab */}
              {activeTab === 'avatar' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-2">Avatar</label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {AVATAR_SEEDS.map(s => {
                        const url = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}`;
                        return (
                          <button key={s} onClick={() => setEditAvatar(url)}
                            className={`relative aspect-square rounded-lg overflow-hidden transition-all cursor-pointer ${editAvatar === url ? 'ring-2 ring-indigo-500 scale-105' : 'hover:ring-1 hover:ring-white/20'}`}>
                            <img src={url} className="w-full h-full object-cover bg-zinc-800" alt="" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-2">Effects</label>
                    <div className="flex gap-2">
                      {EFFECTS.map(effect => (
                        <button key={effect.id} onClick={() => setEditEffect(effect.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${editEffect === effect.id ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-400' : 'bg-zinc-900/50 border border-transparent hover:border-white/10 text-zinc-400'}`}>
                          {effect.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-2">Overlays</label>
                    <div className="flex flex-wrap gap-1.5">
                      {OVERLAYS.map(overlay => {
                        const Icon = overlay.icon as (props: any) => ReactNode;
                        return (
                          <button key={overlay.id} onClick={() => setEditOverlay(overlay.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${editOverlay === overlay.id ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-400' : 'bg-zinc-900/50 border border-transparent hover:border-white/10 text-zinc-400'}`}>
                            {overlay.id === 'none' ? <X size={12} /> : <Icon />}
                            {overlay.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-2">Preview</label>
                    <div className="flex items-center justify-center p-6 bg-zinc-900/30 rounded-lg border border-white/5">
                      <div className="relative">
                        {(editAvatar || myProfile?.avatar_url) ? (
                          <div className="relative inline-block">
                            {editEffect === 'fire' && (
                              <><div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-b from-orange-500 via-red-500 to-transparent blur-md opacity-75" /></>
                            )}
                            {editEffect === 'basketball' && <div className="absolute -inset-2 rounded-full"><div className="w-full h-full rounded-full border-4 border-orange-500 animate-spin" style={{ animationDuration: '3s' }} /></div>}
                            {editOverlayUrl ? (
                              <><img src={editAvatar || myProfile?.avatar_url} className="w-20 h-20 rounded-full object-cover" alt="" /><div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10"><img src={editOverlayUrl} className="w-12 h-12 object-contain" alt="overlay" /></div></>
                            ) : renderOverlayPreview(editOverlay)}
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600">No avatar</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Tab */}
              {activeTab === 'status' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map(status => (
                      <button key={status.value} onClick={() => setEditStatus(status.value)}
                        className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${editStatus === status.value ? 'bg-zinc-800/80 ring-2 ring-indigo-500/50' : 'bg-zinc-900/50 hover:bg-zinc-800/50 border border-transparent'}`}>
                        <div className={`w-3 h-3 rounded-full ${status.bgColor}`} />
                        <span className="text-zinc-400">{status.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                    <Bell size={16} className={notifPermission ? 'text-emerald-400' : 'text-zinc-500'} />
                    <div className="flex-1 text-xs">
                      <div className="text-zinc-200">Desktop Notifications</div>
                      <div className={notifPermission ? 'text-emerald-400/80' : 'text-zinc-500'}>{notifPermission ? 'Enabled' : 'Disabled'}</div>
                    </div>
                    {!notifPermission ? (
                      <button onClick={handleRequestPermission} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg cursor-pointer">Enable</button>
                    ) : (
                      <button onClick={handleTestNotification} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg cursor-pointer">Test</button>
                    )}
                  </div>
                  {notifPermission && (
                    <div className="flex gap-2">
                      <button onClick={() => toggleNotificationSetting('mentions')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${notificationSettings.mentions ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400' : 'bg-zinc-900/50 border border-transparent text-zinc-500'}`}>
                        <AtSign size={12} /> Mentions
                      </button>
                      <button onClick={() => toggleNotificationSetting('sound')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${notificationSettings.sound ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400' : 'bg-zinc-900/50 border border-transparent text-zinc-500'}`}>
                        {notificationSettings.sound ? <Volume2 size={12} /> : <VolumeX size={12} />} Sound
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Gamification Tab */}
              {activeTab === 'gamification' && (
                <div className="space-y-4 animate-fade-in">
                  {/* XP & Level Summary */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <span className="text-lg font-black text-white">{getLevel(userTotalXP)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{getLevelTitle(userTotalXP)}</div>
                      <div className="flex items-center gap-1 text-xs text-amber-400">
                        <Zap size={10} />
                        <span>{userTotalXP} XP</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{completedChallenges.length}</div>
                      <div className="text-[10px] text-zinc-500">Done</div>
                    </div>
                  </div>

                  {/* Challenges */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={12} className="text-amber-500" />
                      <h3 className="text-xs font-semibold">Challenges</h3>
                    </div>
                    <div className="space-y-1.5">
                      {challenges.map((challenge) => {
                        const Icon = getChallengeIcon(challenge);
                        const progress = Math.min((challenge.progress / challenge.goal) * 100, 100);
                        return (
                          <div key={challenge.id} className={`p-2.5 rounded-lg border transition-all ${challenge.completed ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-900/50 border-white/5'}`}>
                            <div className="flex items-center gap-2">
                              <Icon size={14} className={challenge.completed ? 'text-amber-400' : 'text-zinc-500'} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-white truncate">{challenge.title}</span>
                                  {challenge.completed && <span className="text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded uppercase">Done</span>}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                                  </div>
                                  <span className="text-[9px] text-zinc-500">{challenge.progress}/{challenge.goal}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 text-amber-400 text-[10px]">
                                <Zap size={10} />
                                <span>{challenge.xp_reward}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {challenges.length === 0 && (
                        <div className="text-center py-6 text-zinc-500 text-xs">No challenges available</div>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={12} className="text-purple-500" />
                      <h3 className="text-xs font-semibold">Badges</h3>
                      <span className="text-[10px] text-zinc-500 ml-auto">{unlockedBadges.length}/{badges.length}</span>
                    </div>
                    
                    {unlockedBadges.length > 0 && (
                      <div className="grid grid-cols-4 gap-1.5">
                        {unlockedBadges.map((badge: BadgeWithStatus) => {
                          const isHighlighted = highlightedBadges.includes(badge.id);
                          return (
                            <button
                              key={badge.id}
                              onClick={() => {
                                if (isHighlighted) {
                                  setHighlightedBadges(prev => prev.filter(id => id !== badge.id));
                                } else if (highlightedBadges.length < 3) {
                                  setHighlightedBadges(prev => [...prev, badge.id]);
                                }
                              }}
                              className={`relative p-2 rounded-lg border transition-all cursor-pointer ${isHighlighted ? 'border-indigo-500' : 'border-transparent hover:border-white/10'}`}
                              style={{ backgroundColor: badge.color + '15' }}
                            >
                              <span className={`text-xl block text-center ${isHighlighted ? '' : 'grayscale opacity-50'}`}>{BADGE_ICONS[badge.icon] || '🏅'}</span>
                              <span className="text-[9px] text-white/80 block text-center truncate mt-1">{badge.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Account Tab - Delete Account */}
              {activeTab === 'account' && !deleteSuccess && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Delete Account</h3>
                        <p className="text-xs text-red-400/80">This action cannot be undone</p>
                      </div>
                    </div>
                    
                    {deleteStep === 0 && (
                      <div className="space-y-4">
                        <p className="text-xs text-zinc-400">
                          Permanently delete your account and all associated data. This process is <strong className="text-white">irreversible</strong>.
                        </p>
                        
                        <div className="bg-zinc-900/50 rounded-lg p-3 space-y-2">
                          <h4 className="text-xs font-semibold text-white">The following will be permanently deleted:</h4>
                          <ul className="text-xs text-zinc-400 space-y-1">
                            <li className="flex items-center gap-2">
                              <X size={12} className="text-red-400" /> Your account and profile
                            </li>
                            <li className="flex items-center gap-2">
                              <X size={12} className="text-red-400" /> {messageCount || 0} messages you've sent
                            </li>
                            <li className="flex items-center gap-2">
                              <X size={12} className="text-red-400" /> Your avatar and customization settings
                            </li>
                            <li className="flex items-center gap-2">
                              <X size={12} className="text-red-400" /> All badges and XP progress
                            </li>
                            <li className="flex items-center gap-2">
                              <X size={12} className="text-red-400" /> Your channel memberships
                            </li>
                          </ul>
                        </div>
                        
                        <button
                          onClick={() => setDeleteStep(1)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-all"
                        >
                          <Trash2 size={14} /> Continue with Deletion
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                    
                    {deleteStep === 1 && (
                      <div className="space-y-4">
                        <p className="text-xs text-zinc-400">
                          Enter your password to verify your identity.
                        </p>
                        
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full bg-zinc-900/80 p-3 rounded-lg border border-white/10 text-white text-sm placeholder:text-zinc-600 outline-none focus:border-red-500/50"
                        />
                        
                        {deleteError && (
                          <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400">
                            {deleteError}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setDeleteStep(0); setDeletePassword(''); setDeleteError(''); }}
                            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              if (!deletePassword) {
                                setDeleteError('Please enter your password');
                                return;
                              }
                              setDeleteLoading(true);
                              setDeleteError('');
                              
                              const { error } = await supabase.auth.signInWithPassword({
                                email: session?.user?.email || '',
                                password: deletePassword
                              });
                              
                              if (error) {
                                setDeleteError('Incorrect password. Please try again.');
                                setDeleteLoading(false);
                              } else {
                                setDeleteStep(2);
                                setDeleteLoading(false);
                              }
                            }}
                            disabled={deleteLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all"
                          >
                            {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Verify
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {deleteStep === 2 && (
                      <div className="space-y-4">
                        <p className="text-xs text-zinc-400">
                          Type <strong className="text-red-400">DELETE</strong> to confirm permanent account deletion.
                        </p>
                        
                        <input
                          type="text"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                          placeholder="Type DELETE to confirm"
                          className="w-full bg-zinc-900/80 p-3 rounded-lg border border-white/10 text-white text-sm placeholder:text-zinc-600 outline-none focus:border-red-500/50 font-mono"
                        />
                        
                        <button
                          onClick={async () => {
                            if (deleteConfirm !== 'DELETE') {
                              setDeleteError('Please type DELETE exactly to confirm');
                              return;
                            }
                            setDeleteLoading(true);
                            setDeleteError('');
                            
                            try {
                              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                              const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
                              const userId = session?.user?.id;
                              
                              if (!userId) {
                                setDeleteError('Session expired. Please sign in again.');
                                setDeleteLoading(false);
                                return;
                              }
                              
                              const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'apikey': anonKey,
                                  'Authorization': `Bearer ${anonKey}`
                                },
                                body: JSON.stringify({ userId })
                              });
                              
                              if (!response.ok) {
                                const data = await response.json();
                                throw new Error(data.error || 'Failed to delete account');
                              }
                              
                              setDeleteSuccess(true);
                              await supabase.auth.signOut();
                              window.location.reload();
                            } catch (err: any) {
                              setDeleteError(err.message || 'Failed to delete account. Please try again.');
                              setDeleteLoading(false);
                            }
                          }}
                          disabled={deleteLoading || deleteConfirm !== 'DELETE'}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all"
                        >
                          {deleteLoading ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Deleting Account...
                            </>
                          ) : (
                            <>
                              <Trash2 size={14} />
                              Permanently Delete My Account
                            </>
                          )}
                        </button>
                        
                        {deleteError && (
                          <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400">
                            {deleteError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-zinc-800/30 rounded-xl p-4 border border-white/5">
                    <h4 className="text-xs font-semibold text-white mb-2">Your Rights Under CCPA</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      As a California resident, you have the right to know what personal information is collected about you, to request deletion of your personal information, and to opt-out of the sale of your personal information. To exercise these rights, you may delete your account at any time through this feature.
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'account' && deleteSuccess && (
                <div className="space-y-4 animate-fade-in text-center py-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check size={32} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Account Deletion Initiated</h3>
                  <p className="text-sm text-zinc-400">
                    Your account and all associated data will be permanently deleted. Thank you for using The Basement.
                  </p>
                </div>
              )}

              {/* Blocked Users Tab */}
              {activeTab === 'blocked' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center py-4">
                    <Ban size={32} className="mx-auto mb-2 text-amber-400" />
                    <h2 className="text-sm font-bold text-white">Blocked Users</h2>
                    <p className="text-xs text-zinc-500">Manage who you have blocked</p>
                  </div>
                  
                  {blockedLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                  ) : blockedUsers.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <UserX size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No blocked users</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {blockedUsers.map((blocked) => (
                        <div
                          key={blocked.id}
                          className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 rounded-lg border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={blocked.blocked_user?.avatar_url || `https://ui-avatars.com/api/?name=${blocked.blocked_user?.username || 'U'}`}
                              alt=""
                              className="w-8 h-8 rounded-full bg-zinc-700"
                            />
                            <span className="text-sm text-white">
                              {blocked.blocked_user?.username || 'Unknown User'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleUnblock(blocked.blocked_user_id)}
                            disabled={unblockingId === blocked.blocked_user_id}
                            className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {unblockingId === blocked.blocked_user_id ? 'Unblocking...' : 'Unblock'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Admin Tab */}
              {activeTab === 'admin' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center py-4">
                    <Shield size={32} className="mx-auto mb-2 text-red-400" />
                    <h2 className="text-sm font-bold text-white">Admin Dashboard</h2>
                    <p className="text-xs text-zinc-500">Review user reports and content moderation</p>
                  </div>
                  
                  <button
                    onClick={() => setShowAdminDashboard(true)}
                    className="w-full px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Open Reports Dashboard
                  </button>
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-2xl font-black text-white">B</span>
                    </div>
                    <h2 className="text-lg font-bold text-white">The Basement</h2>
                    <p className="text-xs text-zinc-500">v{appVersion}</p>
                  </div>

                  <div className="bg-zinc-800/30 rounded-lg border border-white/5 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw size={14} className="text-indigo-400" />
                      <span className="text-xs font-semibold text-white">Auto Updates</span>
                    </div>
                    {updateInfo ? (
                      <div className="space-y-2">
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400">
                          Update: v{updateInfo.version}
                        </div>
                        {isDownloading ? (
                          <div>
                            <div className="flex justify-between text-[10px] mb-1"><span className="text-zinc-400">Downloading...</span><span className="text-white">{downloadProgress}%</span></div>
                            <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${downloadProgress}%` }} /></div>
                          </div>
                        ) : (
                          <button onClick={downloadAndInstall} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg cursor-pointer">
                            <Download size={12} /> Download
                          </button>
                        )}
                      </div>
                    ) : (
                      <button onClick={checkForUpdates} disabled={isChecking}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-xs rounded-lg cursor-pointer">
                        {isChecking ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={12} />} Check
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {activeTab !== 'about' && activeTab !== 'admin' && activeTab !== 'blocked' && (
              <div className="px-4 py-3 border-t border-white/5 bg-black/20 shrink-0">
                <div className="flex gap-2">
                  <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <Save size={12} /> Save
                  </button>
                  <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-zinc-400 hover:text-white bg-zinc-800/50 border border-white/10 hover:border-white/20 rounded-lg text-xs cursor-pointer">
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdminDashboard && (
        <AdminReportsDashboard onClose={() => setShowAdminDashboard(false)} />
      )}
    </div>
  );
}
