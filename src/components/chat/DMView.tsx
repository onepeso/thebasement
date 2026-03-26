import { useState, useEffect, useRef, useMemo } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import type { DirectMessage, DMMessage } from '@/types/database';
import type { UserStatus } from '@/types/database';
import { useChatStore } from '@/store/useChatStore';
import { AvatarWithEffect } from '@/components/ui/AvatarWithEffect';
import { TypingIndicator } from './TypingIndicator';

interface DMViewProps {
  dm: DirectMessage | null;
  messages: DMMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onBack: () => void;
  onlineUsers?: string[];
  allProfiles?: any[];
  typingUsers?: { userId: string; username: string }[];
  onTyping?: () => void;
  onStopTyping?: () => void;
}

const STATUS_CONFIG: Record<UserStatus, { dot: string; label: string }> = {
  online: { dot: 'bg-emerald-500 shadow-emerald-500/50', label: 'Online' },
  away: { dot: 'bg-yellow-500 shadow-yellow-500/50', label: 'Away' },
  busy: { dot: 'bg-red-500 shadow-red-500/50', label: 'Busy' },
  dnd: { dot: 'bg-red-600 shadow-red-600/50', label: 'Do Not Disturb' },
  offline: { dot: 'bg-zinc-600', label: 'Offline' },
};

export function DMView({ dm, messages, currentUserId, onSendMessage, onBack, onlineUsers = [], allProfiles = [], typingUsers = [], onTyping, onStopTyping }: DMViewProps) {
  const [input, setInput] = useState('');
  const [isIphone, setIsIphone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onStopTyping?.();
    
    onSendMessage(input);
    setInput('');
  };

  const otherUser = dm?.other_user;
  const isOtherUserOnline = otherUser ? onlineUsers.includes(otherUser.id) : false;
  
  const statusInfo = useMemo(() => {
    if (!otherUser) return { status: 'offline' as UserStatus, config: STATUS_CONFIG.offline };
    
    const isOnline = onlineUsers.length > 0 && onlineUsers.includes(otherUser.id);
    
    if (!isOnline) return { status: 'offline' as UserStatus, config: STATUS_CONFIG.offline };
    
    const latestProfile = allProfiles.find(p => p.id === otherUser.id);
    const status = (latestProfile?.status || otherUser.status || 'online') as UserStatus;
    
    if (status === 'offline') return { status: 'online' as UserStatus, config: STATUS_CONFIG.online };
    return { status, config: STATUS_CONFIG[status] };
  }, [otherUser, allProfiles, onlineUsers]);

  if (!dm) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-900/30">
        <div className="text-center text-zinc-600">
          <p className="text-sm">Select a conversation</p>
        </div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-900/30">
        <div className="text-center text-zinc-600">
          <p className="text-sm">Loading conversation...</p>
        </div>
      </div>
    );
  }

  const statusConfig = statusInfo.config;

  return (
    <div className="flex-1 flex flex-col bg-zinc-900/30 min-w-0">
      <header className="h-14 flex items-center gap-3 px-4 border-b border-white/5 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors lg:hidden"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="relative">
          <AvatarWithEffect 
            profile={otherUser}
            size="md"
            isOnline={isOtherUserOnline}
            onClick={() => otherUser && useChatStore.getState().setViewProfile(otherUser)}
          />
        </div>
        <div>
          <h2 
            className="text-sm font-bold text-white cursor-pointer hover:underline"
            onClick={() => otherUser && useChatStore.getState().setViewProfile(otherUser)}
          >
            {otherUser?.username || 'Unknown'}
          </h2>
          <p className="text-[10px] text-zinc-500">{statusConfig.label}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <p className="text-sm">Start a conversation with {otherUser?.username}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const time = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[70%] ${
                    isMe
                      ? isIphone
                        ? 'bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm'
                        : 'bg-indigo-600 text-white px-4 py-2.5 rounded-2xl'
                      : isIphone
                      ? 'bg-zinc-800 text-zinc-100 px-4 py-2.5 rounded-2xl rounded-bl-sm'
                      : 'bg-zinc-800 text-zinc-100 px-4 py-2.5 rounded-2xl'
                  }`}
                >
                  {!isIphone && !isMe && (
                    <p 
                      className="text-[10px] font-bold text-indigo-400 mb-1 cursor-pointer hover:underline"
                      onClick={() => msg.profiles && useChatStore.getState().setViewProfile(msg.profiles)}
                    >
                      {msg.profiles?.username || 'Unknown'}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? 'text-indigo-200/60' : 'text-zinc-500'} ${isIphone && isMe ? 'text-right' : ''}`}>
                    {time}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 shrink-0"
      >
        <TypingIndicator users={typingUsers} className="mb-2" />
        <div className="bg-zinc-800/50 rounded-2xl px-4 py-3 border border-white/5 focus-within:border-indigo-500/50 focus-within:bg-zinc-800/70 transition-all shadow-inner">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-600"
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
    </div>
  );
}
