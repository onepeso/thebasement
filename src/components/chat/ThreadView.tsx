import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageSquare, Hash } from 'lucide-react';
import type { Message, Thread } from '@/types/database';
import { useChatStore } from '@/store/useChatStore';
import { AvatarWithEffect } from '@/components/ui/AvatarWithEffect';

interface ThreadViewProps {
  thread?: Thread;
  rootMessage: Message;
  threadMessages: Message[];
  currentUserId: string;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  channelName?: string;
  onlineUsers?: string[];
}

export function ThreadView({
  thread,
  rootMessage,
  threadMessages,
  currentUserId,
  onClose,
  onSendMessage,
  channelName,
  onlineUsers = [],
}: ThreadViewProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const replyCount = thread?.reply_count ?? (threadMessages.length - 1);
  const replyText = replyCount <= 1 ? 'reply' : 'replies';
  const actualReplies = threadMessages.filter(m => m.id !== rootMessage.id && !m.text?.includes('started a thread'));

  if (!rootMessage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-900/30">
        <div className="text-zinc-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-900/30 min-w-0">
      <header className="h-14 flex items-center gap-3 px-4 border-b border-white/5 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600/20 rounded-lg">
            <MessageSquare size={16} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Thread</h2>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
              <Hash size={10} />
              <span>{channelName}</span>
              <span>•</span>
              <span>{replyCount} {replyText}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex gap-3 p-4 bg-zinc-800/30 rounded-xl border border-white/5 mb-4">
          <AvatarWithEffect
            profile={rootMessage.profiles}
            size="lg"
            showStatus={true}
            isOnline={rootMessage.profiles ? onlineUsers.includes(rootMessage.profiles.id) : false}
            onClick={() => rootMessage.profiles && useChatStore.getState().setViewProfile(rootMessage.profiles)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="font-semibold text-indigo-400 text-[13px] cursor-pointer hover:underline"
                onClick={() => rootMessage.profiles && useChatStore.getState().setViewProfile(rootMessage.profiles)}
              >
                {rootMessage.profiles?.username || 'Unknown'}
              </span>
              <span className="text-[9px] font-medium text-zinc-600" title={formatFullDate(rootMessage.created_at)}>
                {formatTime(rootMessage.created_at)}
              </span>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {rootMessage.text || '(no message)'}
            </p>
          </div>
        </div>

        {actualReplies.length > 0 && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-3">
              Replies
            </div>
            {actualReplies.map((msg) => {
              const isMe = msg.user_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <AvatarWithEffect
                    profile={msg.profiles}
                    size="sm"
                    showStatus={true}
                    isOnline={msg.profiles ? onlineUsers.includes(msg.profiles.id) : false}
                    onClick={() => msg.profiles && useChatStore.getState().setViewProfile(msg.profiles)}
                  />
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span 
                        className={`font-semibold text-[11px] cursor-pointer hover:underline ${isMe ? 'text-emerald-400' : 'text-indigo-400'}`}
                        onClick={() => msg.profiles && useChatStore.getState().setViewProfile(msg.profiles)}
                      >
                        {msg.profiles?.username || 'Unknown'}
                      </span>
                      <span className="text-[9px] font-medium text-zinc-600">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-white/5 shrink-0"
      >
        <div className="bg-zinc-800/50 rounded-xl px-4 py-3 border border-white/5 focus-within:border-indigo-500/50 focus-within:bg-zinc-800/70 transition-all">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Reply to thread..."
              className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-600"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
