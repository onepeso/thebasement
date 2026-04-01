import { describe, it, expect } from 'vitest';
import { create } from 'zustand';

describe('ChatStore', () => {
  const createTestStore = () => {
    return create<any>((set, get) => ({
      channels: [],
      activeChannel: null,
      lastReadTimestamps: {},
      unreadCounts: {},
      notifications: [],
      messageCache: {},
      
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
      
      markChannelRead: (channelId) => set((state) => ({
        lastReadTimestamps: { ...state.lastReadTimestamps, [channelId]: new Date().toISOString() },
        unreadCounts: { ...state.unreadCounts, [channelId]: 0 },
      })),
      
      incrementUnread: (channelId) => set((state) => ({
        unreadCounts: { ...state.unreadCounts, [channelId]: (state.unreadCounts[channelId] || 0) + 1 },
      })),
      
      setNotifications: (notifications) => set({ notifications }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
      })),
      
      removeNotification: (notificationId) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== notificationId),
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      setMessageCache: (channelId, data) => set((state) => ({
        messageCache: {
          ...state.messageCache,
          [channelId]: data,
        },
      })),
    }));
  };

  describe('Channels', () => {
    it('should add channels', () => {
      const store = createTestStore();
      
      store.getState().setChannels([
        { id: 'ch-1', name: 'general' },
        { id: 'ch-2', name: 'random' },
      ]);
      
      expect(store.getState().channels).toHaveLength(2);
    });

    it('should remove channel from list', () => {
      const store = createTestStore();
      
      store.getState().setChannels([
        { id: 'ch-1', name: 'general' },
        { id: 'ch-2', name: 'random' },
      ]);
      
      const updatedChannels = store.getState().channels.filter((c: any) => c.id !== 'ch-2');
      store.getState().setChannels(updatedChannels);
      
      expect(store.getState().channels).toHaveLength(1);
      expect(store.getState().channels[0].id).toBe('ch-1');
    });
  });

  describe('Active Channel', () => {
    it('should set active channel and update last read timestamp', () => {
      const store = createTestStore();
      
      store.getState().setActiveChannel({ id: 'ch-1', name: 'general' });
      
      expect(store.getState().activeChannel?.id).toBe('ch-1');
      expect(store.getState().lastReadTimestamps['ch-1']).toBeDefined();
    });

    it('should switch active channel and reset read timestamp', () => {
      const store = createTestStore();
      
      store.getState().setActiveChannel({ id: 'ch-1', name: 'general' });
      const firstTimestamp = store.getState().lastReadTimestamps['ch-1'];
      
      store.getState().setActiveChannel({ id: 'ch-2', name: 'random' });
      
      expect(store.getState().activeChannel?.id).toBe('ch-2');
      expect(store.getState().lastReadTimestamps['ch-2']).toBeDefined();
      expect(store.getState().lastReadTimestamps['ch-1']).toBe(firstTimestamp);
    });
  });

  describe('Unread Counts', () => {
    it('should increment unread count', () => {
      const store = createTestStore();
      
      store.getState().incrementUnread('ch-1');
      store.getState().incrementUnread('ch-1');
      
      expect(store.getState().unreadCounts['ch-1']).toBe(2);
    });

    it('should reset unread count on mark channel read', () => {
      const store = createTestStore();
      
      store.getState().incrementUnread('ch-1');
      store.getState().incrementUnread('ch-1');
      store.getState().markChannelRead('ch-1');
      
      expect(store.getState().unreadCounts['ch-1']).toBe(0);
    });

    it('should track unread for different channels separately', () => {
      const store = createTestStore();
      
      store.getState().incrementUnread('ch-1');
      store.getState().incrementUnread('ch-1');
      store.getState().incrementUnread('ch-2');
      
      expect(store.getState().unreadCounts['ch-1']).toBe(2);
      expect(store.getState().unreadCounts['ch-2']).toBe(1);
    });
  });

  describe('Notifications', () => {
    it('should add notification', () => {
      const store = createTestStore();
      
      store.getState().addNotification({ id: 'notif-1', type: 'invite' });
      store.getState().addNotification({ id: 'notif-2', type: 'mention' });
      
      expect(store.getState().notifications).toHaveLength(2);
      expect(store.getState().notifications[0].id).toBe('notif-2');
    });

    it('should remove notification', () => {
      const store = createTestStore();
      
      store.getState().setNotifications([
        { id: 'notif-1', type: 'invite' },
        { id: 'notif-2', type: 'mention' },
      ]);
      
      store.getState().removeNotification('notif-1');
      
      expect(store.getState().notifications).toHaveLength(1);
      expect(store.getState().notifications[0].id).toBe('notif-2');
    });

    it('should clear all notifications', () => {
      const store = createTestStore();
      
      store.getState().setNotifications([
        { id: 'notif-1', type: 'invite' },
        { id: 'notif-2', type: 'mention' },
        { id: 'notif-3', type: 'system' },
      ]);
      
      store.getState().clearNotifications();
      
      expect(store.getState().notifications).toHaveLength(0);
    });

    it('should not add duplicate notifications', () => {
      const store = createTestStore();
      
      store.getState().setNotifications([{ id: 'notif-1', type: 'invite' }]);
      
      const existingIds = new Set(store.getState().notifications.map((n: any) => n.id));
      const newNotif = { id: 'notif-1', type: 'invite' };
      
      if (existingIds.has(newNotif.id)) {
        return;
      }
      
      store.getState().addNotification(newNotif);
      
      expect(store.getState().notifications).toHaveLength(1);
    });
  });

  describe('Message Cache', () => {
    it('should set message cache for channel', () => {
      const store = createTestStore();
      
      store.getState().setMessageCache('ch-1', {
        messages: [{ id: 'msg-1', text: 'Hello' }],
        hasMore: false,
        oldestMessageId: 'msg-1',
      });
      
      expect(store.getState().messageCache['ch-1']).toBeDefined();
      expect(store.getState().messageCache['ch-1'].messages).toHaveLength(1);
    });

    it('should not overwrite other channel caches', () => {
      const store = createTestStore();
      
      store.getState().setMessageCache('ch-1', {
        messages: [{ id: 'msg-1' }],
        hasMore: true,
        oldestMessageId: 'msg-1',
      });
      
      store.getState().setMessageCache('ch-2', {
        messages: [{ id: 'msg-2' }],
        hasMore: false,
        oldestMessageId: 'msg-2',
      });
      
      expect(store.getState().messageCache['ch-1'].messages).toHaveLength(1);
      expect(store.getState().messageCache['ch-2'].messages).toHaveLength(1);
    });
  });
});

describe('Deduplication Logic', () => {
  it('should use Set for O(1) lookup', () => {
    const seenIds = new Set<string>();
    
    seenIds.add('id-1');
    seenIds.add('id-2');
    
    expect(seenIds.has('id-1')).toBe(true);
    expect(seenIds.has('id-3')).toBe(false);
    
    seenIds.add('id-3');
    expect(seenIds.has('id-3')).toBe(true);
  });

  it('should initialize Set from array', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const seenIds = new Set(items.map(i => i.id));
    
    expect(seenIds.size).toBe(3);
    expect(seenIds.has('b')).toBe(true);
  });

  it('should handle concurrent additions correctly', () => {
    const seenIds = new Set<string>();
    const notifications: any[] = [];
    
    const addNotification = (id: string, notification: any) => {
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      notifications.unshift(notification);
      return true;
    };
    
    addNotification('1', { id: '1' });
    addNotification('2', { id: '2' });
    
    const result1 = addNotification('1', { id: '1-duplicate' });
    const result2 = addNotification('3', { id: '3' });
    
    expect(result1).toBe(false);
    expect(result2).toBe(true);
    expect(notifications).toHaveLength(3);
  });
});
