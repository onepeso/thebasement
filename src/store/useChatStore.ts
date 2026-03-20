import { create } from 'zustand';

interface Channel {
  id: string;
  name: string;
  slug: string;
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

interface ChatStore {
  channels: Channel[];
  activeChannel: Channel | null;
  layoutMode: 'standard' | 'iphone';
  showSettings: boolean;
  lastReadTimestamp: string;
  
  reactions: Record<string, Reaction[]>;
  pinnedMessages: PinnedMessage[];
  searchQuery: string;
  isSearching: boolean;
  replyTo: ReplyMessage | null;
  
  setChannels: (channels: Channel[]) => void;
  setActiveChannel: (channel: Channel | null) => void;
  setLayoutMode: (mode: 'standard' | 'iphone') => void;
  setShowSettings: (show: boolean) => void;
  setLastReadTimestamp: (timestamp: string) => void;
  updateLastReadToNow: () => void;
  
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
}

export const useChatStore = create<ChatStore>((set) => ({
  channels: [],
  activeChannel: null,
  layoutMode: 'standard',
  showSettings: false,
  lastReadTimestamp: new Date().toISOString(),
  
  reactions: {},
  pinnedMessages: [],
  searchQuery: '',
  isSearching: false,
  replyTo: null,

  setChannels: (channels) => set({ channels }),
  
  setActiveChannel: (channel) => set({ 
    activeChannel: channel,
    lastReadTimestamp: new Date().toISOString(),
    replyTo: null,
    searchQuery: '',
    isSearching: false,
    reactions: {},
    pinnedMessages: [],
  }),
  
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  
  setShowSettings: (show) => set({ showSettings: show }),
  
  setLastReadTimestamp: (timestamp) => set({ lastReadTimestamp: timestamp }),
  
  updateLastReadToNow: () => set({ lastReadTimestamp: new Date().toISOString() }),
  
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
}));
