import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';
import { useToast } from '@/store/useToastStore';
import { useAuth } from '@/hooks/useAuth';
import { useUpdate } from '@/hooks/useUpdate';
import { User, Palette, Save, X, Circle, Bell, AtSign, MessageCircle, Volume2, VolumeX, UserCog, BellRing, RefreshCw, Download, Info } from 'lucide-react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { getVersion } from '@tauri-apps/api/app';
import type { UserStatus } from '@/types/database';

const AVATAR_SEEDS = ['cool', 'tech', 'gamer', 'bit', 'shade', 'neo', 'pixel', 'basement', 'vapor', 'retro', 'funky', 'bottts'];

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
  { 
    id: 'none', 
    name: 'None', 
    icon: X,
  },
  { 
    id: 'crown', 
    name: 'Crown', 
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#fbbf24">
        <path d="M5 16L3 6l5 4 4-7 4 7 5-4-2 10H5z"/>
        <rect x="5" y="17" width="14" height="3" rx="1"/>
      </svg>
    ),
  },
  { 
    id: 'halo', 
    name: 'Halo', 
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#fef08a">
        <ellipse cx="12" cy="8" rx="8" ry="3" fill="none" stroke="#fef08a" strokeWidth="2"/>
      </svg>
    ),
  },
  { 
    id: 'horns', 
    name: 'Devil Horns', 
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#ef4444">
        <path d="M4 8c0-4 3-8 8-8 0 4-3 8-8 8z"/>
        <path d="M20 8c0-4-3-8-8-8 0 4 3 8 8 8z"/>
      </svg>
    ),
  },
  { 
    id: 'peeking-cat', 
    name: 'Peeking Cat', 
    icon: () => (
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
    ),
  },
  { 
    id: 'ssj-hair', 
    name: 'SSJ Hair', 
    icon: () => (
      <svg viewBox="0 0 40 30" className="w-8 h-6">
        <path d="M8 18 L4 6 L10 12 L12 2 L16 14 L20 0 L24 14 L28 2 L30 12 L36 6 L32 18" 
              fill="#facc15" stroke="#eab308" strokeWidth="1"/>
        <path d="M10 20 L6 12 L12 16 L20 10 L28 16 L34 12 L30 20" fill="#facc15"/>
      </svg>
    ),
  },
];

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserCog },
  { id: 'accessories', label: 'Accessories', icon: BellRing },
  { id: 'notifications', label: 'Notifications', icon: BellRing },
  { id: 'status', label: 'Status', icon: Circle },
  { id: 'about', label: 'About', icon: Info },
];

