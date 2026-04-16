"use client";

import { useState, useEffect } from "react";
import { X, Search as SearchIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useChatStore } from "@/store/useChatStore";

interface MobileSearchModalProps {
  onClose: () => void;
}

export function MobileSearchModal({ onClose }: MobileSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeChannel, setActiveChannel } = useChatStore();

  useEffect(() => {
    const searchMessages = async () => {
      if (!query.trim() || !activeChannel) {
        setResults([]);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select(`*, profiles(username, avatar_url)`)
        .eq("channel_id", activeChannel.id)
        .ilike("text", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      setResults(data || []);
      setLoading(false);
    };

    const debounce = setTimeout(searchMessages, 300);
    return () => clearTimeout(debounce);
  }, [query, activeChannel]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5 shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <X size={22} />
        </button>
        <div className="flex-1 bg-zinc-800/50 rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5 focus-within:border-indigo-500/30">
          <SearchIcon size={18} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent outline-none text-base text-white placeholder:text-zinc-600"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4 opacity-50">
            <SearchIcon size={48} className="text-zinc-700" />
            <p className="text-sm text-zinc-500">
              {query ? "No messages found" : "Type to search messages"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((msg) => (
              <div
                key={msg.id}
                className="p-4 bg-zinc-900/50 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer"
                onClick={() => {
                  const element = document.getElementById(`message-${msg.id}`);
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
                  <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
                    {msg.profiles?.avatar_url && (
                      <img
                        src={msg.profiles.avatar_url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">
                      {msg.profiles?.username || "Unknown"}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-2">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
