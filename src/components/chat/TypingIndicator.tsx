import { useMemo } from 'react';

interface TypingUser {
  userId: string;
  username: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
  className?: string;
}

export function TypingIndicator({ users, className = '' }: TypingIndicatorProps) {
  const text = useMemo(() => {
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0].username} is typing`;
    if (users.length === 2) return `${users[0].username} and ${users[1].username} are typing`;
    if (users.length <= 4) {
      const names = users.slice(0, -1).map((u) => u.username).join(', ');
      return `${names}, and ${users[users.length - 1].username} are typing`;
    }
    return `${users.length} people are typing`;
  }, [users]);

  if (!text) return null;

  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 ${className}`}>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-[11px] text-zinc-500 italic">{text}</span>
    </div>
  );
}
