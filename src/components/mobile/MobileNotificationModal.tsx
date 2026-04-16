"use client";

import { useState } from "react";
import { X, Bell, UserPlus, MessageSquare, AtSign } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title?: string;
  message?: string;
  body?: string;
  created_at: string;
  inviter?: {
    username: string;
    avatar_url?: string;
  };
  channel?: {
    name: string;
  };
}

interface MobileNotificationModalProps {
  notifications: Notification[];
  onClose: () => void;
  onAcceptInvite: (id: string) => void;
  onDeclineInvite: (id: string) => void;
}

export function MobileNotificationModal({
  notifications,
  onClose,
  onAcceptInvite,
  onDeclineInvite,
}: MobileNotificationModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "invite":
        return <UserPlus size={18} className="text-indigo-400" />;
      case "mention":
        return <AtSign size={18} className="text-yellow-400" />;
      case "reply":
        return <MessageSquare size={18} className="text-emerald-400" />;
      default:
        return <Bell size={18} className="text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Notifications</h2>
          {notifications.length > 0 && (
            <span className="text-xs text-zinc-500">({notifications.length})</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <X size={22} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4 opacity-50">
            <Bell size={48} className="text-zinc-700" />
            <p className="text-sm text-zinc-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-colors ${
                  expandedId === notif.id
                    ? "bg-zinc-800/50 border-white/10"
                    : "bg-zinc-900/50 border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    {notif.inviter?.avatar_url ? (
                      <img
                        src={notif.inviter.avatar_url}
                        className="w-full h-full rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      getIcon(notif.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{notif.title || notif.message || notif.body}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {notif.inviter?.username && `From @${notif.inviter.username}`}
                      {notif.channel?.name && ` in #${notif.channel.name}`}
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0">
                    {formatTime(notif.created_at)}
                  </span>
                </div>

                {notif.type === "invite" && (
                  <div className="flex gap-2 mt-3 ml-13">
                    <button
                      onClick={() => onAcceptInvite(notif.id)}
                      className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onDeclineInvite(notif.id)}
                      className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
