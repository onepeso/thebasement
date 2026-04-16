"use client";

import { useState, useRef } from "react";
import { Pin, PinOff, Smile, MoreHorizontal, Reply } from "lucide-react";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";
import { getUsernameStyle, getTextColor } from "@/utils/fontStyles";

interface MobileMessageItemProps {
  msg: any;
  isMe: boolean;
  reactions: any[];
  onToggleReaction: (msgId: string, emoji: string) => void;
  onPin: (msgId: string) => void;
  onUnpin?: (msgId: string) => void;
  isPinned: boolean;
  onReply?: (msg: any) => void;
  allProfiles?: any[];
}

export function MobileMessageItem({
  msg,
  isMe,
  reactions,
  onToggleReaction,
  isPinned,
  onReply,
  allProfiles = [],
}: MobileMessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleTouchStart = () => {
    holdTimer.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  return (
    <div className="flex items-start gap-3 px-3 py-2 hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors group">
      {/* Avatar */}
      <div className="shrink-0 w-10">
        <AvatarWithEffect profile={msg.profiles} size="md" showStatus={false} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="font-semibold text-[13px]"
            style={{
              ...getUsernameStyle(msg.profiles?.font_style),
              color: getTextColor(msg.profiles?.text_color),
            }}
          >
            {msg.profiles?.username || "Unknown"}
          </span>
          <span className="text-[10px] text-zinc-600">{formatTime(msg.created_at)}</span>
          {isPinned && <Pin size={10} className="text-indigo-400" />}
        </div>

        {/* Reply */}
        {msg.reply_to_id && msg.reply_to && (
          <div className="mb-1 flex items-center gap-1.5">
            <Reply size={10} className="text-indigo-400" />
            <span className="text-[10px] text-indigo-400">{msg.reply_to.profiles?.username}: </span>
            <span className="text-[10px] text-zinc-500 truncate">{msg.reply_to.text}</span>
          </div>
        )}

        {/* Message */}
        <p className="text-[14px] leading-relaxed text-zinc-300 break-words whitespace-pre-wrap">
          {msg.text}
        </p>

        {/* Reactions */}
        {reactions && reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {reactions.map((r: any) => (
              <button
                key={r.emoji}
                onClick={() => onToggleReaction(msg.id, r.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                  r.userIds?.includes(msg.user_id)
                    ? "bg-indigo-500/20 border-indigo-500/40"
                    : "bg-zinc-800/50 border-white/10 hover:border-white/20"
                }`}
              >
                <span>{r.emoji}</span>
                <span className="text-zinc-400">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onToggleReaction(msg.id, "👍")}
          className="p-2 rounded-lg text-zinc-500 hover:text-yellow-400 hover:bg-white/5 transition-all"
        >
          <Smile size={16} />
        </button>
        <button
          onClick={() => setShowActions(true)}
          className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Action Sheet */}
      {showActions && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end"
          onClick={() => setShowActions(false)}
        >
          <div
            className="w-full bg-zinc-900/95 border-t border-white/10 rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <div className="space-y-2">
              {onReply && (
                <button
                  onClick={() => {
                    onReply(msg);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 text-sm text-indigo-400 bg-zinc-800/50 rounded-xl active:bg-zinc-800"
                >
                  <Reply size={18} />
                  Reply
                </button>
              )}
              <button
                onClick={() => {
                  onToggleReaction(msg.id, "👍");
                  setShowActions(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 text-sm text-yellow-400 bg-zinc-800/50 rounded-xl active:bg-zinc-800"
              >
                <Smile size={18} />
                React
              </button>
              <button
                onClick={() => {
                  isPinned ? null : null; // handle unpin
                  setShowActions(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 text-sm text-zinc-400 bg-zinc-800/50 rounded-xl active:bg-zinc-800"
              >
                {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
                {isPinned ? "Unpin" : "Pin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
