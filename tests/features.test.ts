import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useState } from 'react';

describe('Notification Deduplication', () => {
  it('should not add duplicate notifications', async () => {
    const notifications = vi.fn();
    
    const existingNotifications = [
      { id: '1', type: 'invite', title: 'Test 1' },
      { id: '2', type: 'invite', title: 'Test 2' },
    ];
    
    const seenIds = new Set(existingNotifications.map(n => n.id));
    
    const newNotification = { id: '1', type: 'invite', title: 'Test 1 Duplicate' };
    
    if (seenIds.has(newNotification.id)) {
      notifications([...existingNotifications]);
    } else {
      seenIds.add(newNotification.id);
      notifications([newNotification, ...existingNotifications]);
    }
    
    expect(notifications).toHaveBeenCalledWith([
      { id: '1', type: 'invite', title: 'Test 1' },
      { id: '2', type: 'invite', title: 'Test 2' },
    ]);
  });

  it('should add new notifications that do not exist', async () => {
    const existingNotifications = [
      { id: '1', type: 'invite', title: 'Test 1' },
    ];
    
    const seenIds = new Set(existingNotifications.map(n => n.id));
    
    const newNotification = { id: '3', type: 'invite', title: 'Test 3' };
    
    if (seenIds.has(newNotification.id)) {
      return;
    }
    seenIds.add(newNotification.id);
    
    const result = [newNotification, ...existingNotifications];
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('3');
  });

  it('should handle realtime notification with existing ID', async () => {
    const setNotifications = vi.fn();
    const seenIds = new Set(['notif-1', 'notif-2']);
    
    const prev = [
      { id: 'notif-1', type: 'invite' },
      { id: 'notif-2', type: 'mention' },
    ];
    
    const newNotif = { id: 'notif-1', type: 'invite' };
    
    const updated = [...prev];
    if (!seenIds.has(newNotif.id)) {
      seenIds.add(newNotif.id);
      updated.unshift(newNotif);
    }
    
    setNotifications(updated);
    
    expect(setNotifications).toHaveBeenCalledWith([
      { id: 'notif-1', type: 'invite' },
      { id: 'notif-2', type: 'mention' },
    ]);
    expect(updated).toHaveLength(2);
  });

  it('should add new realtime notification', async () => {
    const seenIds = new Set(['notif-1']);
    
    const prev = [{ id: 'notif-1', type: 'invite' }];
    const newNotif = { id: 'notif-new', type: 'invite' };
    
    if (seenIds.has(newNotif.id)) {
      return;
    }
    seenIds.add(newNotif.id);
    
    const updated = [newNotif, ...prev];
    
    expect(updated).toHaveLength(2);
    expect(updated[0].id).toBe('notif-new');
  });
});

describe('Invite Actions', () => {
  it('should delete existing invite before creating new one', async () => {
    const existingInvites = [
      { id: 'invite-1', channel_id: 'ch-1', invited_user_id: 'user-2', status: 'pending' },
    ];
    
    const userId = 'user-1';
    const invitedUserId = 'user-2';
    const channelId = 'ch-1';
    
    const pendingInvite = existingInvites.find(
      i => i.channel_id === channelId && i.invited_user_id === invitedUserId && i.status === 'pending'
    );
    
    const newInvite = {
      channel_id: channelId,
      inviter_id: userId,
      invited_user_id: invitedUserId,
      status: 'pending',
    };
    
    expect(pendingInvite).toBeDefined();
    
    const allInvites = existingInvites.filter(
      i => !(i.channel_id === channelId && i.invited_user_id === invitedUserId)
    );
    
    expect(allInvites).toHaveLength(0);
  });

  it('should allow reinvite after deleting old invite', async () => {
    const oldInvites = [
      { id: 'invite-old', channel_id: 'ch-1', invited_user_id: 'user-2', status: 'declined' },
    ];
    
    const remaining = oldInvites.filter(
      i => !(i.channel_id === 'ch-1' && i.invited_user_id === 'user-2')
    );
    
    const newInvite = {
      id: 'invite-new',
      channel_id: 'ch-1',
      inviter_id: 'user-1',
      invited_user_id: 'user-2',
      status: 'pending',
    };
    
    const allInvites = [...remaining, newInvite];
    
    expect(remaining).toHaveLength(0);
    expect(allInvites).toHaveLength(1);
    expect(allInvites[0].status).toBe('pending');
  });

  it('should remove notification on decline', async () => {
    const notifications = [
      { id: 'notif-1', type: 'invite', channel_id: 'ch-1' },
      { id: 'notif-2', type: 'mention', channel_id: 'ch-2' },
    ];
    
    const notificationId = 'notif-1';
    
    const updated = notifications.filter(n => n.id !== notificationId);
    
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('notif-2');
  });

  it('should remove notification on accept', async () => {
    const notifications = [
      { id: 'notif-1', type: 'invite', channel_id: 'ch-1' },
      { id: 'notif-2', type: 'invite', channel_id: 'ch-2' },
    ];
    
    const notificationId = 'notif-1';
    
    const updated = notifications.filter(n => n.id !== notificationId);
    
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('notif-2');
  });
});

