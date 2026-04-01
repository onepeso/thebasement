import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useChatStore } from "@/store/useChatStore";
import { LogOut, Hash, Settings, X, Plus, Shield, Pencil, UserPlus, Users, Globe } from "lucide-react";
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
  
  const allOnlineUsers = myProfile?.id && onlineUsers 
    ? [...new Set([myProfile.id, ...onlineUsers])] 
    : onlineUsers || [];
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
        className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-indigo-600/90 to-indigo-600/70 text-white shadow-lg shadow-indigo-500/20"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
        }`}
      >
        {hasEmoji ? (
          <span className="shrink-0 text-base">{emoji}</span>
        ) : (
          <Hash size={14} className={`shrink-0 ${isActive ? "text-indigo-200" : "text-zinc-700 group-hover:text-zinc-500"}`} />
        )}
        <span className="truncate font-medium">{chan.name}</span>
        {isOfficial && (
          <Shield size={10} className={`shrink-0 ${isActive ? "text-indigo-300" : "text-indigo-500"}`} />
        )}
        {creatorUsername && (
          <span className={`text-[9px] truncate ${isActive ? "text-indigo-200/60" : "text-zinc-600"}`}>
            by {creatorUsername}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {canInvite && (
            <button
              onClick={(e) => handleInviteClick(e, chan)}
              className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                isActive ? "text-indigo-200 hover:bg-indigo-500/30" : "text-zinc-600 hover:bg-white/10"
              }`}
              title="Invite members"
            >
              <UserPlus size={12} />
            </button>
          )}
          <button
            onClick={(e) => handleViewMembersClick(e, chan)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
              isActive ? "text-indigo-200 bg-indigo-500/20" : "text-zinc-500 bg-zinc-800/50"
            }`}
            title="View members"
          >
            <Users size={10} />
            {memberCounts?.[chan.id] ?? 0}
          </button>
          {canEdit && (
            <button
              onClick={(e) => handleEditClick(e, chan)}
              className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                isActive ? "text-indigo-200 hover:bg-indigo-500/30" : "text-zinc-600 hover:bg-white/10"
              }`}
              title="Edit channel"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-64 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border-r border-white/5 flex flex-col h-full ${isMobile ? 'absolute inset-0' : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Mobile Header */}
      {isMobile && (
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
          <span className="text-sm font-bold text-zinc-200">Menu</span>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white"
          >
            <X size={18} />
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
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {/* Official Channels */}
        {userChannels.length > 0 && (
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <Shield size={10} /> Official
              </span>
            </div>
            {userChannels.map((chan: any) => renderChannelItem(chan, true))}
          </div>
        )}
        
        {/* User's Channels */}
        {myChannels.length > 0 && (
          <div className="p-2 border-t border-white/5">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                My Channels
              </span>
              <span className="text-[9px] text-zinc-600">{myChannels.length}/3</span>
            </div>
            {myChannels.map((chan: any) => renderChannelItem(chan, false, false, true))}
          </div>
        )}

        {/* Joined Channels */}
        {joinedChannels.length > 0 && (
          <div className="p-2 border-t border-white/5">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Joined
              </span>
              <span className="text-[9px] text-zinc-600">{joinedChannels.length}</span>
            </div>
            {joinedChannels.map((chan: any) => renderChannelItem(chan, false, false, false))}
          </div>
        )}
        
        {/* Create Channel Button */}
        {myChannels.length < 3 && (
          <div className="p-2 border-t border-white/5">
            <button
              onClick={() => { onCreateChannel?.(); onClose?.(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <Plus size={14} className="shrink-0" />
              <span className="font-medium">Create Channel</span>
            </button>
          </div>
        )}

        {/* Discover Button */}
        <div className="p-2 border-t border-white/5">
          <button
            onClick={() => { onDiscover?.(); onClose?.(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <Globe size={14} className="shrink-0" />
            <span className="font-medium">Discover Channels</span>
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
    </div>
  );
}
