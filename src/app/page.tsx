"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { usePresence } from "@/hooks/usePresence";
import { useReactions } from "@/hooks/useReactions";
import { usePinnedMessages } from "@/hooks/usePinnedMessages";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { usePeriodicRefresh } from "@/hooks/usePeriodicRefresh";
import { useRealtimeChannels } from "@/hooks/useRealtimeChannels";
import { useTyping } from "@/hooks/useTyping";
import { useUpdate } from "@/hooks/useUpdate";
import { useChallenges } from "@/hooks/useChallenges";
import { useInvites } from "@/hooks/useInvites";
import { useChannelMembers } from "@/hooks/useChannelMembers";
import { useBadges } from "@/hooks/useBadges";
import { useChatStore } from "@/store/useChatStore";
import { ToastContainer, useToast } from "@/store/useToastStore";
import { TitleBar } from "@/components/layout/TitleBar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { MessageItem } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SettingsModal } from "@/components/ui/SettingsModal";
import { ProfileModal } from "@/components/ui/ProfileModal";
import { ViewProfileModal } from "@/components/ui/ViewProfileModal";
import { UpdateNotification } from "@/components/ui/UpdateNotification";
import { UpdateModal } from "@/components/ui/UpdateModal";
import { CreateChannelModal } from "@/components/ui/CreateChannelModal";
import { EditChannelModal } from "@/components/ui/EditChannelModal";
import { InviteModal } from "@/components/ui/InviteModal";
import { ChannelMembersModal } from "@/components/ui/ChannelMembersModal";
import { NotificationModal } from "@/components/ui/NotificationModal";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { CommandPalette, useKeyboardShortcuts } from "@/components/ui/CommandPalette";
import { KeyboardShortcutsModal } from "@/components/ui/KeyboardShortcutsModal";
import { ChallengesModal } from "@/components/ui/ChallengesModal";
import { ChallengeCompletedToast } from "@/components/ui/ChallengeCompletedToast";
import { BadgeUnlockedToast } from "@/components/ui/BadgeUnlockedToast";
import { SearchModal } from "@/components/ui/SearchModal";
import { ChannelDiscoveryModal } from "@/components/ui/ChannelDiscoveryModal";

import AuthScreen from "@/components/ui/AuthScreen";
import { ChevronDown, ArrowDown, Hash, Search, X, Menu, Command, Trophy, UserPlus, Bell, RefreshCw, Settings, Pin } from "lucide-react";

