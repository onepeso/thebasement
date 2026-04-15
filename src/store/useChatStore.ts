import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_by?: string;
  is_official?: boolean;
  [key: string]: unknown;
}

interface Reaction {
  message_id: string;
  emoji: string;
  count: number;
  userIds: string[];
}

interface PinnedMessage {
  id: string;
  message_id: string;
  channel_id: string;
  message: Record<string, unknown>;
}

interface ReplyMessage {
  id: string;
  text: string;
  username: string;
}

interface NotificationSettings {
  mentions: boolean;
  directMessages: boolean;
  sound: boolean;
}

interface ViewProfile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  status?: string;
  avatar_effect?: string;
  avatar_overlays?: string;
  font_style?: string;
  text_color?: string;
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  status?: string | null;
  avatar_effect?: string | null;
  avatar_overlays?: string | null;
  email?: string | null;
}

interface ChatStore {
  channels: Channel[];
  activeChannel: Channel | null;
  
  // Persisted user profile for instant loading
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  showSettings: boolean;
  viewProfile: ViewProfile | null;
  reduceMotion: boolean;
  isTabVisible: boolean;
  
  // Blocked users
  blockedIds: string[];
  setBlockedIds: (ids: string[]) => void;
  addBlockedId: (id: string) => void;
  removeBlockedId: (id: string) => void;
  
  // Per-channel last read timestamps
  lastReadTimestamps: Record<string, string>;
  unreadCounts: Record<string, number>;
  
  // Sequence tracking for efficient reconnect
  channelSequence: Record<string, number>;
  lastEventTimestamp: string | null;
  
  reactions: Record<string, Reaction[]>;
  pinnedMessages: PinnedMessage[];
  searchQuery: string;
  isSearching: boolean;
  replyTo: ReplyMessage | null;
  notificationSettings: NotificationSettings;
  
  showUpdatePopup: boolean;
  dismissedUpdateVersion: string | null;
  showKeyboardShortcuts: boolean;
  setShowKeyboardShortcuts: (show: boolean) => void;
  
  setChannelSequence: (channelId: string, sequence: number) => void;
  setLastEventTimestamp: (timestamp: string) => void;
  
  messageCache: Record<string, {
    messages: any[];
    hasMore: boolean;
    oldestMessageId: string | null;
  }>;
  
  setChannels: (channels: Channel[]) => void;
  setActiveChannel: (channel: Channel | null) => void;
  setShowSettings: (show: boolean) => void;
  setViewProfile: (profile: ViewProfile | null) => void;
  setReduceMotion: (reduce: boolean) => void;
  setIsTabVisible: (visible: boolean) => void;
  markChannelRead: (channelId: string) => void;
  setUnreadCount: (channelId: string, count: number) => void;
  incrementUnread: (channelId: string) => void;
  setMessageCache: (channelId: string, data: { messages: any[]; hasMore: boolean; oldestMessageId: string | null }) => void;
  addMessagesToCache: (channelId: string, messages: any[], prepend?: boolean) => void;
  updateMessageInCache: (channelId: string, messageId: string, updates: Partial<any>) => void;
  deleteMessageFromCache: (channelId: string, messageId: string) => void;
  clearMessageCache: (channelId: string) => void;
  
  setReactions: (messageId: string, reactions: Reaction[]) => void;
  addReaction: (messageId: string, emoji: string, userId: string) => void;
  removeReaction: (messageId: string, emoji: string, userId: string) => void;
  
  setPinnedMessages: (messages: PinnedMessage[]) => void;
  addPinnedMessage: (message: PinnedMessage) => void;
  removePinnedMessage: (messageId: string) => void;
  
  setSearchQuery: (query: string) => void;
  setIsSearching: (searching: boolean) => void;
  
  setReplyTo: (message: ReplyMessage | null) => void;
  clearReplyTo: () => void;
  
  setNotificationSettings: (settings: NotificationSettings) => void;
  toggleNotificationSetting: (key: keyof NotificationSettings) => void;
  
