"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { usePresence } from "@/hooks/usePresence";
import { useReactions } from "@/hooks/useReactions";
import { usePinnedMessages } from "@/hooks/usePinnedMessages";
import { useNotifications } from "@/hooks/useNotifications";
import { useTyping } from "@/hooks/useTyping";
import { useUpdate } from "@/hooks/useUpdate";
import { useChallenges } from "@/hooks/useChallenges";
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
import { useConfirm } from "@/components/ui/ConfirmModal";
import { CommandPalette, useKeyboardShortcuts } from "@/components/ui/CommandPalette";
import { KeyboardShortcutsModal } from "@/components/ui/KeyboardShortcutsModal";
import { ChallengesModal } from "@/components/ui/ChallengesModal";
import { ChallengeCompletedToast } from "@/components/ui/ChallengeCompletedToast";
import AuthScreen from "@/components/ui/AuthScreen";
import { ChevronDown, ArrowDown, Hash, Search, X, Menu, Command, Trophy } from "lucide-react";

export default function Home() {
  const { session, allProfiles, myProfile, loading: authLoading } = useAuth();
  const { channels, activeChannel, lastReadTimestamp, searchQuery, isSearching, setChannels, setActiveChannel, updateLastReadToNow, setSearchQuery, setIsSearching, setReplyTo, showUpdatePopup, dismissedUpdateVersion, setShowSettings } = useChatStore();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [reactingToMsg, setReactingToMsg] = useState<{id: string, username: string} | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const { confirm: showConfirm, ConfirmComponent: ConfirmModalComponent, config: confirmConfig, close: closeConfirm } = useConfirm();
  const toast = useToast();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMsgId = useRef<string | null>(null);
  const lastProcessedRef = useRef<{ channelId: string; messageId: string } | null>(null);
  const hasRestoredChannel = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<{ focus: () => void } | null>(null);

  const onlineUsers = usePresence(session?.user?.id);
  const { messages, hasMore, loading, loadingMore, loadMore } = useChat(activeChannel?.id, session?.user?.id);
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
  
  const completedCount = challenges.filter((c: any) => c.completed).length;
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const closeAllModals = useCallback(() => {
    setShowProfile(false);
    setShowCreateChannel(false);
    setShowCommandPalette(false);
    setShowShortcuts(false);
    setEditingChannel(null);
  }, []);

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
      const { data } = await supabase
        .from("channels")
        .select("*")
        .order("name");
      if (data) {
        setChannels(data);
        if (!hasRestoredChannel.current) {
          hasRestoredChannel.current = true;
          // Check if we have a persisted active channel
          const persistedChannel = useChatStore.getState().activeChannel;
          if (persistedChannel?.id && data.find((c: any) => c.id === persistedChannel.id)) {
            // Keep the persisted channel
            return;
          }
          // Otherwise, set to general or first channel
          setActiveChannel(data.find((c: any) => c.slug === "general") || data[0]);
        }
      }
    };
    fetchChannels();
  }, [setChannels, setActiveChannel]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceToBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    setShowScrollButton(distanceToBottom > 400);
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
    updateLastReadToNow();
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
          toast.error("Failed to delete message");
        } else {
          toast.success("Message deleted");
        }
        closeConfirm();
      },
    });
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

  const handleJumpToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-zinc-950');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-zinc-950');
      }, 2000);
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
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-zinc-900/30 min-w-0 relative">
          {/* Channel Header */}
          <header className="h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20 border-b border-white/5 bg-zinc-900/80 backdrop-blur-none lg:backdrop-blur-xl">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <Menu size={20} />
              </button>
              <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                <Hash size={16} className="lg:text-lg text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm lg:text-base font-bold text-white tracking-tight truncate">
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
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearching(!isSearching)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isSearching ? 'bg-indigo-600 text-white' : 'bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              >
                <Search size={16} />
              </button>
              <button
                onClick={() => setShowShortcuts(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                title="Keyboard shortcuts"
              >
                <Command size={16} />
              </button>
              <button
                onClick={() => setShowChallenges(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all relative"
                title="Challenges"
              >
                <Trophy size={16} />
                {completedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                    {completedCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowCommandPalette(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                title="Command palette (Ctrl+K)"
              >
                <kbd className="text-[10px] font-bold">⌘K</kbd>
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
            className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
          >
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
                    new Date(msg.created_at) > new Date(lastReadTimestamp);
                  const isFirstNew =
                    isNew &&
                    (index === 0 ||
                      new Date(messages[index - 1].created_at) <=
                        new Date(lastReadTimestamp));

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
                      />
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
              </div>
            )}
          </div>

          <div className="absolute bottom-24 right-6 flex flex-col items-end gap-3 pointer-events-none z-30">
            {messages.some(
              (m) =>
                m.user_id !== session?.user?.id &&
                new Date(m.created_at) > new Date(lastReadTimestamp),
            ) && (
              <button
                onClick={jumpToNew}
                className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 backdrop-blur-xl hover:bg-red-500/20 transition-all duration-300 shadow-lg shadow-red-500/10 animate-slide-up"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Jump to New
                </span>
                <ChevronDown size={12} />
              </button>
            )}

            {showScrollButton && (
              <button
                onClick={() => {
                  scrollToBottom("smooth");
                  updateLastReadToNow();
                }}
                className="pointer-events-auto flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 active:scale-95 transition-all duration-300 animate-slide-up"
              >
                <ArrowDown size={18} />
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
                  onMessageSent={trackMessage}
                  onReplySent={trackReply}
                  onMentionSent={trackMention}
                />
              </>
            )}
          </div>
        </main>

        <RightSidebar 
          allProfiles={allProfiles} 
          onlineUsers={onlineUsers}
          onJumpToMessage={handleJumpToMessage}
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
            />
          </div>
        )}

        <SettingsModal myProfile={myProfile} />
        {showProfile && myProfile && (
          <ProfileModal 
            profile={myProfile} 
            onlineUsers={onlineUsers}
            challenges={challenges}
            totalXP={totalXP}
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
        <KeyboardShortcutsModal
          open={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
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
      </div>
    </div>
  );
}
