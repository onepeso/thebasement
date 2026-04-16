"use client";

import { X, Pin } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useAuth } from "@/hooks/useAuth";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";
import { getUsernameStyle, getTextColor } from "@/utils/fontStyles";

interface MobilePinnedMessagesProps {
  onClose: () => void;
}

export function MobilePinnedMessages({ onClose }: MobilePinnedMessagesProps) {
  const { pinnedMessages } = useChatStore();
  const { allProfiles } = useAuth();

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Pin size={18} className="text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Pinned Messages</h2>
          <span className="text-xs text-zinc-500">({pinnedMessages.length})</span>
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
        {pinnedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4 opacity-50">
            <Pin size={48} className="text-zinc-700" />
            <p className="text-sm text-zinc-500">No pinned messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pinnedMessages.map((pinned) => {
              const msg = pinned.message as any;
              return (
                <div
                  key={pinned.id}
                  className="p-4 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                  onClick={() => {
                    const element = document.getElementById(`message-${pinned.message_id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "center" });
                      element.classList.add("ring-2", "ring-indigo-500", "ring-offset-2", "ring-offset-zinc-950");
                      setTimeout(() => {
                        element.classList.remove("ring-2", "ring-indigo-500", "ring-offset-2", "ring-offset-zinc-950");
                      }, 2000);
                    }
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {msg?.profiles && (
                      <AvatarWithEffect profile={msg.profiles} size="sm" showStatus={false} />
                    )}
                    <div className="flex-1">
                      <span
                        className="text-sm font-medium"
                        style={{
                          ...getUsernameStyle(msg?.profiles?.font_style),
                          color: getTextColor(msg?.profiles?.text_color),
                        }}
                      >
                        {msg?.profiles?.username || "Unknown"}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatTime(msg?.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2">{msg?.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
