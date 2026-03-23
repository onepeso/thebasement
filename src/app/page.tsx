"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { usePresence } from "@/hooks/usePresence";
import { useReactions } from "@/hooks/useReactions";
import { usePinnedMessages } from "@/hooks/usePinnedMessages";
import { useNotifications } from "@/hooks/useNotifications";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useThreads } from "@/hooks/useThreads";
import { useTyping } from "@/hooks/useTyping";
import { useChatStore } from "@/store/useChatStore";
import { ToastContainer, useToast } from "@/store/useToastStore";
import { TitleBar } from "@/components/layout/TitleBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MemberList } from "@/components/layout/MemberList";
import { MessageStats } from "@/components/layout/MessageStats";
import { PinnedMessages } from "@/components/layout/PinnedMessages";
import { MessageItem } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { DMView } from "@/components/chat/DMView";
import { ThreadView } from "@/components/chat/ThreadView";
import { SettingsModal } from "@/components/ui/SettingsModal";
import { ProfileModal } from "@/components/ui/ProfileModal";
import { ViewProfileModal } from "@/components/ui/ViewProfileModal";
import AuthScreen from "@/components/ui/AuthScreen";
import { ChevronDown, ArrowDown, Sparkles, Hash, Search, X, MessageSquare, Menu } from "lucide-react";
import type { DirectMessage, Message, Thread } from "@/types/database";

