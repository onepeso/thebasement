import { memo, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, Smile, Pin, PinOff, Reply, ShieldAlert, MoreHorizontal } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { AvatarWithEffect } from "@/components/ui/AvatarWithEffect";
import { getUsernameStyle, getTextColor } from "@/utils/fontStyles";
import { useAuthToken } from "@/hooks/useAuthToken";

function MessageItemInner({
  msg,
  isMe,
  onDelete,
  onEdit,
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
  allProfiles = [],
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);
  const [localText, setLocalText] = useState(msg.text);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthToken();
  const blockedIds = useChatStore((state) => state.blockedIds);

  const viewProfile = (profile: any) => {
    if (profile && !blockedIds.includes(profile.id)) {
      useChatStore.getState().setViewProfile(profile);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMessageMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseDown = () => {
    holdTimer.current = setTimeout(() => {
      setShowMessageMenu(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const handleReport = async () => {
    if (!selectedReason || reporting || !token) return;
    setReporting(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          reported_id: msg.user_id,
          reason: selectedReason,
          content_snapshot: msg.text,
          message_id: msg.id,
          channel_id: msg.channel_id,
        }),
      });
      if (res.ok) {
        setShowReportModal(false);
        setShowMessageMenu(false);
        setSelectedReason("");
        setCustomReason("");
      }
    } catch (err) {
      console.error("Report error:", err);
    }
    setReporting(false);
  };
  
  useEffect(() => {
    setLocalText(msg.text);
  }, [msg.text]);
  
  const isMentioned = myUsername && !isMe && localText.includes(`@${myUsername}`);

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
    if (!editText.trim() || !msg.id) return;
    const newText = editText.trim();
    const editedAt = new Date().toISOString();
    
    console.log("Editing message:", msg.id, "to:", newText);
    
    const { data, error } = await supabase
      .from("messages")
      .update({ 
        text: newText,
        edited_at: editedAt
      })
      .eq("id", msg.id)
      .select();
    
    console.log("Edit result:", data, error);
    
    if (error) {
      console.error("Edit error:", error);
      return;
    }
    
    setLocalText(newText);
    onEdit?.(msg.id, newText, editedAt);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditText(msg.text);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return renderMentions(text);
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-300 rounded px-0.5">{renderMentions(part)}</mark>
      ) : renderMentions(part)
    );
  };

  const renderMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    const filteredProfiles = allProfiles.filter((p: any) => !blockedIds.includes(p.id));

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      const username = match[1];
      const mentionedProfile = filteredProfiles.find((p: any) => p.username?.toLowerCase() === username.toLowerCase());
      
      if (mentionedProfile && !blockedIds.includes(mentionedProfile.id)) {
        parts.push(
          <button
            key={match.index}
            onClick={(e) => {
              e.stopPropagation();
              viewProfile(mentionedProfile);
            }}
            className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
            style={{
              ...getUsernameStyle(mentionedProfile.font_style),
              color: getTextColor(mentionedProfile.text_color),
            }}
          >
            @{username}
          </button>
        );
      } else {
        parts.push(`@${username}`);
      }
      
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        <div className="shrink-0 flex justify-center mr-4 w-10">
          {!isGrouped ? (
            <AvatarWithEffect
              profile={msg.profiles}
              size="lg"
              showStatus={false}
              onClick={() => viewProfile(msg.profiles)}
            />
          ) : (
            <div className="w-10" />
          )}
        </div>

            <div className="flex flex-col min-w-0 flex-1">
              {!isGrouped && (
                <div className="flex items-center gap-2 mb-1 group/name">
                  <span
                    className="font-semibold tracking-tight cursor-pointer hover:underline text-[13px]"
                    style={{
                      ...getUsernameStyle(msg.profiles?.font_style),
                      color: getTextColor(msg.profiles?.text_color),
                    }}
                    title={formatFullDate(msg.created_at)}
                    onClick={() => viewProfile(msg.profiles)}
                  >
                    {msg.profiles?.username}
                  </span>
                </div>
              )}

          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {msg.reply_to_id && msg.reply_to && (
                <div className="mb-2 flex items-center gap-2">
                  <Reply size={10} className="text-indigo-400 shrink-0" />
                  <span className="text-[10px] font-medium text-indigo-400">{msg.reply_to.profiles?.username || 'Unknown'}: </span>
                  <span className="text-[10px] text-zinc-500 line-clamp-1">{msg.reply_to.text}</span>
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
                      onKeyDown={handleEditKeyDown}
                    />
                    <div className="flex items-center gap-3 text-[9px] font-medium uppercase">
                      <button
                        onClick={saveEdit}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        Update
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="break-words whitespace-pre-wrap select-text leading-snug">
                    {highlightText(localText, searchQuery)}
                  </span>
                )}
              </div>

              {reactions && reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {reactions.map((r: any) => (
                    <button
                      key={r.emoji}
                      onClick={() => onToggleReaction(msg.id, r.emoji)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all cursor-pointer ${
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
              <div className="relative flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 shrink-0 hidden sm:flex">
                <button
                  onClick={() => onReactionClick && onReactionClick(msg)}
                  className="p-1 rounded text-zinc-500 hover:text-yellow-400 hover:bg-white/5 transition-all cursor-pointer"
                  title="React"
                >
                  <Smile size={12} />
                </button>
                <button
                  onClick={() => onReply(msg)}
                  className="p-1 rounded text-zinc-500 hover:text-indigo-400 hover:bg-white/5 transition-all cursor-pointer"
                  title="Reply"
                >
                  <Reply size={12} />
                </button>
                <button
                  onClick={() => isPinned ? onUnpin(msg.id) : onPin(msg.id)}
                  className={`p-1 rounded transition-all cursor-pointer ${
                    isPinned 
                      ? 'text-indigo-400' 
                      : 'text-zinc-500 hover:text-indigo-400'
                  }`}
                  title={isPinned ? "Unpin" : "Pin"}
                >
                  {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
                {!isMe && (
                  <button
                    onClick={() => { setShowReportModal(true); }}
                    className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                    title="Report"
                  >
                    <ShieldAlert size={12} />
                  </button>
                )}
                {isMe && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded text-zinc-500 hover:text-emerald-400 hover:bg-white/5 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => onDelete(msg.id)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-1 text-[9px] font-medium text-zinc-600/30 tabular-nums shrink-0 self-center ml-2">
              {msg.edited_at && (
                <span className="italic">(edited)</span>
              )}
              <span title={formatFullDate(msg.created_at)}>
                {formatTime(msg.created_at)}
              </span>
            </div>

            {/* Mobile long-press indicator - show on touch devices */}
            <div className="sm:hidden flex items-center gap-0.5 ml-2 opacity-50">
              <button
                onClick={() => setShowMessageMenu(true)}
                className="p-2 -m-2 text-zinc-600 active:text-white"
                title="More options"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile message actions - bottom sheet */}
      {showMessageMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-end sm:hidden"
          onClick={() => setShowMessageMenu(false)}
        >
          <div 
            className="w-full bg-zinc-900/95 border-t border-white/10 rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <div className="space-y-2">
              {!isMe && (
                <button
                  onClick={() => { setShowReportModal(true); setShowMessageMenu(false); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 text-sm text-red-400 bg-zinc-800/50 rounded-xl active:bg-zinc-800"
                >
                  <ShieldAlert size={18} />
                  Report Message
                </button>
              )}
              <button
                onClick={() => { onReply?.(msg); setShowMessageMenu(false); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 text-sm text-indigo-400 bg-zinc-800/50 rounded-xl active:bg-zinc-800"
              >
                <Reply size={18} />
                Reply
              </button>
              <button
                onClick={() => { onReactionClick?.(msg); setShowMessageMenu(false); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 text-sm text-yellow-400 bg-zinc-800/50 rounded-xl active:bg-zinc-800"
              >
                <Smile size={18} />
                React
              </button>
              {isPinned ? (
                <button
                  onClick={() => { onUnpin?.(msg.id); setShowMessageMenu(false); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 text-sm text-zinc-400 bg-zinc-800/50 rounded-xl active:bg-zinc-800"
                >
                  <PinOff size={18} />
                  Unpin
                </button>
              ) : (
                <button
                  onClick={() => { onPin?.(msg.id); setShowMessageMenu(false); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 text-sm text-zinc-400 bg-zinc-800/50 rounded-xl active:bg-zinc-800"
                >
                  <Pin size={18} />
                  Pin
                </button>
              )}
              {isMe && (
                <>
                  <button
                    onClick={() => { setIsEditing(true); setShowMessageMenu(false); }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 text-sm text-emerald-400 bg-zinc-800/50 rounded-xl active:bg-zinc-800"
                  >
                    <Pencil size={18} />
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete?.(msg.id); setShowMessageMenu(false); }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 text-sm text-red-400 bg-zinc-800/50 rounded-xl active:bg-zinc-800"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div 
            className="w-full sm:max-w-[320px] bg-zinc-900/95 border border-white/10 rounded-t-2xl sm:rounded-xl p-4 pb-8 sm:pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-4 sm:hidden" />
            <h3 className="text-base sm:text-sm font-bold text-white mb-4">Report Message</h3>
            <div className="space-y-2 mb-4">
              {[
                { id: "harassment", label: "Harassment" },
                { id: "hate_speech", label: "Hate Speech" },
                { id: "spam", label: "Spam" },
                { id: "inappropriate", label: "Inappropriate" },
                { id: "csam", label: "Child Safety (CSAM)", isDanger: true },
                { id: "other", label: "Other" },
              ].map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left px-4 py-3 sm:px-3 sm:py-2 rounded-xl sm:rounded-lg border transition-all active:scale-[0.98] ${
                    selectedReason === reason.id 
                      ? "border-red-500/50 bg-red-500/10" 
                      : "border-white/5 bg-zinc-800/50 sm:hover:bg-zinc-800"
                  }`}
                >
                  <span className={`text-sm sm:text-xs font-medium ${reason.isDanger ? 'text-red-400' : 'text-white'}`}>{reason.label}</span>
                </button>
              ))}
              {selectedReason === 'other' && (
                <input
                  type="text"
                  placeholder="Explain your report..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-4 py-3 sm:px-3 sm:py-2 text-sm sm:text-xs bg-zinc-800 border border-white/10 rounded-xl sm:rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50"
                  autoFocus
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowReportModal(false); setSelectedReason(""); setCustomReason(""); }}
                className="flex-1 px-4 py-3 sm:px-3 sm:py-2 text-sm sm:text-xs text-zinc-400 hover:text-white transition-colors rounded-xl sm:rounded-lg active:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim()) || reporting}
                className="flex-1 px-4 py-3 sm:px-3 sm:py-2 text-sm sm:text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-xl sm:rounded-lg transition-colors active:scale-95"
              >
                {reporting ? "Sending..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const MessageItem = memo(MessageItemInner);