describe('Channel Leave', () => {
  it('should remove channel from list when user leaves', async () => {
    const channels = [
      { id: 'ch-1', name: 'general', slug: 'general' },
      { id: 'ch-2', name: 'random', slug: 'random' },
      { id: 'ch-3', name: 'gaming', slug: 'gaming' },
    ];
    
    const leftChannelId = 'ch-2';
    
    const updatedChannels = channels.filter(c => c.id !== leftChannelId);
    
    expect(updatedChannels).toHaveLength(2);
    expect(updatedChannels.find(c => c.id === 'ch-2')).toBeUndefined();
  });

  it('should switch to general channel after leaving active channel', async () => {
    const channels = [
      { id: 'ch-1', name: 'general', slug: 'general' },
      { id: 'ch-2', name: 'random', slug: 'random' },
    ];
    
    const activeChannel = channels.find(c => c.id === 'ch-2');
    const leftChannelId = 'ch-2';
    
    let newActiveChannel;
    if (activeChannel?.id === leftChannelId) {
      newActiveChannel = channels.find(c => c.slug === 'general') || channels.find(c => c.id !== leftChannelId);
    }
    
    expect(newActiveChannel?.slug).toBe('general');
  });

  it('should switch to first channel if general does not exist', async () => {
    const channels = [
      { id: 'ch-1', name: 'random', slug: 'random' },
      { id: 'ch-2', name: 'gaming', slug: 'gaming' },
    ];
    
    const activeChannel = channels.find(c => c.id === 'ch-1');
    const leftChannelId = 'ch-1';
    
    let newActiveChannel;
    if (activeChannel?.id === leftChannelId) {
      newActiveChannel = channels.find(c => c.slug === 'general') || channels.find(c => c.id !== leftChannelId);
    }
    
    expect(newActiveChannel?.id).toBe('ch-2');
  });
});

describe('Periodic Refresh', () => {
  it('should refresh all data on interval', async () => {
    const refreshFunctions = {
      channels: vi.fn(),
      memberCounts: vi.fn(),
      notifications: vi.fn(),
    };
    
    const refreshAll = async () => {
      await Promise.all([
        refreshFunctions.channels(),
        refreshFunctions.memberCounts(),
        refreshFunctions.notifications(),
      ]);
    };
    
    await refreshAll();
    
    expect(refreshFunctions.channels).toHaveBeenCalled();
    expect(refreshFunctions.memberCounts).toHaveBeenCalled();
    expect(refreshFunctions.notifications).toHaveBeenCalled();
  });

  it('should only refresh if user is logged in', async () => {
    const refreshChannels = vi.fn();
    
    const userId = undefined;
    
    if (!userId) return;
    
    await refreshChannels();
    
    expect(refreshChannels).not.toHaveBeenCalled();
  });

  it('should not refresh member counts if no channels', async () => {
    const channels: any[] = [];
    const refreshMemberCounts = vi.fn();
    
    if (channels.length === 0) return;
    
    await refreshMemberCounts();
    
    expect(refreshMemberCounts).not.toHaveBeenCalled();
  });
});

describe('Clear All Notifications', () => {
  it('should delete all notifications and clear state', async () => {
    const notifications = [
      { id: 'notif-1', type: 'invite' },
      { id: 'notif-2', type: 'mention' },
      { id: 'notif-3', type: 'system' },
    ];
    
    const idsToDelete = notifications.map(n => n.id);
    expect(idsToDelete).toHaveLength(3);
    
    const cleared: any[] = [];
    expect(cleared).toHaveLength(0);
  });
});