export default function Home() {
  const { session, allProfiles, myProfile, loading: authLoading } = useAuth();
  const { channels, activeChannel, layoutMode, lastReadTimestamp, searchQuery, isSearching, setChannels, setActiveChannel, setLayoutMode, updateLastReadToNow, setSearchQuery, setIsSearching, setReplyTo } = useChatStore();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [reactingToMsg, setReactingToMsg] = useState<{id: string, username: string} | null>(null);
  const [showDM, setShowDM] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeThread, setActiveThread] = useState<{rootMessage: Message; threadId: string; channelName: string} | null>(null);
  const toast = useToast();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMsgId = useRef<string | null>(null);
  const lastProcessedRef = useRef<{ channelId: string; messageId: string } | null>(null);
  const hasRestoredChannel = useRef(false);

  const onlineUsers = usePresence(session?.user?.id);
  const { messages, receipts } = useChat(activeChannel?.id, session?.user?.id);
  const { typingUsers, startTyping, stopTyping } = useTyping(session?.user?.id, myProfile?.username);
  
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
  const { conversations, messages: dmMessages, activeDM, setActiveDM, startConversation, sendMessage } = useDirectMessages(session?.user?.id);
  const { threads, threadMessages, userThreads, createThread, addThreadMessage, fetchThreadMessages, fetchThread, fetchUserThreads, deleteThread } = useThreads();
  
  const handleSelectDM = (dm: DirectMessage) => {
    setActiveDM(dm);
    setShowDM(true);
    setShowMobileSidebar(false);
  };

  const handleStartDM = async (userId: string) => {
    await startConversation(userId);
    setShowDM(true);
    setShowMobileSidebar(false);
  };

  const handleBackToChannels = () => {
    setShowDM(false);
    setShowThread(false);
    setActiveDM(null);
    setActiveThread(null);
  };

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
          if (!activeChannel?.id || !data.find((c: any) => c.id === activeChannel.id)) {
            setActiveChannel(data.find((c: any) => c.slug === "general") || data[0]);
          }
        }
      }
    };
    fetchChannels();
  }, [setChannels, setActiveChannel]);

  useEffect(() => {
    if (!session?.user?.id || !activeChannel?.id) return;
    
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.id !== lastProcessedMsgId.current && lastMsg.user_id === session.user.id) {
      lastProcessedMsgId.current = lastMsg.id;
      supabase.from("read_receipts").upsert(
        {
          user_id: session.user.id,
          channel_id: activeChannel.id,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "user_id, channel_id" },
      );
    }
  }, [messages.length, activeChannel?.id, session?.user?.id]);

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

  const handleDelete = async (id: string) => {
    if (confirm("Delete this message?")) {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete message");
      } else {
        toast.success("Message deleted");
      }
    }
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

  const handleOpenThread = async (msg: any, channelName?: string) => {
    if (!session?.user?.id || !activeChannel?.id) return;
    
    let threadId: string | null = msg.thread_id || null;
    
    if (!threadId) {
      threadId = await createThread(activeChannel.id, msg.id, session.user.id, myProfile?.username);
      if (!threadId) {
        toast.error('Failed to create thread');
        return;
      }
      const { data: updatedMsg } = await supabase
        .from('messages')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('id', msg.id)
        .single();
      if (updatedMsg) {
        msg = updatedMsg;
      }
    }
    
    await Promise.all([
      fetchThreadMessages(threadId),
      fetchThread(threadId),
    ]);
    
    setActiveThread({ 
      rootMessage: msg, 
      threadId,
      channelName: channelName || activeChannel.name 
    });
    setShowThread(true);
  };

  const handleSelectThread = async (thread: Thread) => {
    await Promise.all([
      fetchThreadMessages(thread.id),
      fetchThread(thread.id),
    ]);
    
    const rootMsg = await supabase
      .from('messages')
      .select('*, profiles:user_id(username, avatar_url)')
      .eq('id', thread.root_message_id)
      .single();
    
    if (rootMsg.data) {
      const channel = channels.find(c => c.id === thread.channel_id);
      setActiveThread({ 
        rootMessage: rootMsg.data, 
        threadId: thread.id,
        channelName: channel?.name || 'Unknown'
      });
      setShowThread(true);
    }
  };

  const handleSendThreadMessage = async (text: string) => {
    if (!activeThread || !session?.user?.id) return;
    const thread = threads[activeThread.threadId];
    if (!thread) return;
    
    await addThreadMessage(
      activeThread.threadId, 
      text, 
      session.user.id, 
      thread.channel_id,
      { username: myProfile?.username || '', avatar_url: myProfile?.avatar_url || '' }
    );
  };

  const handleCloseThread = () => {
    setShowThread(false);
    setActiveThread(null);
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!session?.user?.id) return;
    if (!confirm('Delete this thread? This cannot be undone.')) return;
    
    const success = await deleteThread(threadId, session.user.id);
    if (success) {
      if (activeThread?.threadId === threadId) {
        handleCloseThread();
      }
      toast.success('Thread deleted');
    } else {
      toast.error('You can only delete threads you started');
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserThreads(session.user.id);
    }
  }, [session?.user?.id, fetchUserThreads]);

  const filteredMessages = searchQuery
    ? messages.filter(m => {
        if (m.text.toLowerCase().includes(searchQuery.toLowerCase())) {
          if (!m.thread_id) return true;
          const thread = threads[m.thread_id];
          return thread?.root_message_id === m.id;
        }
        return false;
      })
    : messages.filter(m => {
        if (!m.thread_id) return true;
        const thread = threads[m.thread_id];
        return thread?.root_message_id === m.id;
      });

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
        <Sidebar 
          myProfile={myProfile} 
          conversations={conversations}
          allProfiles={allProfiles}
          onlineUsers={onlineUsers}
          onSelectDM={handleSelectDM}
          onStartDM={handleStartDM}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
          onOpenProfile={() => setShowProfile(true)}
          activeDM={activeDM}
          activeChannel={activeChannel}
          onBackToChannels={handleBackToChannels}
          userThreads={userThreads}
          activeThreadId={activeThread?.threadId}
          showMobileSidebar={showMobileSidebar}
          onCloseMobileSidebar={() => setShowMobileSidebar(false)}
        />

        {/* Mobile sidebar overlay */}
        {showMobileSidebar && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {showThread && activeThread ? (
          <ThreadView
            thread={threads[activeThread.threadId]}
            rootMessage={activeThread.rootMessage}
            threadMessages={threadMessages[activeThread.threadId] || []}
            currentUserId={session?.user?.id || ''}
            onClose={handleCloseThread}
            onSendMessage={handleSendThreadMessage}
            channelName={activeThread.channelName}
            onlineUsers={onlineUsers}
          />
        ) : showDM ? (
          <DMView
            dm={activeDM}
            messages={dmMessages}
            currentUserId={session?.user?.id || ''}
            onSendMessage={async (text) => {
              if (activeDM) {
                await sendMessage(activeDM.id, text);
              }
            }}
            onBack={handleBackToChannels}
            onlineUsers={onlineUsers}
            allProfiles={allProfiles}
            typingUsers={typingUsers[activeDM?.id || ''] || []}
            onTyping={() => activeDM && startTyping(activeDM.id)}
            onStopTyping={() => activeDM && stopTyping(activeDM.id)}
          />
        ) : (
          <main className="flex-1 flex flex-col bg-zinc-900/30 min-w-0 relative">
            <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 border-b border-white/5 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  <Menu size={20} />
                </button>
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                  <Hash size={16} className="sm:text-lg text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                    {activeChannel?.name || "loading"}
                  </h1>
                  <p className="hidden sm:block text-xs text-zinc-500">
                    {channels.length} channel{channels.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <button
                    onClick={() => setIsSearching(!isSearching)}
                    className={`p-2.5 rounded-xl transition-all ${isSearching ? 'bg-indigo-600 text-white' : 'bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-white'}`}
                  >
                    <Search size={16} />
                  </button>
                  {isSearching && (
                    <div className="absolute right-0 top-12 w-72 animate-scale-in">
                      <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3">
                        <div className="flex items-center gap-2">
                          <Search size={14} className="text-zinc-500" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search messages..."
                            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
                            autoFocus
                          />
                          {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {searchQuery && (
                          <div className="mt-2 text-[10px] text-zinc-500 uppercase tracking-wider">
                            {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setLayoutMode(layoutMode === "standard" ? "iphone" : "standard")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-white/5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/10 transition-all duration-200"
                >
                  <Sparkles size={14} />
                  <span className="hidden sm:inline">{layoutMode === "standard" ? "Standard" : "iPhone"}</span>
                  <span className="sm:hidden">Layout</span>
                </button>
              </div>
            </header>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative"
            >
              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-10">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-white/5">
                    <Hash size={32} className="text-zinc-700" />
                  </div>
                  <p className="font-black text-[10px] tracking-[0.5em] uppercase text-zinc-700">
                    {searchQuery ? 'No results' : 'No Signal'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col py-4">
                  {filteredMessages.map((msg, index) => {
                    const prevMsg = filteredMessages[index - 1];
                    const isNew =
                      new Date(msg.created_at) > new Date(lastReadTimestamp);
                    const isFirstNew =
                      isNew &&
                      (index === 0 ||
                        new Date(filteredMessages[index - 1].created_at) <=
                          new Date(lastReadTimestamp));

                    const isSameUser = prevMsg && prevMsg.user_id === msg.user_id;
                    const isWithinTime =
                      prevMsg &&
                      new Date(msg.created_at).getTime() -
                        new Date(prevMsg.created_at).getTime() <
                        5 * 60 * 1000;
                    const isGrouped = isSameUser && isWithinTime && !isFirstNew;
                    const msgThread = msg.thread_id ? threads[msg.thread_id] : undefined;
                    const isThreadRoot = msgThread?.root_message_id === msg.id;

                    return (
                      <div key={msg.id} id={`message-${msg.id}`}>
                        <MessageItem
                          msg={msg}
                          isMe={msg.user_id === session.user.id}
                          onDelete={handleDelete}
                          receipts={receipts}
                          showNewDivider={isFirstNew}
                          layoutMode={layoutMode}
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
                          thread={msgThread}
                          isThreadRoot={isThreadRoot}
                          onOpenThread={handleOpenThread}
                        />
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
                </div>
              )}
            </div>

            <div className="absolute bottom-24 right-6 flex flex-col items-end gap-3 pointer-events-none z-30">
              {filteredMessages.some(
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
                  />
                </>
              )}
            </div>
          </main>
        )}
        {!showDM && !showThread && (
          <div className="flex flex-col border-l border-white/5">
            <MemberList allProfiles={allProfiles} onlineUsers={onlineUsers} />
            <PinnedMessages onJumpToMessage={handleJumpToMessage} />
            <MessageStats />
          </div>
        )}
        <SettingsModal myProfile={myProfile} />
        {showProfile && myProfile && (
          <ProfileModal 
            profile={myProfile} 
            onClose={() => setShowProfile(false)} 
          />
        )}
        <ViewProfileModal onlineUsers={onlineUsers} />
        <ToastContainer />
      </div>
    </div>
  );
}