export default function Home() {
  const { session, allProfiles, myProfile, loading: authLoading } = useAuth();
  const { channels, activeChannel, lastReadTimestamps, searchQuery, isSearching, setChannels, setActiveChannel, markChannelRead, setSearchQuery, setIsSearching, setReplyTo, showUpdatePopup, dismissedUpdateVersion, setShowSettings, showKeyboardShortcuts, setShowKeyboardShortcuts } = useChatStore();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [reactingToMsg, setReactingToMsg] = useState<{id: string, username: string} | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Deduplicating wrapper for notifications
  const setNotificationsDeduped = useCallback((newNotifications: any[] | ((prev: any[]) => any[])) => {
    setNotifications((prev) => {
      const incoming = typeof newNotifications === 'function' ? newNotifications(prev) : newNotifications;
      const existingIds = new Set(prev.map(n => n.id));
      const unique = incoming.filter((n: any) => !existingIds.has(n.id));
      if (unique.length === 0) return prev;
      return [...unique, ...prev].slice(0, 50);
    });
  }, []);
  
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [invitingChannel, setInvitingChannel] = useState<any>(null);
  const [viewingMembersChannel, setViewingMembersChannel] = useState<any>(null);
  const { confirm: showConfirm, ConfirmComponent: ConfirmModalComponent, config: confirmConfig, close: closeConfirm } = useConfirm();
  const toast = useToast();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMsgId = useRef<string | null>(null);
  const lastProcessedRef = useRef<{ channelId: string; messageId: string } | null>(null);
  const hasRestoredChannel = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<{ focus: () => void } | null>(null);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const hasLoadedNotifications = useRef(false);
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef(0);

  const onlineUsers = usePresence(session?.user?.id);
  const { messages, hasMore, loading, loadingMore, loadMore, deleteMessage, addOptimisticMessage } = useChat(activeChannel?.id, session?.user?.id);
  const unreadCount = messages.filter(
    (m) => m.user_id !== session?.user?.id &&
    new Date(m.created_at) > new Date(lastReadTimestamps[activeChannel?.id || ''] || '1970-01-01')
  ).length;
  const { typingUsers, startTyping, stopTyping } = useTyping(session?.user?.id, myProfile?.username);
  const { update: updateInfo, checkForUpdates } = useUpdate();
  
  const { 
    challenges, 
    totalXP, 
    trackLogin, 
    trackMessage, 
    trackReaction, 
    trackPin, 
    trackReply, 
    trackMention,
    trackChannelCreated,
    newCompletedChallenge,
    clearNewCompleted,
    loading: challengesLoading 
  } = useChallenges(session?.user?.id);
  
  const { 
    sentInvites,
    sendInvite, 
    acceptInvite, 
    declineInvite,
    checkUserInvited,
  } = useInvites(session?.user?.id);
  
  const { 
    members: channelMembers,
    loading: membersLoading,
    error: membersError,
    removeMember,
    isOwner: checkIsOwner,
    refreshMembers 
  } = useChannelMembers(viewingMembersChannel?.id || activeChannel?.id);
  
  const {
    badges,
    newBadge,
    checkAndUnlockBadge,
  } = useBadges(session?.user?.id);
  
  const completedCount = challenges.filter((c: any) => c.completed).length;
  
  const handleMessageSent = useCallback(async () => {
    trackMessage();
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session?.user?.id);
    checkAndUnlockBadge('messages', count || 1);
  }, [trackMessage, checkAndUnlockBadge, session?.user?.id]);
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const closeAllModals = useCallback(() => {
    setShowProfile(false);
    setShowCreateChannel(false);
    setShowCommandPalette(false);
    setShowKeyboardShortcuts(false);
    setEditingChannel(null);
    setInvitingChannel(null);
    setViewingMembersChannel(null);
  }, [setShowKeyboardShortcuts]);

  useKeyboardShortcuts({
    onOpenCommandPalette: () => setShowCommandPalette(true),
    onCloseModals: closeAllModals,
    onFocusSearch: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },
    onSendMessage: () => {
      messageInputRef.current?.focus();
    },
    onOpenShortcuts: () => setShowKeyboardShortcuts(true),
  });
  
  useEffect(() => {
    if (session && updateInfo && updateInfo.version !== dismissedUpdateVersion) {
      useChatStore.getState().setShowUpdatePopup(true);
    }
  }, [session, updateInfo, dismissedUpdateVersion]);
  
  useEffect(() => {
    if (session) {
      checkForUpdates();
      trackLogin();
    }
  }, [session, checkForUpdates, trackLogin]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      useChatStore.getState().setIsTabVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const { reactions, toggleReaction } = useReactions(activeChannel?.id);
  const { pinMessage, unpinMessage, isPinned } = usePinnedMessages(activeChannel?.id);
  const { checkForMention, checkForNewMessage } = useNotifications(session?.user?.id, myProfile?.username);
  useRealtimeNotifications(session?.user?.id);

  const { refresh: performRefresh } = usePeriodicRefresh({
    userId: session?.user?.id,
    channels,
    activeChannel,
    onRefreshChannels: setChannels,
    onRefreshActiveChannel: setActiveChannel,
    onRefreshMemberCounts: setMemberCounts,
    onRefreshNotifications: setNotificationsDeduped,
  });

  useRealtimeChannels({
    userId: session?.user?.id,
    onChannelsChange: setChannels,
    onMemberCountsChange: setMemberCounts,
  });

  useEffect(() => {
    if (!session?.user?.id) return;

    let isMounted = true;
    let hasAddedRealtime = false;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('user_notifications')
        .select(`
          *,
          inviter:profiles!inviter_id(id, username, avatar_url, avatar_effect),
          channel:channels(id, name, description, color, emoji)
        `)
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data && isMounted) {
        seenNotificationIds.current = new Set(data.map((n: any) => n.id));
        setNotifications(data);
        hasLoadedNotifications.current = true;
        hasAddedRealtime = false;
      }
    };

    fetchNotifications();

    const notifSub = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${session?.user?.id}`,
      }, async (payload: any) => {
        if (!isMounted) return;
        
        const n = payload.new;
        
        const { data: fullNotif } = await supabase
          .from('user_notifications')
          .select(`
            *,
            inviter:profiles!inviter_id(id, username, avatar_url, avatar_effect),
            channel:channels(id, name, description, color, emoji)
          `)
          .eq('id', n.id)
          .single();
        
        if (fullNotif && isMounted) {
          if (seenNotificationIds.current.has(n.id)) return;
          seenNotificationIds.current.add(n.id);
          
          setNotifications((prev: any[]) => {
            if (prev.some(existing => existing.id === n.id)) return prev;
            hasAddedRealtime = true;
            return [fullNotif, ...prev];
          });
          
          if (n.type === 'invite') {
            toast.info('New channel invitation! Tap the bell icon to view.');
          }
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(notifSub);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!messages.length || !activeChannel?.name) return;
    
    const latestMsg = messages[messages.length - 1];
    const isNewChannel = lastProcessedRef.current?.channelId !== activeChannel.id;
    
    if (latestMsg && (isNewChannel || latestMsg.id !== lastProcessedRef.current?.messageId)) {
      if (!isNewChannel && lastProcessedRef.current !== null) {
        checkForMention(latestMsg, activeChannel.name);
      }
      lastProcessedRef.current = { channelId: activeChannel.id, messageId: latestMsg.id };
    }
  }, [messages, activeChannel?.name, activeChannel?.id, checkForMention, checkForNewMessage]);

  useEffect(() => {
    const fetchChannels = async () => {
      // Fetch public channels and channels user is a member of
      const { data: memberData } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', session?.user?.id);

      const channelIds = memberData?.map((m: any) => m.channel_id) || [];

      const { data } = await supabase
        .from("channels")
        .select("*")
        .order("name");

      if (data) {
        // Filter to show: public channels OR channels user is member of OR channels user created
        const filteredChannels = data.filter((c: any) => {
          return !c.is_private || c.created_by === session?.user?.id || channelIds.includes(c.id);
        });
        setChannels(filteredChannels);
        if (!hasRestoredChannel.current) {
          hasRestoredChannel.current = true;
          const persistedChannel = useChatStore.getState().activeChannel;
          if (persistedChannel?.id && filteredChannels.find((c: any) => c.id === persistedChannel.id)) {
            return;
          }
          setActiveChannel(filteredChannels.find((c: any) => c.slug === "general") || filteredChannels[0]);
        }
      }
    };
    fetchChannels();
  }, [setChannels, setActiveChannel, session?.user?.id]);

  useEffect(() => {
    const fetchMemberCounts = async () => {
      const channelIds = channels.map((c: any) => c.id);
      if (channelIds.length === 0) return;

      const { data } = await supabase
        .from('channel_members')
        .select('channel_id')
        .in('channel_id', channelIds);

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((m: any) => {
          counts[m.channel_id] = (counts[m.channel_id] || 0) + 1;
        });
        setMemberCounts(counts);
      }
    };

    fetchMemberCounts();
  }, [channels.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceToBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    setShowScrollButton(distanceToBottom > 400);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartY.current;
      if (diff > 0) {
        setPullDistance(Math.min(diff, 80));
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 50) {
      setIsPulling(true);
      await performRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const jumpToNew = () => {
    const divider = document.getElementById("new-messages-start");
    if (divider) {
      divider.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      scrollToBottom("smooth");
    }
    if (activeChannel?.id) markChannelRead(activeChannel.id);
  };

  useEffect(() => {
    if (activeChannel) {
      setTimeout(() => scrollToBottom("auto"), 150);
    }
  }, [activeChannel?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const isMe = lastMsg.user_id === session?.user?.id;

      if (isMe) {
        scrollToBottom("auto");
      }
    }
  }, [messages, session?.user?.id]);

  const handleDelete = (id: string) => {
    showConfirm({
      title: "Delete Message",
      message: "Are you sure you want to delete this message? This cannot be undone.",
      confirmText: "Delete",
      onConfirm: async () => {
        const { error } = await supabase.from("messages").delete().eq("id", id);
        if (error) {
          console.error("Delete error:", error);
          toast.error("Failed to delete message");
        } else {
          deleteMessage(id);
          toast.success("Message deleted");
        }
        closeConfirm();
      },
    });
  };

  const handleEdit = (msgId: string, newText: string, editedAt: string) => {
    useChatStore.getState().updateMessageInCache(activeChannel?.id || '', msgId, { text: newText, edited_at: editedAt });
  };

  const handleReply = (msg: any) => {
    setReplyTo({
      id: msg.id,
      text: msg.text,
      username: msg.profiles?.username || 'Unknown',
    });
  };

  const handlePin = async (msgId: string) => {
    await pinMessage(msgId, session?.user?.id || '');
    trackPin();
    toast.success('Message pinned');
  };

  const handleUnpin = async (msgId: string) => {
    await unpinMessage(msgId);
    toast.success('Message unpinned');
  };

  const handleReactionClick = (msg: any) => {
    setReactingToMsg({ id: msg.id, username: msg.profiles?.username || 'Unknown' });
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    if (session?.user?.id) {
      toggleReaction(msgId, emoji, session.user.id);
      trackReaction();
    }
  };

  const handleJumpToMessage = (messageId: string, channelId?: string) => {
    if (channelId && activeChannel?.id !== channelId) {
      const channel = channels.find((c: any) => c.id === channelId);
      if (channel) {
        setActiveChannel(channel);
        setTimeout(() => {
          const element = document.getElementById(`message-${messageId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-zinc-950');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-zinc-950');
            }, 2000);
          }
        }, 500);
      }
    } else {
      const element = document.getElementById(`message-${messageId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-zinc-950');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-zinc-950');
        }, 2000);
      }
    }
  };

  if (authLoading)
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
          <span className="text-3xl font-black italic text-white">B</span>
        </div>
        <p className="font-black text-zinc-800 tracking-[0.4em] uppercase text-sm animate-pulse">
          Booting...
        </p>
      </div>
    );
  if (!session)
    return (
      <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
        <TitleBar />
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
          <AuthScreen />
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      <TitleBar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Hidden on mobile, shown on lg+ */}
        <div className="hidden lg:block">
          <LeftSidebar 
            myProfile={myProfile}
            allProfiles={allProfiles}
            onlineUsers={onlineUsers} 
            onOpenProfile={() => setShowProfile(true)}
            activeChannel={activeChannel}
            onCreateChannel={() => setShowCreateChannel(true)}
            onEditChannel={(channel) => setEditingChannel(channel)}
            onInvite={(channel) => setInvitingChannel(channel)}
            onViewMembers={(channel) => setViewingMembersChannel(channel)}
            onDiscover={() => setShowDiscovery(true)}
            memberCounts={memberCounts}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-zinc-900/30 min-w-0 relative">
          {/* Channel Header */}
          <header 
            className="h-14 lg:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 shrink-0 z-20 border-b border-white/5 bg-zinc-900/95 backdrop-blur-md"
            style={{ borderTopWidth: 3, borderTopColor: (activeChannel as any)?.accent_color || '#ffffff' }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="lg:hidden w-12 h-12 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 touch-manipulation"
              >
                <Menu size={22} />
              </button>
              {(() => {
                const GRADIENT_COLORS: Record<string, { from: string; to: string }> = {
                  indigo: { from: '#4f46e5', to: '#7c3aed' },
                  blue: { from: '#2563eb', to: '#06b6d4' },
                  purple: { from: '#9333ea', to: '#db2777' },
                  emerald: { from: '#059669', to: '#10b981' },
                  orange: { from: '#ea580c', to: '#f97316' },
                  red: { from: '#dc2626', to: '#f43f5e' },
                  pink: { from: '#db2777', to: '#e879f9' },
                  cyan: { from: '#0891b2', to: '#22d3ee' },
                  amber: { from: '#d97706', to: '#fbbf24' },
                  slate: { from: '#334155', to: '#64748b' },
                };
                const channelColor = (activeChannel as any)?.color || 'indigo';
                const color = GRADIENT_COLORS[channelColor] || GRADIENT_COLORS.indigo;
                const emoji = (activeChannel as any)?.emoji as string | undefined;
                const hasEmoji = emoji && emoji !== '💬';
                const accentColor = (activeChannel as any)?.accent_color || '#ffffff';
                return (
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center relative shrink-0"
                    style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                  >
                    <div 
                      className="absolute inset-0 rounded-xl"
                      style={{ boxShadow: `inset 0 0 0 2px ${accentColor}` }}
                    />
                    <div className="relative">
                      {hasEmoji ? (
                        <span className="text-base">{emoji}</span>
                      ) : (
                        <Hash size={14} className="text-white/80" />
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white tracking-tight truncate">
                  {activeChannel?.name || "loading"}
                </h1>
                {activeChannel?.description ? (
                  <p className="hidden lg:block text-xs text-zinc-500 truncate max-w-[200px]">
                    {activeChannel.description}
                  </p>
                ) : (
                  <p className="hidden lg:block text-xs text-zinc-600">
                    {channels.length} channel{channels.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowNotifications(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all relative touch-manipulation"
                  title="Notifications"
                >
                  <Bell size={16} />
                  {notifications.filter((n: any) => n.type === 'invite').length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center">
                      {notifications.filter((n: any) => n.type === 'invite').length > 9 ? '9+' : notifications.filter((n: any) => n.type === 'invite').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowPinnedMessages(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all relative touch-manipulation"
                  title="Pinned Messages"
                >
                  <Pin size={16} />
                </button>
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation"
                  title="Search (Ctrl+K)"
                >
                  <Search size={16} />
                </button>
                <button
                  onClick={() => setShowChallenges(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all relative touch-manipulation"
                  title="Challenges"
                >
                  <Trophy size={16} />
                  {completedCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                      {completedCount}
                    </span>
                  )}
                </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  await performRefresh();
                  setIsRefreshing(false);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation"
                title="Refresh"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation"
                title="Settings"
              >
                <Settings size={16} />
              </button>
              {isSearching && (
                <div className="absolute right-0 top-12 w-72 animate-scale-in">
                  <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3">
                    <div className="flex items-center gap-2">
                      <Search size={14} className="text-zinc-500" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search messages..."
                        className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
                        autoFocus
                      />
                    </div>
                    {searchQuery && (
                      <div className="mt-2 text-[10px] text-zinc-500 uppercase tracking-wider">
                        {messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase())).length} result{messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase())).length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Messages Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-none"
          >
            {/* Pull to refresh indicator */}
            {(isPulling || pullDistance > 0) && (
              <div className="sticky top-0 z-10 flex justify-center py-2 bg-gradient-to-b from-zinc-900 to-transparent">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin ${isPulling ? 'opacity-100' : 'opacity-50'}`} />
                  <span className="text-[10px] text-zinc-500">{isPulling ? 'Refreshing...' : 'Pull down to refresh'}</span>
                </div>
              </div>
            )}
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="font-black text-[10px] tracking-[0.5em] uppercase text-zinc-600">
                  Loading
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-10">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-white/5">
                  <Hash size={32} className="text-zinc-700" />
                </div>
                <p className="font-black text-[10px] tracking-[0.5em] uppercase text-zinc-700">
                  {searchQuery ? 'No results' : 'No messages yet - be the first to chat'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col py-4">
                {hasMore && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <div className="w-3 h-3 border border-zinc-500/30 border-t-zinc-400 rounded-full animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More Messages'
                      )}
                    </button>
                  </div>
                )}
                {messages.map((msg, index) => {
                  const prevMsg = messages[index - 1];
                  const isNew =
                    new Date(msg.created_at) > new Date(lastReadTimestamps[activeChannel?.id || ''] || '1970-01-01');
                  const isFirstNew =
                    isNew &&
                    (index === 0 ||
                      new Date(messages[index - 1].created_at) <=
                        new Date(lastReadTimestamps[activeChannel?.id || ''] || '1970-01-01'));

                  const isSameUser = prevMsg && prevMsg.user_id === msg.user_id;
                  const isWithinTime =
                    prevMsg &&
                    new Date(msg.created_at).getTime() -
                      new Date(prevMsg.created_at).getTime() <
                      5 * 60 * 1000;
                  const isGrouped = isSameUser && isWithinTime && !isFirstNew;

                  return (
                    <div key={msg.id} id={`message-${msg.id}`}>
                      <MessageItem
                        msg={msg}
                        isMe={msg.user_id === session.user.id}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        showNewDivider={isFirstNew}
                        isGrouped={isGrouped}
                        reactions={reactions[msg.id] || []}
                        onToggleReaction={handleToggleReaction}
                        onReactionClick={handleReactionClick}
                        onPin={handlePin}
                        onUnpin={handleUnpin}
                        isPinned={isPinned(msg.id)}
                        onReply={handleReply}
                        searchQuery={searchQuery}
                        myUsername={myProfile?.username}
                        allProfiles={allProfiles}
                      />
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
              </div>
            )}
          </div>

          <div className="absolute bottom-24 right-6 pointer-events-none z-30">
            {showScrollButton && (
              <button
                onClick={jumpToNew}
                className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-xl transition-all duration-300 animate-slide-up shadow-lg ${
                  unreadCount > 0
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-red-500/10'
                    : 'bg-indigo-600/90 text-white hover:bg-indigo-500 shadow-indigo-500/30'
                }"
              >
                {unreadCount > 0 ? (
                  <>
                    <span className="text-[10px] font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount} new
                    </span>
                    <ChevronDown size={12} />
                  </>
                ) : (
                  <ArrowDown size={16} />
                )}
              </button>
            )}
          </div>

          <div className="bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pt-4 pb-4 relative z-10 border-t border-white/5">
            {reactingToMsg && (
              <div className="absolute bottom-full left-0 right-0 mb-2 px-4">
                <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3 max-w-md mx-auto animate-scale-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400">React to <span className="text-indigo-400">{reactingToMsg.username}</span>&apos;s message</span>
                    <button
                      onClick={() => setReactingToMsg(null)}
                      className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex justify-center gap-1">
                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          handleToggleReaction(reactingToMsg.id, emoji);
                          setReactingToMsg(null);
                        }}
                        className="p-3 hover:bg-white/10 rounded-xl text-xl transition-all hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeChannel?.id && myProfile && (
              <>
                <TypingIndicator
                  users={typingUsers[activeChannel.id] || []}
                  className="px-4"
                />
                <MessageInput
                  channelId={activeChannel.id}
                  userId={session.user.id}
                  allProfiles={allProfiles}
                  username={myProfile.username}
                  onTyping={() => startTyping(activeChannel.id)}
                  onStopTyping={() => stopTyping(activeChannel.id)}
                  onMessageSent={handleMessageSent}
                  onReplySent={trackReply}
                  onMentionSent={trackMention}
                  onOptimisticMessage={addOptimisticMessage}
                />
              </>
            )}
          </div>
        </main>

        <RightSidebar 
          allProfiles={allProfiles} 
          onlineUsers={onlineUsers}
        />

        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMobileSidebar(false)}
            />
            <LeftSidebar 
              myProfile={myProfile}
              allProfiles={allProfiles}
              onlineUsers={onlineUsers} 
              onOpenProfile={() => { setShowMobileSidebar(false); setShowProfile(true); }}
              activeChannel={activeChannel}
              isMobile={true}
              onClose={() => setShowMobileSidebar(false)}
              onCreateChannel={() => { setShowMobileSidebar(false); setShowCreateChannel(true); }}
              onEditChannel={(channel) => { setShowMobileSidebar(false); setEditingChannel(channel); }}
              onInvite={(channel) => { setShowMobileSidebar(false); setInvitingChannel(channel); }}
              onViewMembers={(channel) => { setShowMobileSidebar(false); setViewingMembersChannel(channel); }}
              onDiscover={() => { setShowMobileSidebar(false); setShowDiscovery(true); }}
              memberCounts={memberCounts}
            />
          </div>
        )}

        <SettingsModal 
          myProfile={myProfile} 
          challenges={challenges}
          totalXP={totalXP}
          badges={badges}
        />
        {showProfile && myProfile && (
          <ProfileModal 
            profile={myProfile} 
            onlineUsers={onlineUsers}
            challenges={challenges}
            totalXP={totalXP}
            badges={badges}
            onClose={() => setShowProfile(false)} 
          />
        )}
        <ViewProfileModal onlineUsers={onlineUsers} />
        {showUpdatePopup && updateInfo && (
          <UpdateNotification
            version={updateInfo.version}
            onUpdate={() => setShowUpdateModal(true)}
          />
        )}
        {showUpdateModal && <UpdateModal onClose={() => setShowUpdateModal(false)} />}
        {showCreateChannel && session?.user && (
          <CreateChannelModal 
            userId={session.user.id} 
            onClose={() => setShowCreateChannel(false)}
            onChannelCreated={trackChannelCreated}
          />
        )}
        {editingChannel && session?.user && (
          <EditChannelModal 
            channel={editingChannel}
            userId={session.user.id}
            isAdmin={myProfile?.is_admin || false}
            onClose={() => setEditingChannel(null)}
            onRequestDelete={(onConfirm) => {
              showConfirm({
                title: `Delete #${editingChannel.name}`,
                message: "Are you sure you want to delete this channel? This cannot be undone.",
                confirmText: "Delete",
                onConfirm: async () => {
                  await onConfirm();
                  closeConfirm();
                  // If deleted channel was active, switch to general
                  if (activeChannel?.id === editingChannel.id) {
                    const generalChannel = channels.find((c: any) => c.slug === 'general');
                    setActiveChannel(generalChannel || channels[0] || null);
                  }
                },
              });
            }}
          />
        )}
        <ToastContainer />
        <ConfirmModalComponent
          open={confirmConfig.open}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          destructive={confirmConfig.destructive}
          onConfirm={confirmConfig.onConfirm}
          onCancel={closeConfirm}
        />
        <CommandPalette
          open={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onCreateChannel={() => setShowCreateChannel(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProfile={() => setShowProfile(true)}
        />
        <KeyboardShortcutsModal />
        <ChallengesModal
          open={showChallenges}
          onClose={() => setShowChallenges(false)}
          challenges={challenges}
          totalXP={totalXP}
        />
        <ChallengeCompletedToast
          challenge={newCompletedChallenge}
          onClose={clearNewCompleted}
        />
        <BadgeUnlockedToast
          badge={newBadge}
          onClose={() => {}}
        />
        {invitingChannel && (
          <InviteModal
            channel={invitingChannel}
            allProfiles={allProfiles}
            onlineUsers={onlineUsers}
            currentUserId={session?.user?.id}
            invitedUserIds={sentInvites
              .filter((i) => i.channel_id === invitingChannel.id && i.status === 'pending')
              .map((i) => i.invited_user_id)}
            onInvite={async (userId) => {
              return sendInvite(invitingChannel.id, userId);
            }}
            onClose={() => setInvitingChannel(null)}
          />
        )}
        {viewingMembersChannel && (
          <ChannelMembersModal
            channel={viewingMembersChannel}
            members={channelMembers}
            currentUserId={session?.user?.id}
            onlineUsers={onlineUsers}
            loading={membersLoading}
            error={membersError}
            onRemoveMember={async (member) => {
              const result = await removeMember(member.id);
              if (result.success) {
                await supabase.from("messages").insert({
                  channel_id: viewingMembersChannel.id,
                  user_id: member.user_id,
                  text: `was removed from the channel`,
                  is_system: true,
                });
              }
              return result;
            }}
            onRefresh={refreshMembers}
            onLeaveChannel={async () => {
              const currentMember = channelMembers.find(m => m.user_id === session?.user?.id);
              if (currentMember) {
                const result = await removeMember(currentMember.id);
                if (result.success) {
                  await supabase.from('messages').insert({
                    channel_id: viewingMembersChannel.id,
                    user_id: session?.user?.id,
                    text: 'left the channel',
                    is_system: true,
                  });
                  setViewingMembersChannel(null);
                  if (activeChannel?.id === viewingMembersChannel.id) {
                    const currentChannels = useChatStore.getState().channels;
                    const otherChannel = currentChannels.find(c => c.id !== viewingMembersChannel.id && c.slug === 'general') 
                      || currentChannels.find(c => c.id !== viewingMembersChannel.id);
                    if (otherChannel) {
                      setActiveChannel(otherChannel);
                    }
                  }
                  useChatStore.getState().setChannels(
                    useChatStore.getState().channels.filter(c => c.id !== viewingMembersChannel.id)
                  );
                }
                return result;
              }
              return { success: true };
            }}
            onClose={() => setViewingMembersChannel(null)}
          />
        )}
        <SearchModal
          open={showSearch}
          allProfiles={allProfiles}
          onClose={() => setShowSearch(false)}
          onJumpToMessage={handleJumpToMessage}
        />
        <ChannelDiscoveryModal
          open={showDiscovery}
          allProfiles={allProfiles}
          onClose={() => setShowDiscovery(false)}
          onSelectChannel={(channel) => {
            setActiveChannel(channel);
            setShowDiscovery(false);
          }}
        />
        <NotificationModal
          open={showNotifications}
          notifications={notifications.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message || n.body,
            timestamp: n.timestamp || n.created_at,
            read: n.read || false,
            data: {
              channelId: n.channel_id,
            },
          }))}
          onClose={() => setShowNotifications(false)}
          onAcceptInvite={async (notificationId) => {
            const notif = notifications.find((n: any) => n.id === notificationId);
            if (notif?.channel_id) {
              const { data: inviteData } = await supabase
                .from('channel_invites')
                .select('*')
                .eq('channel_id', notif.channel_id)
                .eq('invited_user_id', session?.user?.id)
                .eq('status', 'pending')
                .single();
              
              if (inviteData) {
                await supabase.from('channel_invites').update({ status: 'accepted' }).eq('id', inviteData.id);
                await supabase.from('channel_members').insert({
                  channel_id: notif.channel_id,
                  user_id: session?.user?.id,
                  role: 'member',
                });
                await supabase.from('messages').insert({
                  channel_id: notif.channel_id,
                  user_id: session?.user?.id,
                  text: 'joined the channel',
                  is_system: true,
                });
                await supabase.from('user_notifications').delete().eq('id', notificationId);
              }
              setNotifications((prev: any[]) => prev.filter((n: any) => n.id !== notificationId));
              refreshMembers?.();
            }
          }}
          onDeclineInvite={async (notificationId) => {
            await supabase.from('user_notifications').delete().eq('id', notificationId);
            setNotifications((prev: any[]) => prev.filter((n: any) => n.id !== notificationId));
          }}
          onViewChannel={(channelId) => {
            const channel = channels.find(c => c.id === channelId);
            if (channel) {
              setActiveChannel(channel);
              setShowNotifications(false);
            }
          }}
          onClearAll={async () => {
            const notificationIds = notifications.map((n: any) => n.id);
            if (notificationIds.length > 0) {
              await supabase.from('user_notifications').delete().in('id', notificationIds);
            }
            setNotifications([]);
            setShowNotifications(false);
          }}
        />

        {showPinnedMessages && (
          <PinnedMessagesModal
            onClose={() => setShowPinnedMessages(false)}
            onJumpToMessage={(messageId) => {
              handleJumpToMessage(messageId);
              setShowPinnedMessages(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function PinnedMessagesModal({ onClose, onJumpToMessage }: { onClose: () => void; onJumpToMessage: (messageId: string) => void }) {
  const { pinnedMessages } = useChatStore();

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md animate-scale-in max-h-[70vh] flex flex-col">
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Pin size={16} className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Pinned Messages</h2>
              <span className="text-[10px] text-zinc-500">({pinnedMessages.length})</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto custom-scrollbar">
            {pinnedMessages.length === 0 ? (
              <div className="p-8 text-center">
                <Pin size={32} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500">No pinned messages</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {pinnedMessages.map((pinned) => {
                  const msg = pinned.message as { text?: string; profiles?: { username?: string } } | null;
                  return (
                    <div
                      key={pinned.id}
                      className="p-3 bg-zinc-900/50 hover:bg-zinc-800/50 border border-white/5 hover:border-white/10 rounded-lg cursor-pointer transition-all"
                      onClick={() => onJumpToMessage(pinned.message_id)}
                    >
                      <p className="text-[10px] font-semibold text-indigo-400 mb-1">
                        {msg?.profiles?.username || 'Unknown'}
                      </p>
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {msg?.text || 'Message not found'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