  setShowUpdatePopup: (show: boolean) => void;
  dismissUpdate: (version: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      channels: [],
      activeChannel: null,
      showSettings: false,
      viewProfile: null,
      reduceMotion: false,
      isTabVisible: true,
      lastReadTimestamps: {},
      unreadCounts: {},
      channelSequence: {},
      lastEventTimestamp: null,
      
      reactions: {},
      pinnedMessages: [],
      searchQuery: '',
      isSearching: false,
      replyTo: null,
      notificationSettings: {
        mentions: true,
        directMessages: false,
        sound: true,
      },
      showUpdatePopup: false,
      dismissedUpdateVersion: null,
      showKeyboardShortcuts: false,

      // Message cache
      messageCache: {},

      // User profile for instant loading
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      updateUserProfile: (updates) => set((state) => ({
        userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null
      })),

      setChannels: (channels) => set({ channels }),
      
      setActiveChannel: (channel) => set((state) => { 
        const newTimestamps = { ...state.lastReadTimestamps };
        if (channel?.id) {
          newTimestamps[channel.id] = new Date().toISOString();
        }
        return {
          activeChannel: channel,
          lastReadTimestamps: newTimestamps,
          replyTo: null,
          searchQuery: '',
          isSearching: false,
          reactions: {},
        };
      }),
      
      setShowSettings: (show) => set({ showSettings: show }),
      
      setViewProfile: (profile) => set({ viewProfile: profile }),
      
      setReduceMotion: (reduce) => set({ reduceMotion: reduce }),
      
      setIsTabVisible: (visible) => set({ isTabVisible: visible }),
      
      markChannelRead: (channelId: string) => set((state) => ({
        lastReadTimestamps: { ...state.lastReadTimestamps, [channelId]: new Date().toISOString() },
        unreadCounts: { ...state.unreadCounts, [channelId]: 0 },
      })),
      
      setUnreadCount: (channelId: string, count: number) => set((state) => ({
        unreadCounts: { ...state.unreadCounts, [channelId]: count },
      })),
      
      incrementUnread: (channelId: string) => set((state) => ({
        unreadCounts: { ...state.unreadCounts, [channelId]: (state.unreadCounts[channelId] || 0) + 1 },
      })),
      
      setReactions: (messageId, reactions) => set((state) => ({
        reactions: { ...state.reactions, [messageId]: reactions },
      })),
      
      addReaction: (messageId, emoji, userId) => set((state) => {
        const currentReactions = state.reactions[messageId] || [];
        const existingReaction = currentReactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          if (existingReaction.userIds.includes(userId)) {
            return state;
          }
          return {
            ...state,
            reactions: {
              ...state.reactions,
              [messageId]: currentReactions.map(r =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, userIds: [...r.userIds, userId] }
                  : r
              ),
            },
          };
        }
        
        return {
          ...state,
          reactions: {
            ...state.reactions,
            [messageId]: [...currentReactions, { message_id: messageId, emoji, count: 1, userIds: [userId] }],
          },
        };
      }),
      
      removeReaction: (messageId, emoji, userId) => set((state) => {
        const currentReactions = state.reactions[messageId] || [];
        
        return {
          ...state,
          reactions: {
            ...state.reactions,
            [messageId]: currentReactions
              .map(r =>
                r.emoji === emoji
                  ? { ...r, count: r.count - 1, userIds: r.userIds.filter(id => id !== userId) }
                  : r
              )
              .filter(r => r.count > 0),
          },
        };
      }),
      
      setPinnedMessages: (messages) => set({ pinnedMessages: messages }),
      
      addPinnedMessage: (message) => set((state) => ({
        pinnedMessages: [...state.pinnedMessages, message],
      })),
      
      removePinnedMessage: (messageId) => set((state) => ({
        pinnedMessages: state.pinnedMessages.filter(p => p.message_id !== messageId),
      })),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setIsSearching: (searching) => set({ isSearching: searching }),
      
      setReplyTo: (message) => set({ replyTo: message }),
      
      clearReplyTo: () => set({ replyTo: null }),
      
      setNotificationSettings: (settings) => set({ notificationSettings: settings }),
      
      toggleNotificationSetting: (key) => set((state) => ({
        notificationSettings: {
          ...state.notificationSettings,
          [key]: !state.notificationSettings[key],
        },
      })),

      setShowUpdatePopup: (show) => set({ showUpdatePopup: show }),
      
      dismissUpdate: (version) => set({ 
        showUpdatePopup: false, 
        dismissedUpdateVersion: version 
      }),
      
      setShowKeyboardShortcuts: (show: boolean) => set({ showKeyboardShortcuts: show }),
      
      setChannelSequence: (channelId, sequence) => set((state) => ({
        channelSequence: { ...state.channelSequence, [channelId]: sequence }
      })),
      
      setLastEventTimestamp: (timestamp) => set({ lastEventTimestamp: timestamp }),
      
      setMessageCache: (channelId, data) => set((state) => ({
        messageCache: {
          ...state.messageCache,
          [channelId]: data,
        },
      })),
      
      addMessagesToCache: (channelId, messages, prepend = false) => set((state) => {
        const existing = state.messageCache[channelId] || { messages: [], hasMore: true, oldestMessageId: null };
        const newMessages = prepend 
          ? [...messages, ...existing.messages]
          : [...existing.messages, ...messages];
        return {
          messageCache: {
            ...state.messageCache,
            [channelId]: {
              ...existing,
              messages: newMessages,
              oldestMessageId: messages.length > 0 && prepend 
                ? messages[0].id 
                : existing.oldestMessageId,
            },
          },
        };
      }),
      
      updateMessageInCache: (channelId, messageId, updates) => set((state) => {
        const existing = state.messageCache[channelId];
        if (!existing) return state;
        return {
          messageCache: {
            ...state.messageCache,
            [channelId]: {
              ...existing,
              messages: existing.messages.map(m => 
                m.id === messageId ? { ...m, ...updates } : m
              ),
            },
          },
        };
      }),
      
      deleteMessageFromCache: (channelId, messageId) => set((state) => {
        const existing = state.messageCache[channelId];
        if (!existing) return state;
        return {
          messageCache: {
            ...state.messageCache,
            [channelId]: {
              ...existing,
              messages: existing.messages.filter(m => m.id !== messageId),
            },
          },
        };
      }),
      
      clearMessageCache: (channelId) => set((state) => {
        const { [channelId]: _, ...rest } = state.messageCache;
        return { messageCache: rest };
      }),
      
      blockedIds: [],
      setBlockedIds: (ids) => set({ blockedIds: ids }),
      addBlockedId: (id) => set((state) => ({ 
        blockedIds: state.blockedIds.includes(id) ? state.blockedIds : [...state.blockedIds, id] 
      })),
      removeBlockedId: (id) => set((state) => ({ 
        blockedIds: state.blockedIds.filter(bid => bid !== id) 
      })),
    }),
    {
      name: 'thebasement-settings',
      partialize: (state) => ({ 
        notificationSettings: state.notificationSettings,
        activeChannel: state.activeChannel,
        reduceMotion: state.reduceMotion,
        dismissedUpdateVersion: state.dismissedUpdateVersion,
        userProfile: state.userProfile,
      }),
    }
  )
);
