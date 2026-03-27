import { memo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, Smile, Pin, PinOff, Reply } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";

function MessageItemInner({
  msg,
  isMe,
  onDelete,
  showNewDivider,
  isGrouped,
  reactions,
  onToggleReaction,
  onReactionClick,
  onPin,
  onUnpin,
  isPinned,
  onReply,
  searchQuery,
  myUsername,
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);
  
  const isMentioned = myUsername && !isMe && msg.text.includes(`@${myUsername}`);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    await supabase.from("messages").update({ text: editText }).eq("id", msg.id);
    setIsEditing(false);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-300 rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  return (
    <div className="flex flex-col w-full group animate-fade-in">
      {showNewDivider && (
        <div
          id="new-messages-start"
          className="flex items-center my-10 px-8 pointer-events-none"
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
          <span className="mx-6 text-[9px] font-black text-red-400 uppercase tracking-[0.4em]">
            New Messages
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
        </div>
      )}

      <div
        className={`relative flex items-start transition-all duration-200 ${
          isMentioned
            ? `px-6 ${isGrouped ? "py-0.5" : "py-3 mt-1"} bg-gradient-to-r from-indigo-500/[0.03] to-transparent`
            : `px-6 ${isGrouped ? "py-0.5" : "py-3 mt-1"} hover:bg-white/[0.02]`
        }`}
      >
        <div className="shrink-0 flex justify-center mr-4 w-10">
          {!isGrouped ? (
            <AvatarWithEffect
              profile={msg.profiles}
              size="lg"
              showStatus={false}
              onClick={() => msg.profiles && useChatStore.getState().setViewProfile(msg.profiles)}
            />
          ) : (
            <div className="w-10" />
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          {!isGrouped && (
            <div className="flex items-center gap-2 mb-1 group/name">
              <span
                className={`font-semibold tracking-tight cursor-pointer hover:underline ${isMe ? "text-emerald-400 text-[13px]" : "text-indigo-400 text-[13px]"}`}
                title={formatFullDate(msg.created_at)}
                onClick={() => msg.profiles && useChatStore.getState().setViewProfile(msg.profiles)}
              >
                {msg.profiles?.username}
              </span>
            </div>
          )}

          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {msg.reply_to_id && msg.reply_to && (
                <div className="mb-2 relative pl-3 py-1.5 border-l-2 border-indigo-500/60 bg-gradient-to-r from-indigo-500/5 to-transparent rounded-r-md">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400 tracking-wide">
                      {msg.reply_to.profiles?.username || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400/80 line-clamp-2 leading-relaxed pl-7">
                    {msg.reply_to.text}
                  </p>
                </div>
              )}

              <div
                className={`group/bubble relative ${
                  isEditing
                    ? "px-4 py-3 bg-zinc-800/90 border border-white/10 rounded-lg text-[14px] leading-relaxed text-zinc-300"
                    : "text-[14px] leading-relaxed text-zinc-300"
                }`}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      autoFocus
                      className="w-full bg-transparent outline-none text-sm text-white placeholder:text-zinc-500 resize-none"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="flex items-center gap-3 text-[9px] font-medium uppercase">
                      <button
                        onClick={saveEdit}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="break-words whitespace-pre-wrap select-text leading-snug">
                    {highlightText(msg.text, searchQuery)}
                  </span>
                )}
              </div>

              {reactions && reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {reactions.map((r: any) => (
                    <button
                      key={r.emoji}
                      onClick={() => onToggleReaction(msg.id, r.emoji)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                        r.userIds?.includes(msg.user_id)
                          ? 'bg-indigo-500/20 border-indigo-500/40'
                          : 'bg-zinc-800/50 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span className="text-zinc-400">{r.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isEditing && (
              <div className="relative flex flex-row items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                <button
                  onClick={() => onReactionClick && onReactionClick(msg)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all"
                  title="Add reaction"
                >
                  <Smile size={14} />
                </button>
                <button
                  onClick={() => onReply(msg)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all"
                  title="Reply"
                >
                  <Reply size={14} />
                </button>
                <button
                  onClick={() => isPinned ? onUnpin(msg.id) : onPin(msg.id)}
                  className={`p-1.5 rounded-lg transition-all ${
                    isPinned 
                      ? 'text-indigo-400 bg-indigo-400/10' 
                      : 'text-zinc-600 hover:text-indigo-400 hover:bg-indigo-400/10'
                  }`}
                  title={isPinned ? "Unpin" : "Pin"}
                >
                  {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                </button>
                {isMe && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(msg.id)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            )}

            <span className="text-[9px] font-medium text-zinc-600/30 uppercase tabular-nums shrink-0 self-center ml-2" title={formatFullDate(msg.created_at)}>
              {formatTime(msg.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const MessageItem = memo(MessageItemInner);
