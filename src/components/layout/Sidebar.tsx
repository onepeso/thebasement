import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useChatStore } from "@/store/useChatStore";
import { LogOut, Hash, ChevronDown, MessageCircle, UserPlus, X, Search, MessageSquare, Settings, Trash2 } from "lucide-react";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";
import { cleanupPresence } from "@/hooks/usePresence";
import type { UserStatus, DirectMessage, Thread } from "@/types/database";
import type { Profile } from "@/types/database";

interface SidebarProps {
  myProfile?: any;
  conversations?: DirectMessage[];
  allProfiles?: Profile[];
  onlineUsers?: string[];
  onSelectDM?: (dm: DirectMessage) => void;
  onStartDM?: (userId: string) => void;
  onSelectThread?: (thread: Thread) => void;
  onDeleteThread?: (threadId: string) => void;
  onDeleteDM?: (dmId: string) => void;
  onOpenProfile?: () => void;
  activeDM?: DirectMessage | null;
  activeChannel?: any;
  onBackToChannels?: () => void;
  userThreads?: Thread[];
  activeThreadId?: string | null;
  showMobileSidebar?: boolean;
  onCloseMobileSidebar?: () => void;
}

const STATUS_CONFIG: Record<UserStatus, { dot: string; label: string; text: string }> = {
  online: { dot: 'bg-emerald-500 shadow-emerald-500/50', label: 'Online', text: 'text-emerald-500/80' },
  away: { dot: 'bg-yellow-500 shadow-yellow-500/50', label: 'Away', text: 'text-yellow-500/80' },
  busy: { dot: 'bg-red-500 shadow-red-500/50', label: 'Busy', text: 'text-red-500/80' },
  dnd: { dot: 'bg-red-600 shadow-red-600/50', label: 'DND', text: 'text-red-600/80' },
  offline: { dot: 'bg-zinc-600', label: 'Offline', text: 'text-zinc-600' },
};

interface SidebarProps {
  myProfile?: any;
  conversations?: DirectMessage[];
  allProfiles?: Profile[];
  onlineUsers?: string[];
  onSelectDM?: (dm: DirectMessage) => void;
  onStartDM?: (userId: string) => void;
  onSelectThread?: (thread: Thread) => void;
  onDeleteThread?: (threadId: string) => void;
  activeDM?: DirectMessage | null;
  activeChannel?: any;
  onBackToChannels?: () => void;
  userThreads?: Thread[];
  activeThreadId?: string | null;
  showMobileSidebar?: boolean;
  onCloseMobileSidebar?: () => void;
}

