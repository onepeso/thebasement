"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Menu, Hash, Search, Users, Bell, Pin, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/store/useChatStore";
import { useMobileNav } from "@/components/mobile/MobileNavContext";
import { MobileChannelList } from "@/components/mobile/MobileChannelList";
import { MobileMemberSheet } from "@/components/mobile/MobileMemberSheet";
import { ToastContainer, useToast } from "@/store/useToastStore";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { MobileMessageInput } from "@/components/mobile/MobileMessageInput";
import { useTyping } from "@/hooks/useTyping";
import { usePresence } from "@/hooks/usePresence";
import { useReactions } from "@/hooks/useReactions";
import { usePinnedMessages } from "@/hooks/usePinnedMessages";
import { useChallenges } from "@/hooks/useChallenges";
import { useBadges } from "@/hooks/useBadges";
import { useChannelMembers } from "@/hooks/useChannelMembers";
import { MobileSettingsModal } from "@/components/ui/MobileSettingsModal";
import { MobileSearchModal } from "@/components/mobile/MobileSearchModal";
import { MobilePinnedMessages } from "@/components/mobile/MobilePinnedMessages";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { MobileMessageItem } from "@/components/mobile/MobileMessageItem";
import { MobileChallengeModal } from "@/components/mobile/MobileChallengeModal";
import { MobileCreateChannelModal } from "@/components/mobile/MobileCreateChannelModal";
import { MobileInviteModal } from "@/components/mobile/MobileInviteModal";
import { MobileNotificationModal } from "@/components/mobile/MobileNotificationModal";

