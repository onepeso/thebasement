"use client";

import { useState } from 'react';
import { X, Bell, UserPlus, Hash, Trophy, ChevronRight } from 'lucide-react';

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
        return <UserPlus size={14} className="text-indigo-400" />;
      case 'joined':
        return <Hash size={14} className="text-emerald-400" />;
      case 'left':
        return <Hash size={14} className="text-red-400" />;
      case 'challenge':
        return <Trophy size={14} className="text-amber-400" />;
      default:
        return <Bell size={14} className="text-zinc-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = activeTab === 'invites'
    ? notifications.filter(n => n.type === 'invite')
    : notifications;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-start justify-end p-4 pt-16 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm animate-scale-in max-h-[65vh] flex flex-col">
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Bell size={14} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-[9px] text-indigo-400">{unreadCount} unread</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-1"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex gap-1 px-4 py-2 border-b border-white/5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded text-[10px] font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-3 py-1.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'invites'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UserPlus size={10} />
              Invites
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredNotifications.length === 0 && (
              <div className="text-center py-8">
                <Bell size={24} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500">
                  {activeTab === 'invites' ? 'No pending invites' : 'No notifications'}
                </p>
              </div>
            )}

            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  !notification.read ? 'bg-indigo-500/5' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white">
                      {notification.title}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {notification.message}
                    </p>
                    <p className="text-[9px] text-zinc-600 mt-0.5">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                </div>

                {notification.type === 'invite' && (
                  <div className="flex gap-2 mt-2 ml-10">
                    <button
                      onClick={() => onDeclineInvite?.(notification.id)}
                      className="flex-1 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-medium rounded-lg transition-colors"
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
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium rounded-lg transition-colors"
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
