import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/lib/supabase";
import { Send, AtSign, X, Clock } from "lucide-react";
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onStopTyping?.();

    const insertData: Record<string, string> = {
      text: input,
      channel_id: channelId,
      user_id: userId,
      user_name: username,
    };
    
    if (replyTo?.id) {
      insertData.reply_to_id = replyTo.id;
    }

    const { error } = await supabase.from("messages").insert([insertData]);

    if (error) {
      console.error("Insert Error:", error);
      toast.error("Failed to send message");
    } else {
      recordMessage();
      setInput("");
      clearReplyTo();
      
      onMessageSent?.();
      if (replyTo?.id) {
        onReplySent?.();
      }
      if (input.includes('@')) {
        onMentionSent?.();
      }
    }
  };

  const filteredMentions = allProfiles.filter((p: any) =>
    p.username.toLowerCase().includes(mentionSearch),
  );

  return (
    <form onSubmit={handleSendMessage} className="px-4 pb-4 shrink-0 relative">
      {showMentions && filteredMentions.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden w-56 z-50 animate-scale-in">
          <div className="text-[10px] font-bold text-zinc-500 p-2.5 border-b border-white/5 uppercase bg-black/20 tracking-widest flex items-center gap-2">
            <AtSign size={10} /> Mention User
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredMentions.map((p: any) => (
              <div
                key={p.id}
                onClick={() => insertMention(p.username)}
                className="flex items-center gap-2.5 p-2.5 hover:bg-indigo-600/80 cursor-pointer transition-all group"
              >
                <AvatarWithEffect profile={p} size="sm" showStatus={false} />
                <span className="text-xs font-semibold text-zinc-300 group-hover:text-white">
                  {p.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {replyTo && (
        <div className="mb-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <p className="text-sm text-zinc-400/80 line-clamp-2 leading-relaxed pl-7">
              {replyTo.text}
            </p>
          </div>
          <button
            type="button"
            onClick={clearReplyTo}
            className="shrink-0 p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {isRateLimited && (
        <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 animate-fade-in">
          <Clock size={14} className="text-red-400" />
          <span className="text-xs font-medium text-red-400">
            Slow down! You can send again in {cooldownSeconds} seconds
          </span>
        </div>
      )}

      <div className="bg-zinc-800/50 rounded-2xl px-4 py-3 border border-white/5 focus-within:border-indigo-500/50 focus-within:bg-zinc-800/70 transition-all shadow-inner">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent w-full outline-none text-sm text-zinc-100 placeholder-zinc-600"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </form>
  );
});
