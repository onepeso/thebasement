"use client";

import { useState } from 'react';
import { X, Bell, UserPlus, Hash, Trophy, MessageSquare, ChevronRight } from 'lucide-react';
import { AvatarWithEffect } from '@/components/ui/AvatarWithEffect';

interface Notification {
  id: string;
  type: 'invite' | 'joined' | 'left' | 'challenge';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: {
    channelId?: string;
    channelName?: string;
    inviterName?: string;
    inviterAvatar?: string;
    challengeTitle?: string;
  };
}

interface NotificationModalProps {
  open: boolean;
  notifications: Notification[];
  onClose: () => void;
  onAcceptInvite?: (inviteId: string) => void;
  onDeclineInvite?: (inviteId: string) => void;
  onViewChannel?: (channelId: string) => void;
  onClearAll?: () => void;
}

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

export function NotificationModal({
  open,
  notifications,
  onClose,
  onAcceptInvite,
  onDeclineInvite,
  onViewChannel,
  onClearAll,
}: NotificationModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'invites'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invite':
        return <UserPlus size={16} className="text-indigo-400" />;
      case 'joined':
        return <Hash size={16} className="text-emerald-400" />;
      case 'left':
        return <Hash size={16} className="text-red-400" />;
      case 'challenge':
        return <Trophy size={16} className="text-amber-400" />;
      default:
        return <Bell size={16} className="text-zinc-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = activeTab === 'invites'
    ? notifications.filter(n => n.type === 'invite')
    : notifications;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-start justify-end p-4 pt-20 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm animate-scale-in max-h-[70vh] flex flex-col">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-xl" />

        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Bell size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-indigo-400">{unreadCount} unread</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'invites'
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <UserPlus size={12} />
                Invites
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell size={32} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">
                  {activeTab === 'invites' ? 'No pending invites' : 'No notifications'}
                </p>
              </div>
            )}

            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  !notification.read ? 'bg-indigo-500/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white mb-0.5">
                      {notification.title}
                    </p>
                    <p className="text-xs text-zinc-400 mb-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 shrink-0 mt-1" />
                </div>

                {notification.type === 'invite' && (
                  <div className="flex gap-2 mt-3 ml-13">
                    <button
                      onClick={() => onDeclineInvite?.(notification.id)}
                      className="flex-1 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => {
                        onAcceptInvite?.(notification.id);
                        if (notification.data?.channelId) {
                          onViewChannel?.(notification.data.channelId);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
