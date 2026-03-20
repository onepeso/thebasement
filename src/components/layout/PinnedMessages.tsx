"use client";

import { useChatStore } from "@/store/useChatStore";
import { Pin } from "lucide-react";

interface PinnedMessagesProps {
  onJumpToMessage: (messageId: string) => void;
}

export function PinnedMessages({ onJumpToMessage }: PinnedMessagesProps) {
  const { pinnedMessages } = useChatStore();

  if (pinnedMessages.length === 0) {
    return (
      <div className="border-t border-white/5">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Pin size={14} className="text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Pinned Messages
            </span>
          </div>
          <p className="text-xs text-zinc-600 text-center py-4">
            No pinned messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-white/5">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Pin size={14} className="text-indigo-400" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Pinned Messages ({pinnedMessages.length})
          </span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {pinnedMessages.map((pinned) => {
            const msg = pinned.message as { text?: string; profiles?: { username?: string } } | null;
            return (
              <div
                key={pinned.id}
                className="group p-2 bg-zinc-800/30 hover:bg-zinc-800/60 border border-white/5 hover:border-white/10 rounded-lg cursor-pointer transition-all"
                onClick={() => onJumpToMessage(pinned.message_id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-indigo-400 truncate">
                    {msg?.profiles?.username || 'Unknown'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-snug">
                  {msg?.text || 'Message not found'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
