import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useChatStore } from "@/store/useChatStore";
import { LogOut, Hash, Settings, X, Plus, Shield, Pencil, UserPlus, Users, Globe, MoreHorizontal } from "lucide-react";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";
import { cleanupPresence } from "@/hooks/usePresence";
import type { UserStatus } from "@/types/database";

interface LeftSidebarProps {
  myProfile?: any;
  allProfiles?: any[];
  onlineUsers?: string[];
  onOpenProfile?: () => void;
  activeChannel?: any;
  isMobile?: boolean;
  onClose?: () => void;
  onCreateChannel?: () => void;
  onEditChannel?: (channel: any) => void;
  onInvite?: (channel: any) => void;
  onViewMembers?: (channel: any) => void;
  onDiscover?: () => void;
  memberCounts?: Record<string, number>;
}

const STATUS_CONFIG: Record<UserStatus, { dot: string; label: string; text: string }> = {
  online: { dot: 'bg-emerald-500 shadow-emerald-500/50', label: 'Online', text: 'text-emerald-500/80' },
  away: { dot: 'bg-yellow-500 shadow-yellow-500/50', label: 'Away', text: 'text-yellow-500/80' },
  busy: { dot: 'bg-red-500 shadow-red-500/50', label: 'Busy', text: 'text-red-500/80' },
  dnd: { dot: 'bg-red-600 shadow-red-600/50', label: 'DND', text: 'text-red-600/80' },
  offline: { dot: 'bg-zinc-600', label: 'Offline', text: 'text-zinc-600' },
};

