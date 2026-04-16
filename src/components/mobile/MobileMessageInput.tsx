"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useChatStore } from "@/store/useChatStore";
import { useToast } from "@/store/useToastStore";
import { useSpamProtection } from "@/hooks/useSpamProtection";

interface MobileMessageInputProps {
  channelId: string;
  userId: string;
  username: string;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onMessageSent?: () => void;
  allProfiles: any[];
}

export function MobileMessageInput({
  channelId,
  userId,
  username,
  onTyping,
  onStopTyping,
  onMessageSent,
  allProfiles,
}: MobileMessageInputProps) {
  const [input, setInput] = useState("");
  const { isRateLimited, cooldownSeconds, canSendMessage, recordMessage } = useSpamProtection();
  const { replyTo, clearReplyTo } = useChatStore();
  const toast = useToast();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      onTyping?.();
      lastTypingRef.current = now;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping?.();
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !channelId || !userId) return;

    if (!canSendMessage()) {
      return;
    }

    const text = input;

    recordMessage();
    setInput("");
    clearReplyTo();

    onMessageSent?.();

    const insertData = {
      text,
      channel_id: channelId,
      user_id: userId,
      user_name: username,
    };

    if (replyTo?.id) {
      (insertData as any).reply_to_id = replyTo.id;
    }

    const { error } = await supabase.from("messages").insert([insertData]);

    if (error) {
      console.error("Insert Error:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="px-3 shrink-0">
      {replyTo && (
        <div className="mb-2 p-3 bg-zinc-800/30 border border-white/5 rounded-xl animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-indigo-400">Replying to {replyTo.username}</span>
            <button type="button" onClick={clearReplyTo} className="p-1 text-zinc-500 hover:text-white">
              ✕
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-1 truncate">{replyTo.text}</p>
        </div>
      )}

      {isRateLimited && (
        <div className="mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 animate-fade-in">
          <Clock size={14} className="text-red-400" />
          <span className="text-xs text-red-400">Slow down! {cooldownSeconds}s</span>
        </div>
      )}

      <div className="bg-zinc-800/30 rounded-xl px-3 py-2.5 border border-white/5 focus-within:border-indigo-500/30 transition-all">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 bg-transparent w-full outline-none text-base text-zinc-100 placeholder:text-zinc-600"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 min-w-[48px] min-h-[48px] rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center active:scale-95 touch-manipulation"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </form>
  );
}