export function SettingsModal({ myProfile }: { myProfile?: any }) {
  const { showSettings, setShowSettings, notificationSettings, toggleNotificationSetting, reduceMotion, updateUserProfile } = useChatStore();
  const toast = useToast();
  const { session, refetchProfiles, updateProfile } = useAuth();
  const { update: updateInfo, isChecking, isDownloading, downloadProgress, checkForUpdates, downloadAndInstall } = useUpdate();
  const [activeTab, setActiveTab] = useState('profile');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editStatus, setEditStatus] = useState<UserStatus>('online');
  const [editEffect, setEditEffect] = useState<string>('none');
  const [editOverlay, setEditOverlay] = useState<string>('none');
  const [notifPermission, setNotifPermission] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');

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

  const handleRequestPermission = async () => {
    const permission = await requestPermission();
    setNotifPermission(permission === 'granted');
  };

  const handleTestNotification = () => {
    sendNotification({
      title: '🔔 The Basement',
      body: 'Notifications are working!',
    });
  };

  if (!showSettings) return null;

  const handleSave = async () => {
    const updates = { 
      username: editUsername, 
      avatar_url: editAvatar, 
      status: editStatus, 
      avatar_effect: editEffect === 'none' ? null : editEffect,
      avatar_overlays: editOverlay === 'none' ? null : editOverlay,
    };
    
    // Update local state immediately for instant feedback
    updateUserProfile(updates);
    updateProfile(session?.user?.id, updates);
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', myProfile.id);
    
    if (!error) {
      toast.success('Settings saved successfully');
    } else {
      toast.error('Failed to save settings');
    }
  };

  const renderOverlayPreview = (overlayId: string) => {
    const overlay = OVERLAYS.find(o => o.id === overlayId);
    if (!overlay) return null;
    
    const avatarUrl = editAvatar || myProfile?.avatar_url || `https://ui-avatars.com/api/?name=${editUsername || myProfile?.username || 'U'}`;
    
    if (overlayId === 'crown') {
      return (
        <div className="relative">
          <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="#fbbf24">
              <path d="M5 16L3 6l5 4 4-7 4 7 5-4-2 10H5z"/>
              <rect x="5" y="17" width="14" height="3" rx="1"/>
            </svg>
          </div>
        </div>
      );
    }
    
    if (overlayId === 'halo') {
      return (
        <div className="relative">
          <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
            <svg viewBox="0 0 24 24" className="w-12 h-12" fill="#fef08a">
              <ellipse cx="12" cy="4" rx="8" ry="3"/>
            </svg>
          </div>
        </div>
      );
    }
    
    if (overlayId === 'horns') {
      return (
        <div className="relative">
          <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="#ef4444">
              <path d="M3 6c0-3 2.5-5 5-5 0 3-2.5 5-5 5z"/>
              <path d="M21 6c0-3-2.5-5-5-5 0 3 2.5 5 5 5z"/>
            </svg>
          </div>
        </div>
      );
    }
    
    if (overlayId === 'peeking-cat') {
      return (
        <div className="relative">
          <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
          <div className="absolute -bottom-1 -right-1 z-10">
            <svg viewBox="0 0 40 30" className="w-10 h-8">
              <ellipse cx="20" cy="22" rx="15" ry="8" fill="#f5a623"/>
              <circle cx="12" cy="20" r="4" fill="#f5a623"/>
              <circle cx="28" cy="20" r="4" fill="#f5a623"/>
              <ellipse cx="20" cy="24" rx="3" ry="2" fill="#ffb6c1"/>
              <circle cx="14" cy="18" r="1.5" fill="#333"/>
              <circle cx="26" cy="18" r="1.5" fill="#333"/>
            </svg>
          </div>
        </div>
      );
    }
    
    if (overlayId === 'ssj-hair') {
      return (
        <div className="relative">
          <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
            <svg viewBox="0 0 40 30" className="w-16 h-12">
              <path d="M5 22 L2 8 L8 14 L10 2 L14 16 L20 0 L26 16 L30 2 L32 14 L38 8 L35 22" 
                    fill="#facc15" stroke="#eab308" strokeWidth="0.5" strokeLinejoin="round"/>
              <path d="M8 24 L4 14 L10 18 L14 10 L20 14 L26 10 L30 18 L36 14 L32 24 Z" 
                    fill="#facc15" stroke="#eab308" strokeWidth="0.5"/>
            </svg>
          </div>
        </div>
      );
    }
    
    return (
      <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" alt="" />
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
    >
      <div className="relative w-full max-w-2xl h-[600px] animate-scale-in flex flex-col">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-xl" />
        
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl text-white overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 rounded-xl">
                <User size={20} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">Settings</h2>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Customize your experience</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex border-b border-white/5 shrink-0">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-3">Username</label>
                  <input 
                    className="w-full bg-zinc-900/80 p-4 rounded-xl outline-none border border-white/5 focus:border-indigo-500/50 text-sm transition-all" 
                    value={editUsername} 
                    onChange={(e) => setEditUsername(e.target.value)} 
                    placeholder="Enter username..."
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Palette size={14} className="text-zinc-500" />
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Choose Avatar</label>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_SEEDS.map(s => {
                      const url = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}`;
                      return (
                        <button
                          key={s} 
                          onClick={() => setEditAvatar(url)}
                          className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${editAvatar === url ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950 scale-105' : 'hover:scale-105 hover:ring-1 hover:ring-white/20'}`}
                        >
                          <img src={url} className="w-full h-full object-cover bg-zinc-800" alt="" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'accessories' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-3">Avatar Effects</label>
                  <div className="grid grid-cols-4 gap-3">
                    {EFFECTS.map(effect => (
                      <button
                        key={effect.id}
                        onClick={() => setEditEffect(effect.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                          editEffect === effect.id 
                            ? 'bg-indigo-600/20 border-2 border-indigo-500/50' 
                            : 'bg-zinc-900/50 border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className="w-14 h-14 flex items-center justify-center">
                          {effect.preview()}
                        </div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-tight">
                          {effect.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-3">Avatar Overlays</label>
                  <div className="grid grid-cols-4 gap-3">
                    {OVERLAYS.map(overlay => {
                      const Icon = overlay.icon;
                      return (
                        <button
                          key={overlay.id}
                          onClick={() => setEditOverlay(overlay.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                            editOverlay === overlay.id 
                              ? 'bg-indigo-600/20 border-2 border-indigo-500/50' 
                              : 'bg-zinc-900/50 border border-transparent hover:border-white/10'
                          }`}
                        >
                          <div className="w-14 h-14 flex items-center justify-center">
                            {overlay.id === 'none' ? (
                              <div className="w-14 h-14 rounded-full bg-zinc-800" />
                            ) : (
                              <Icon />
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-tight">
                            {overlay.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-3">Preview</label>
                  <div className="flex items-center justify-center p-8 bg-zinc-900/30 rounded-xl border border-white/5">
                    <div className="relative">
                      {(editAvatar || myProfile?.avatar_url) ? (
                        <div className="relative inline-block">
                          {editEffect === 'fire' && (
                            <>
                              <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-b from-orange-500 via-red-500 to-transparent blur-md opacity-75" />
                              <div className="absolute inset-0 rounded-full animate-ping bg-gradient-to-b from-yellow-400 to-red-500 opacity-30" />
                            </>
                          )}
                          {editEffect === 'basketball' && (
                            <div className="absolute -inset-3 rounded-full">
                              <div className="w-full h-full rounded-full border-4 border-orange-500 animate-spin" style={{ animationDuration: '3s' }} />
                            </div>
                          )}
                          {renderOverlayPreview(editOverlay)}
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                          No avatar
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                  <div className="p-2 rounded-lg bg-zinc-800">
                    {notifPermission ? (
                      <Bell size={18} className="text-emerald-400" />
                    ) : (
                      <Bell size={18} className="text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-zinc-200">
                      Desktop Notifications
                    </div>
                    <div className={`text-xs ${notifPermission ? 'text-emerald-400/80' : 'text-zinc-500'}`}>
                      {notifPermission ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  {!notifPermission ? (
                    <button
                      onClick={handleRequestPermission}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                    >
                      Enable
                    </button>
                  ) : (
                    <button
                      onClick={handleTestNotification}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/5"
                    >
                      Test
                    </button>
                  )}
                </div>

                {notifPermission && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggleNotificationSetting('mentions')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        notificationSettings.mentions 
                          ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400' 
                          : 'bg-zinc-900/50 border border-transparent text-zinc-500 hover:border-white/5'
                      }`}
                    >
                      <AtSign size={18} />
                      <span className="text-[10px] font-medium uppercase tracking-tight">Mentions</span>
                    </button>
                    
                    <button
                      onClick={() => toggleNotificationSetting('sound')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        notificationSettings.sound 
                          ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400' 
                          : 'bg-zinc-900/50 border border-transparent text-zinc-500 hover:border-white/5'
                      }`}
                    >
                      {notificationSettings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
                      <span className="text-[10px] font-medium uppercase tracking-tight">Sound</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'status' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-4 gap-3">
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status.value}
                      onClick={() => setEditStatus(status.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        editStatus === status.value 
                          ? 'bg-zinc-800/80 ring-2 ring-indigo-500/50' 
                          : 'bg-zinc-900/50 hover:bg-zinc-800/50 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <div className={`relative`}>
                        <div className={`w-5 h-5 rounded-full ${status.bgColor}`} />
                        {editStatus === status.value && (
                          <Circle size={10} className="absolute -bottom-0.5 -right-0.5 text-white fill-current" />
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-tighter text-center">
                        {status.label}
                      </span>
                    </button>
                  ))}
                </div>
                
                <div className="p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${editStatus === 'online' ? 'bg-emerald-500' : editStatus === 'away' ? 'bg-yellow-500' : editStatus === 'busy' ? 'bg-red-500' : 'bg-red-600'}`} />
                    <div>
                      <div className="text-sm font-semibold text-zinc-200">
                        {STATUS_OPTIONS.find(s => s.value === editStatus)?.label || 'Online'}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {editStatus === 'online' && 'You appear online to others'}
                        {editStatus === 'away' && "You're away from your device"}
                        {editStatus === 'busy' && 'You are busy'}
                        {editStatus === 'dnd' && 'Do not disturb - no interruptions'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                    <span className="text-3xl font-black text-white">B</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">The Basement</h2>
                  <p className="text-sm text-zinc-500">Version {appVersion}</p>
                </div>

                <div className="bg-zinc-800/30 rounded-xl border border-white/5 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <RefreshCw size={20} className="text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Auto Updates</h3>
                      <p className="text-[10px] text-zinc-500">Download and install the latest version</p>
                    </div>
                  </div>

                  {updateInfo ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-sm text-emerald-400 font-medium">
                          Update available: v{updateInfo.version}
                        </p>
                        {updateInfo.body && (
                          <p className="text-xs text-zinc-400 mt-1">{updateInfo.body}</p>
                        )}
                      </div>
                      
                      {isDownloading ? (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-zinc-400">Downloading...</span>
                            <span className="text-white">{downloadProgress}%</span>
                          </div>
                          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                              style={{ width: `${downloadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={downloadAndInstall}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                        >
                          <Download size={16} />
                          Download & Install
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={checkForUpdates}
                      disabled={isChecking}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
                    >
                      {isChecking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Check for Updates
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="bg-zinc-800/30 rounded-xl border border-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">About</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    The Basement is a modern chat application built with Next.js and Tauri. 
                    Connect with friends and colleagues in real-time.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-black/20 shrink-0">
            <div className="flex gap-3">
              {activeTab !== 'about' && (
                <button 
                  onClick={handleSave} 
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 p-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Save size={16} /> Save Changes
                </button>
              )}
              <button 
                onClick={() => setShowSettings(false)} 
                className={`px-6 py-4 text-zinc-400 hover:text-white font-semibold text-sm uppercase tracking-wider transition-colors ${activeTab === 'about' ? 'flex-1' : 'bg-zinc-800/50 border border-white/10 hover:border-white/20 rounded-xl'}`}
              >
                {activeTab === 'about' ? 'Close' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