export function LeftSidebar({ myProfile, allProfiles, onlineUsers, onOpenProfile, activeChannel, isMobile, onClose, onCreateChannel, onEditChannel, onInvite, onViewMembers, onDiscover, memberCounts }: LeftSidebarProps) {
  const { channels, setActiveChannel } = useChatStore();
  const blockedIds = useChatStore((state) => state.blockedIds);
  const [mobileChannelMenu, setMobileChannelMenu] = useState<any>(null);
  
  const filteredOnlineUsers = onlineUsers?.filter(id => !blockedIds.includes(id)) || [];
  const allOnlineUsers = myProfile?.id && filteredOnlineUsers 
    ? [...new Set([myProfile.id, ...filteredOnlineUsers])] 
    : filteredOnlineUsers;
  const isOnline = myProfile?.id ? allOnlineUsers.includes(myProfile.id) : false;
  const userStatus = (myProfile?.status || 'online') as UserStatus;
  const statusConfig = STATUS_CONFIG[userStatus];
  const isAdmin = myProfile?.is_admin || false;
  
  const getCreatorUsername = (creatorId: string) => {
    if (!creatorId || !allProfiles) return null;
    const creator = allProfiles.find((p: any) => p.id === creatorId);
    return creator?.username || null;
  };

  const userChannels = channels.filter((c: any) => c.is_official);
  const myChannels = channels.filter((c: any) => c.created_by === myProfile?.id);
  const joinedChannels = channels.filter((c: any) => {
    if (c.is_official) return false;
    if (c.created_by === myProfile?.id) return false;
    return true;
  });
  
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  const canEditChannel = (channel: any) => {
    return channel.created_by === myProfile?.id || (isAdmin && channel.is_official);
  };

  const handleChannelClick = (chan: any) => {
    setActiveChannel(chan);
    onClose?.();
  };

  const handleEditClick = (e: any, chan: any) => {
    e.stopPropagation();
    onEditChannel?.(chan);
  };

  const handleInviteClick = (e: any, chan: any) => {
    e.stopPropagation();
    onInvite?.(chan);
  };

  const handleViewMembersClick = (e: any, chan: any) => {
    e.stopPropagation();
    onViewMembers?.(chan);
  };

  const renderChannelItem = (chan: any, isOfficial: boolean, showCreator: boolean = false, canInvite: boolean = false) => {
    const canEdit = canEditChannel(chan);
    const isActive = activeChannel?.id === chan.id;
    const creatorUsername = showCreator ? getCreatorUsername(chan.created_by) : null;
    const emoji = chan.emoji || '💬';
    const hasEmoji = emoji !== '💬';

    return (
      <div
        key={chan.id}
        onClick={() => handleChannelClick(chan)}
        className={`group flex items-center gap-2 px-3 sm:px-2 py-3 sm:py-1.5 rounded-lg sm:rounded-md text-sm sm:text-[13px] cursor-pointer transition-all active:scale-[0.98] ${
          isActive
            ? "bg-indigo-500/20 text-indigo-300 font-medium"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 active:bg-white/10"
        }`}
      >
        {hasEmoji ? (
          <span className="shrink-0 text-base sm:text-sm">{emoji}</span>
        ) : (
          <Hash size={14} className={`shrink-0 ${isActive ? "text-indigo-400" : "text-zinc-700"}`} />
        )}
        <span className="truncate">{chan.name}</span>
        {isOfficial && (
          <Shield size={10} className={`shrink-0 ${isActive ? "text-indigo-400" : "text-indigo-500/60"}`} />
        )}
        
        {/* Desktop: Show action icons on hover */}
        <div className="hidden sm:flex ml-auto items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {canInvite && (
            <button
              onClick={(e) => handleInviteClick(e, chan)}
              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-95"
              title="Invite"
            >
              <UserPlus size={12} />
            </button>
          )}
          <button
            onClick={(e) => handleViewMembersClick(e, chan)}
            className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] text-zinc-600 hover:text-zinc-400 hover:bg-white/10 transition-all cursor-pointer active:scale-95"
            title="Members"
          >
            <Users size={10} />
            <span>{memberCounts?.[chan.id] ?? 0}</span>
          </button>
          {canEdit && (
            <button
              onClick={(e) => handleEditClick(e, chan)}
              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-95"
              title="Edit"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
        
        {/* Mobile: Show "More" button */}
        {isMobile && (canEdit || canInvite) && (
          <button
            onClick={(e) => { e.stopPropagation(); setMobileChannelMenu(chan); }}
            className="ml-auto p-2 -mr-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <MoreHorizontal size={18} />
          </button>
        )}
        
        {!isActive && (unreadCounts[chan.id] || 0) > 0 && (
          <span className="ml-auto px-2 py-0.5 sm:px-1.5 sm:py-0.5 text-[10px] sm:text-[9px] font-bold bg-indigo-500 text-white rounded-full min-w-[20px] sm:min-w-[16px] text-center">
            {unreadCounts[chan.id] > 99 ? '99+' : unreadCounts[chan.id]}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full sm:w-64 bg-zinc-900 border-r border-white/5 flex flex-col h-full ${isMobile ? 'absolute inset-0 z-50' : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Mobile Header */}
      {isMobile && (
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/5 shrink-0 bg-zinc-900/95">
          <span className="text-lg font-bold text-zinc-200">Menu</span>
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white active:scale-95 transition-all"
          >
            <X size={24} />
          </button>
        </div>
      )}
      
      {/* Desktop Header */}
      <div className="h-14 flex items-center px-4 border-b border-white/5 shrink-0">
        <span className="text-sm font-black text-zinc-200 tracking-wide">
          The Basement
        </span>
      </div>

      {/* Channels - Middle Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-safe">
        {/* Official Channels */}
        {userChannels.length > 0 && (
          <div className="px-4 sm:px-3 pt-6 sm:pt-4">
            <span className="text-[10px] sm:text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Shield size={10} /> Official
            </span>
            <div className="mt-2 sm:mt-1 space-y-1 sm:space-y-0.5">
              {userChannels.map((chan: any) => renderChannelItem(chan, true))}
            </div>
          </div>
        )}
        
        {/* User's Channels */}
        {myChannels.length > 0 && (
          <div className="px-4 sm:px-3 pt-6 sm:pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                My Channels
              </span>
              <span className="text-[10px] sm:text-[9px] text-zinc-600">{myChannels.length}/3</span>
            </div>
            <div className="mt-1 space-y-0.5">
              {myChannels.map((chan: any) => renderChannelItem(chan, false, false, true))}
            </div>
          </div>
        )}

        {/* Joined Channels */}
        {joinedChannels.length > 0 && (
          <div className="px-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Joined
              </span>
              <span className="text-[9px] text-zinc-600">{joinedChannels.length}</span>
            </div>
            <div className="mt-1 space-y-0.5">
              {joinedChannels.map((chan: any) => renderChannelItem(chan, false, false, false))}
            </div>
          </div>
        )}
        
        {/* Create Channel Button */}
        {myChannels.length < 3 && (
          <div className="px-3 pt-4">
            <button
              onClick={() => { onCreateChannel?.(); onClose?.(); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <Plus size={12} className="shrink-0" />
              <span>Create Channel</span>
            </button>
          </div>
        )}

        {/* Discover Button */}
        <div className="px-3 pt-2 pb-4">
          <button
            onClick={() => { onDiscover?.(); onClose?.(); }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <Globe size={12} className="shrink-0" />
            <span>Discover</span>
          </button>
        </div>
      </div>

      {/* Bottom Section - Profile */}
      <div className="border-t border-white/5 shrink-0">
        {/* Profile Banner */}
        <div className="p-3 bg-black/40 flex items-center">
          <button 
            onClick={onOpenProfile}
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity flex-1"
          >
            <AvatarWithEffect profile={myProfile} size="md" showStatus={true} isOnline={isOnline} />
            <div className="min-w-0 text-left">
              <div className="text-sm font-bold truncate text-zinc-200">
                {myProfile?.username}
              </div>
              <div className={`text-[9px] font-medium uppercase tracking-wider ${statusConfig.text}`}>
                {statusConfig.label}
              </div>
            </div>
          </button>

          <div className="flex items-center ml-2">
            <button
              onClick={() => useChatStore.getState().setShowSettings(true)}
              className="p-2 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 rounded-lg transition-all duration-200 cursor-pointer"
              title="Settings"
            >
              <Settings size={15} />
            </button>
            <button
              onClick={() => {
                cleanupPresence();
                supabase.auth.signOut();
              }}
              className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Channel Actions Menu */}
      {mobileChannelMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-end sm:hidden"
          onClick={() => setMobileChannelMenu(null)}
        >
          <div 
            className="w-full bg-zinc-900/95 border-t border-white/10 rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                {mobileChannelMenu.emoji && mobileChannelMenu.emoji !== '💬' ? (
                  <span className="text-xl">{mobileChannelMenu.emoji}</span>
                ) : (
                  <Hash size={20} className="text-indigo-400" />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{mobileChannelMenu.name}</h3>
                <p className="text-xs text-zinc-500">{memberCounts?.[mobileChannelMenu.id] ?? 0} members</p>
              </div>
            </div>
            <div className="space-y-2">
              {canEditChannel(mobileChannelMenu) && (
                <button
                  onClick={() => { onEditChannel?.(mobileChannelMenu); setMobileChannelMenu(null); }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-sm text-white bg-zinc-800/50 rounded-xl active:bg-zinc-800"
                >
                  <Pencil size={18} className="text-zinc-400" />
                  Edit Channel
                </button>
              )}
              {mobileChannelMenu.created_by === myProfile?.id && (
                <button
                  onClick={() => { onInvite?.(mobileChannelMenu); setMobileChannelMenu(null); }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-sm text-white bg-zinc-800/50 rounded-xl active:bg-zinc-800"
                >
                  <UserPlus size={18} className="text-zinc-400" />
                  Invite Members
                </button>
              )}
              <button
                onClick={() => { onViewMembers?.(mobileChannelMenu); setMobileChannelMenu(null); }}
                className="w-full flex items-center gap-3 px-4 py-4 text-sm text-white bg-zinc-800/50 rounded-xl active:bg-zinc-800"
              >
                <Users size={18} className="text-zinc-400" />
                View Members
              </button>
              <button
                onClick={() => setMobileChannelMenu(null)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-zinc-500 mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