export default function MobileChannelsPage() {
  const { session, allProfiles, myProfile } = useAuth();
  const {
    channels,
    activeChannel,
    lastReadTimestamps,
    setChannels,
    setActiveChannel,
    markChannelRead,
  } = useChatStore();
  const { setShowChannelDrawer, setShowMemberSheet } = useMobileNav();
  const toast = useToast();

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettingsLocal] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [invitingChannel, setInvitingChannel] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasRestoredChannel = useRef(false);

  const onlineUsers = usePresence(session?.user?.id);
  const { typingUsers, startTyping, stopTyping } = useTyping(
    session?.user?.id,
    myProfile?.username
  );
  const { messages, hasMore, loading, loadMore, deleteMessage } = useChat(activeChannel?.id, session?.user?.id);
  const { reactions, toggleReaction } = useReactions(activeChannel?.id);
  const { pinMessage, unpinMessage, isPinned } = usePinnedMessages(activeChannel?.id);
  const {
    challenges,
    totalXP,
    trackMessage,
    trackReaction,
    trackPin,
  } = useChallenges(session?.user?.id);
  const { badges } = useBadges(session?.user?.id);
  const {
    members: channelMembers,
    removeMember,
  } = useChannelMembers(activeChannel?.id);
  const { confirm: showConfirm, ConfirmComponent: ConfirmModalComponent, config: confirmConfig, close: closeConfirm } = useConfirm();

  const unreadCount = messages.filter(
    (m: any) =>
      m.user_id !== session?.user?.id &&
      new Date(m.created_at) > new Date(lastReadTimestamps[activeChannel?.id || ""] || "1970-01-01")
  ).length;

  const completedCount = challenges.filter((c: any) => c.completed).length;

  useEffect(() => {
    const fetchChannels = async () => {
      if (!session?.user?.id) return;

      const { data: memberData } = await supabase
        .from("channel_members")
        .select("channel_id")
        .eq("user_id", session?.user?.id);

      const channelIds = memberData?.map((m: any) => m.channel_id) || [];

      const { data } = await supabase.from("channels").select("*").order("name");

      if (data) {
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
        .from("channel_members")
        .select("channel_id")
        .in("channel_id", channelIds);

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

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("auto");
    }
  }, [activeChannel?.id]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    setShowScrollButton(distanceToBottom > 400);
  };

  const jumpToNew = () => {
    scrollToBottom("smooth");
    if (activeChannel?.id) markChannelRead(activeChannel.id);
  };

  const handleMessageSent = useCallback(async () => {
    trackMessage();
    scrollToBottom("smooth");
  }, [trackMessage]);

  const handleToggleReaction = (msgId: string, emoji: string) => {
    if (session?.user?.id) {
      toggleReaction(msgId, emoji, session.user.id);
      trackReaction();
    }
  };

  const handlePin = async (msgId: string) => {
    await pinMessage(msgId, session?.user?.id || "");
    trackPin();
    toast.success("Message pinned");
  };

  const handleUnpin = async (msgId: string) => {
    await unpinMessage(msgId);
    toast.success("Message unpinned");
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: "Delete Message",
      message: "Are you sure you want to delete this message?",
      confirmText: "Delete",
      onConfirm: async () => {
        const { error } = await supabase.from("messages").delete().eq("id", id);
        if (error) {
          toast.error("Failed to delete message");
        } else {
          deleteMessage(id);
          toast.success("Message deleted");
        }
        closeConfirm();
      },
    });
  };

  const handleRemoveMember = async (member: any) => {
    showConfirm({
      title: "Remove Member",
      message: `Are you sure you want to remove ${member.profiles?.username} from this channel?`,
      confirmText: "Remove",
      onConfirm: async () => {
        const result = await removeMember(member.id);
        if (result.success) {
          await supabase.from("messages").insert({
            channel_id: activeChannel?.id,
            user_id: member.user_id,
            text: "was removed from the channel",
            is_system: true,
          });
          toast.success("Member removed");
        }
        closeConfirm();
      },
    });
  };

  const handleOpenProfile = (userId: string) => {
    useChatStore.getState().setViewProfile({ id: userId, username: "" });
  };

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-zinc-500">Please sign in</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header
        className="h-14 flex items-center justify-between px-3 shrink-0 border-b border-white/5"
        style={{ borderTopWidth: 3, borderTopColor: (activeChannel as any)?.accent_color || "#ffffff" }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChannelDrawer(true)}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation"
          >
            <Menu size={22} />
          </button>
          {(() => {
            const GRADIENT_COLORS: Record<string, { from: string; to: string }> = {
              indigo: { from: "#4f46e5", to: "#7c3aed" },
              blue: { from: "#2563eb", to: "#06b6d4" },
              purple: { from: "#9333ea", to: "#db2777" },
              emerald: { from: "#059669", to: "#10b981" },
            };
            const channelColor = (activeChannel as any)?.color || "indigo";
            const color = GRADIENT_COLORS[channelColor] || GRADIENT_COLORS.indigo;
            return (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
              >
                <Hash size={14} className="text-white/80" />
              </div>
            );
          })()}
          <h1 className="text-sm font-bold text-white truncate max-w-[140px]">
            {activeChannel?.name || "Channels"}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all touch-manipulation"
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => setShowMemberSheet(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all touch-manipulation"
          >
            <Users size={18} />
          </button>
          <button
            onClick={() => setShowNotifications(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all relative touch-manipulation"
          >
            <Bell size={18} />
            {notifications.filter((n: any) => n.type === "invite").length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center">
                {notifications.filter((n: any) => n.type === "invite").length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar">
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
              No messages yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col py-4">
            {hasMore && (
              <div className="flex justify-center py-2">
                <button
                  onClick={loadMore}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 rounded-lg transition-all"
                >
                  Load More
                </button>
              </div>
            )}
            {messages.map((msg: any) => (
              <MobileMessageItem
                key={msg.id}
                msg={msg}
                isMe={msg.user_id === session.user.id}
                reactions={reactions[msg.id] || []}
                onToggleReaction={handleToggleReaction}
                onPin={isPinned(msg.id) ? () => handleUnpin(msg.id) : () => handlePin(msg.id)}
                isPinned={isPinned(msg.id)}
                allProfiles={allProfiles}
              />
            ))}
            <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
          </div>
        )}
      </div>

      {/* Scroll Button */}
      {showScrollButton && (
        <button
          onClick={jumpToNew}
          className="absolute bottom-24 right-4 flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all z-20"
        >
          {unreadCount > 0 ? (
            <span className="text-xs font-bold">{unreadCount > 99 ? "99+" : unreadCount} new</span>
          ) : null}
        </button>
      )}

      {/* Input Area */}
      <div className="bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pt-3 pb-3 relative shrink-0 border-t border-white/5">
        <TypingIndicator users={typingUsers[activeChannel?.id || ""] || []} className="px-4 mb-1" />
        {activeChannel?.id && myProfile && (
          <MobileMessageInput
            channelId={activeChannel.id}
            userId={session.user.id}
            username={myProfile.username}
            onTyping={() => startTyping(activeChannel.id)}
            onStopTyping={() => stopTyping(activeChannel.id)}
            onMessageSent={handleMessageSent}
            allProfiles={allProfiles}
          />
        )}
      </div>

      {/* Channel List Drawer */}
      <MobileChannelList
        onOpenProfile={() => setShowSettingsLocal(true)}
        onCreateChannel={() => setShowCreateChannel(true)}
        onOpenDiscovery={() => {}}
        onOpenInvite={(channel) => setInvitingChannel(channel)}
        onEditChannel={() => {}}
        memberCounts={memberCounts}
      />

      {/* Member Sheet */}
      <MobileMemberSheet
        members={channelMembers}
        onlineUsers={onlineUsers}
        currentUserId={session?.user?.id}
        onRemoveMember={handleRemoveMember}
        onOpenProfile={handleOpenProfile}
      />

      {/* Modals */}
      {showSettings && <MobileSettingsModal onClose={() => setShowSettingsLocal(false)} />}
      {showSearch && <MobileSearchModal onClose={() => setShowSearch(false)} />}
      {showPinned && <MobilePinnedMessages onClose={() => setShowPinned(false)} />}
      {showChallenges && (
        <MobileChallengeModal
          challenges={challenges}
          totalXP={totalXP}
          badges={badges}
          onClose={() => setShowChallenges(false)}
        />
      )}
      {showCreateChannel && session?.user && (
        <MobileCreateChannelModal
          userId={session.user.id}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
      {invitingChannel && (
        <MobileInviteModal
          channel={invitingChannel}
          allProfiles={allProfiles}
          onlineUsers={onlineUsers}
          currentUserId={session?.user?.id}
          onClose={() => setInvitingChannel(null)}
        />
      )}
      {showNotifications && (
        <MobileNotificationModal
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onAcceptInvite={() => {}}
          onDeclineInvite={() => {}}
        />
      )}

      <ToastContainer />
      <ConfirmModalComponent
        open={confirmConfig.open}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