export function Sidebar({ myProfile, conversations = [], allProfiles = [], onlineUsers = [], onSelectDM, onStartDM, onSelectThread, onDeleteThread, onDeleteDM, onOpenProfile, activeDM, activeChannel, onBackToChannels, userThreads = [], activeThreadId, showMobileSidebar, onCloseMobileSidebar }: SidebarProps) {
  const { channels, layoutMode, setActiveChannel, setLayoutMode } = useChatStore();
  const [showDMs, setShowDMs] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [showNewDMSearch, setShowNewDMSearch] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [renderKey, setRenderKey] = useState(0);
  const [hoveredThread, setHoveredThread] = useState<string | null>(null);
  
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [allProfiles, onlineUsers, conversations]);
  
  const userStatus = (myProfile?.status || 'online') as UserStatus;
  const statusConfig = STATUS_CONFIG[userStatus];

  const otherProfiles = allProfiles.filter(p => p.id !== myProfile?.id);
  const filteredProfiles = otherProfiles.filter(p => 
    p.username.toLowerCase().includes(dmSearch.toLowerCase())
  );

  const handleStartDM = (userId: string) => {
    onStartDM?.(userId);
    setShowDMs(false);
    setDmSearch('');
    onCloseMobileSidebar?.();
  };

  const getDMUsername = (dm: DirectMessage) => {
    return dm.other_user?.username || 'Unknown';
  };

  const getDMAvatar = (dm: DirectMessage) => {
    return dm.other_user?.avatar_url;
  };

  const getDMStatus = (dm: DirectMessage): UserStatus => {
    const otherUser = dm.other_user;
    if (!otherUser) return 'offline';
    
    const isOnline = onlineUsers.length > 0 && onlineUsers.includes(otherUser.id);
    
    if (!isOnline) return 'offline';
    
    const latestProfile = allProfiles.find(p => p.id === otherUser.id);
    const status = (latestProfile?.status || otherUser.status || 'online') as UserStatus;
    
    if (status === 'offline') return 'online';
    return status;
  };

  const getUserStatus = (profile: any): UserStatus => {
    if (!profile) return 'offline';
    
    const isOnline = onlineUsers.length > 0 && onlineUsers.includes(profile.id);
    
    if (!isOnline) return 'offline';
    
    const status = (profile.status || 'online') as UserStatus;
    
    if (status === 'offline') return 'online';
    return status;
  };

  return (
    <aside className={`
      fixed lg:relative inset-y-0 left-0 z-50
      w-64 lg:w-60
      bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border-r border-white/5 
      flex flex-col shrink-0 
      transform transition-transform duration-300 ease-in-out
      ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Mobile header with close button */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-white/5">
        <span className="text-sm font-bold text-zinc-200">Menu</span>
        <button 
          onClick={onCloseMobileSidebar}
          className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="relative hidden lg:block">
        <div className="h-14 flex items-center px-4 border-b border-white/5">
          <button className="flex items-center gap-2 text-sm font-black text-zinc-200 tracking-wide hover:text-white transition-colors">
            <span className="text-zinc-500 text-xs font-mono">#</span>
            <span>Chat</span>
            <ChevronDown size={14} className="text-zinc-600" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/5">
        <button
          onClick={() => { setShowDMs(false); setShowThreads(false); onBackToChannels?.(); }}
          className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
            !showDMs && !showThreads
              ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Channels
        </button>
        <button
          onClick={() => { setShowDMs(true); setShowThreads(false); }}
          className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            showDMs && !showThreads
              ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <MessageCircle size={12} />
          DMs
        </button>
        <button
          onClick={() => { setShowDMs(false); setShowThreads(true); }}
          className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            showThreads
              ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <MessageSquare size={12} />
          Threads
        </button>
      </div>

      {showThreads ? (
        <nav className="flex-1 p-2 overflow-y-auto custom-scrollbar relative">
          {userThreads.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-xs">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
              <p>No active threads</p>
              <p className="text-[10px] mt-1">Start a thread by hovering a message</p>
            </div>
          ) : (
            userThreads.map((thread) => {
              const rootMsg = thread.root_message as any;
              const rootText = rootMsg?.text || 'Thread';
              const rootUsername = rootMsg?.profiles?.username || 'Unknown';
              const isActive = activeThreadId === thread.id;
              const isOwner = thread.created_by === myProfile?.id;
              const isHovered = hoveredThread === thread.id;
              
              return (
                <div
                  key={thread.id}
                  onClick={() => { onSelectThread?.(thread); onCloseMobileSidebar?.(); }}
                  onMouseEnter={() => setHoveredThread(thread.id)}
                  onMouseLeave={() => setHoveredThread(null)}
                  className={`group flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all mb-1 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600/90 to-indigo-600/70 text-white shadow-lg shadow-indigo-500/20"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <MessageSquare size={14} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[11px] font-semibold truncate ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                        {rootUsername}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] ${isActive ? 'text-indigo-200' : 'text-zinc-600'}`}>
                          {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
                        </span>
                        {isOwner && isHovered && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteThread?.(thread.id);
                            }}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete thread"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600 truncate leading-tight">
                      "{rootText?.slice(0, 40)}{rootText?.length > 40 ? '...' : ''}"
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </nav>
      ) : showDMs ? (
        <nav className="flex-1 p-2 overflow-y-auto custom-scrollbar relative">
          <button
            onClick={() => setShowNewDMSearch(!showNewDMSearch)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all mb-2 border ${
              showNewDMSearch 
                ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' 
                : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300 border-dashed border-white/10 hover:border-indigo-500/30'
            }`}
          >
            {showNewDMSearch ? <X size={14} /> : <UserPlus size={14} />}
            <span className="font-medium">{showNewDMSearch ? 'Close' : 'New Message'}</span>
          </button>

          {showNewDMSearch && (
            <div className="mb-2 p-2 bg-zinc-900/50 rounded-lg border border-white/10 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Search size={12} className="text-zinc-500" />
                <input
                  type="text"
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  placeholder="Search users..."
                  className="flex-1 bg-transparent text-xs outline-none text-zinc-200 placeholder:text-zinc-600"
                  autoFocus
                />
                <button onClick={() => { setShowNewDMSearch(false); setDmSearch(''); }} className="text-zinc-500 hover:text-zinc-300">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto custom-scrollbar">
                {filteredProfiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => handleStartDM(profile.id)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-indigo-500/20 text-zinc-300 hover:text-white transition-all"
                  >
                    <AvatarWithEffect
                      profile={profile}
                      size="sm"
                    />
                    <span className="text-xs font-medium truncate">{profile.username}</span>
                  </button>
                ))}
                {filteredProfiles.length === 0 && (
                  <p className="text-[10px] text-zinc-600 text-center py-2">No users found</p>
                )}
              </div>
            </div>
          )}

          {conversations.map(dm => {
            const dmStatus = getDMStatus(dm);
            const isActive = activeDM?.id === dm.id;
            return (
              <div
                key={`${dm.id}-${renderKey}`}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600/30 text-indigo-300"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                <div 
                  className="flex-1 min-w-0 flex items-center gap-2"
                  onClick={() => { onSelectDM?.(dm); onCloseMobileSidebar?.(); }}
                >
                  <AvatarWithEffect
                    profile={dm.other_user}
                    size="sm"
                    isOnline={dmStatus === 'online'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{getDMUsername(dm)}</span>
                    </div>
                    {dm.last_message && (
                      <p className="text-[10px] text-zinc-600 truncate">
                        {dm.last_message.sender_id === myProfile?.id ? 'You: ' : ''}
                        {dm.last_message.text}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete conversation with ${getDMUsername(dm)}?`)) {
                      onDeleteDM?.(dm.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                  title="Delete conversation"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {conversations.length === 0 && (
            <div className="text-center py-8 text-zinc-600 text-xs">
              <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-[10px] mt-1">Click above to start one</p>
            </div>
          )}
        </nav>
      ) : (
        <nav className="flex-1 p-2 overflow-y-auto custom-scrollbar relative">
          {channels.map((chan: any) => (
            <div
              key={chan.id}
              onClick={() => { setActiveChannel(chan); onBackToChannels?.(); onCloseMobileSidebar?.(); }}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200 ${
                activeChannel?.id === chan.id
                  ? "bg-gradient-to-r from-indigo-600/90 to-indigo-600/70 text-white shadow-lg shadow-indigo-500/20"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
            >
              <Hash size={14} className={`shrink-0 ${activeChannel?.id === chan.id ? "text-indigo-200" : "text-zinc-700 group-hover:text-zinc-500"}`} />
              <span className="truncate font-medium">{chan.name}</span>
            </div>
          ))}
        </nav>
      )}

      <div className="p-3 border-t border-white/5 relative">
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 px-2">
          Layout
        </div>
        <div className="flex p-1 bg-black/30 rounded-xl border border-white/5">
          <button
            onClick={() => setLayoutMode("standard")}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              layoutMode === "standard"
                ? "bg-gradient-to-r from-zinc-700 to-zinc-800 text-white shadow-inner"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setLayoutMode("iphone")}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              layoutMode === "iphone"
                ? "bg-gradient-to-r from-zinc-700 to-zinc-800 text-white shadow-inner"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            iPhone
          </button>
        </div>
      </div>

      <div className="p-3 bg-black/40 flex items-center border-t border-white/5 relative">
        <button 
          onClick={onOpenProfile}
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
        >
          <AvatarWithEffect profile={myProfile} size="md" showStatus={true} />
          <div className="min-w-0 text-left">
            <div className="text-sm font-bold truncate text-zinc-200">
              {myProfile?.username}
            </div>
            <div className={`text-[9px] font-medium uppercase tracking-wider ${statusConfig.text}`}>
              {statusConfig.label}
            </div>
          </div>
        </button>

        <div className="flex items-center ml-auto">
          <button
            onClick={() => useChatStore.getState().setShowSettings(true)}
            className="p-2 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 rounded-lg transition-all duration-200"
            title="Settings"
          >
            <Settings size={15} />
          </button>
          <button
            onClick={async () => {
              await cleanupPresence();
              await supabase.auth.signOut();
            }}
            className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
