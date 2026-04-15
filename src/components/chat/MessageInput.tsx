import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Send, AtSign, X, Clock, Reply } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useToast } from "@/store/useToastStore";
import { useSpamProtection } from "@/hooks/useSpamProtection";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";

export const MessageInput = forwardRef<{ focus: () => void }, {
  channelId: string;
  userId: string;
  allProfiles: any[];
  username: string;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onMessageSent?: () => void;
  onReplySent?: () => void;
  onMentionSent?: () => void;
  onOptimisticMessage?: (message: any) => void;
}>(function MessageInput({
  channelId,
  userId,
  allProfiles,
  username,
  onTyping,
  onStopTyping,
  onMessageSent,
  onReplySent,
  onMentionSent,
  onOptimisticMessage,
}, ref) {
  const [input, setInput] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  
  const { isRateLimited, cooldownSeconds, canSendMessage, recordMessage } = useSpamProtection();
  const [mentionSearch, setMentionSearch] = useState("");
  const { replyTo, clearReplyTo } = useChatStore();
  const toast = useToast();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

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

    const lastWord = val.split(" ").pop();
    if (lastWord?.startsWith("@")) {
      setMentionSearch(lastWord.slice(1).toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (mentionedUsername: string) => {
    const words = input.split(" ");
    words.pop();
    setInput([...words, `@${mentionedUsername} `].join(" "));
    setShowMentions(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !channelId || !userId) return;
    
    if (!canSendMessage()) {
      return; // Toast already shown by useSpamProtection
    }

    const text = input;
    const replyToId = replyTo?.id;
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();

    const optimisticMessage = {
      id: optimisticId,
      text,
      channel_id: channelId,
      user_id: userId,
      user_name: username,
      reply_to_id: replyToId,
      created_at: createdAt,
      is_optimistic: true,
      profiles: {
        id: userId,
        username: username,
        avatar_url: null,
        avatar_effect: null,
      },
      reply_to: replyToId ? { id: replyToId, text: replyTo.text, profiles: { username: replyTo.username } } : null,
    };

    onOptimisticMessage?.(optimisticMessage);

    recordMessage();
    setInput("");
    clearReplyTo();
    
    onMessageSent?.();
    if (replyToId) {
      onReplySent?.();
    }
    if (text.includes('@')) {
      onMentionSent?.();
    }

    const insertData: Record<string, string> = {
      text,
      channel_id: channelId,
      user_id: userId,
      user_name: username,
    };
    
    if (replyToId) {
      insertData.reply_to_id = replyToId;
    }

    const { error } = await supabase.from("messages").insert([insertData]);

    if (error) {
      console.error("Insert Error:", error);
      toast.error("Failed to send message");
    }
  };

  const filteredMentions = allProfiles.filter((p: any) =>
    p.username.toLowerCase().includes(mentionSearch),
  );

  return (
    <form onSubmit={handleSendMessage} className="px-3 sm:px-4 pb-4 sm:pb-4 pt-2 shrink-0 relative bg-zinc-900/50 backdrop-blur-sm border-t border-white/5">
      {showMentions && filteredMentions.length > 0 && (
        <div className="absolute bottom-full left-3 sm:left-4 mb-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden w-56 sm:w-64 z-50 animate-scale-in">
          <div className="text-[10px] sm:text-xs font-semibold text-zinc-500 p-2 border-b border-white/5 flex items-center gap-1.5">
            <AtSign size={10} /> Mention
          </div>
          <div className="max-h-48 sm:max-h-40 overflow-y-auto">
            {filteredMentions.slice(0, 5).map((p: any) => (
              <div
                key={p.id}
                onClick={() => insertMention(p.username)}
                className="flex items-center gap-2 p-3 sm:p-2 hover:bg-indigo-500/20 cursor-pointer transition-colors active:bg-indigo-500/30"
              >
                <AvatarWithEffect profile={p} size="sm" showStatus={false} />
                <span className="text-sm sm:text-xs text-zinc-300">{p.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {replyTo && (
        <div className="mb-2 p-3 sm:p-2 bg-zinc-800/30 border border-white/5 rounded-xl animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] sm:text-[10px] text-indigo-400">
              <Reply size={10} />
              <span>Replying to {replyTo.username}</span>
            </div>
            <button
              type="button"
              onClick={clearReplyTo}
              className="p-1 text-zinc-500 hover:text-white active:scale-90 transition-transform"
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{replyTo.text}</p>
        </div>
      )}

      {isRateLimited && (
        <div className="mb-2 p-3 sm:p-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 animate-fade-in">
          <Clock size={14} className="text-red-400" />
          <span className="text-xs sm:text-xs text-red-400">
            Slow down! {cooldownSeconds}s
          </span>
        </div>
      )}

      <div className="bg-zinc-800/30 rounded-xl sm:rounded-xl px-3 py-2.5 border border-white/5 focus-within:border-indigo-500/30 transition-all">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent w-full outline-none text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 sm:p-1.5 min-w-[48px] min-h-[48px] sm:min-w-[auto] sm:min-h-[auto] rounded-xl sm:rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center active:scale-95 touch-manipulation"
          >
            <Send size={20} className="sm:hidden" />
            <Send size={14} className="hidden sm:block" />
          </button>
        </div>
      </div>
    </form>
  );
});
