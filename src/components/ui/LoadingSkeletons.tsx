export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-3 px-6 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 rounded bg-zinc-800" />
          <div className="h-3 w-16 rounded bg-zinc-800/50" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-zinc-800/50" />
          <div className="h-3 w-3/4 rounded bg-zinc-800/50" />
        </div>
      </div>
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="flex flex-col py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChannelSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="w-5 h-5 rounded bg-zinc-800" />
      <div className="h-4 w-24 rounded bg-zinc-800" />
    </div>
  );
}

export function ChannelListSkeleton() {
  return (
    <div className="p-2 space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <ChannelSkeleton key={i} />
      ))}
    </div>
  );
}

export function DMSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-4 w-20 rounded bg-zinc-800" />
        <div className="h-3 w-32 rounded bg-zinc-800/50" />
      </div>
    </div>
  );
}

export function DMListSkeleton() {
  return (
    <div className="p-2 space-y-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <DMSkeleton key={i} />
      ))}
    </div>
  );
}

export function MemberSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-zinc-800" />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-zinc-800 border-2 border-zinc-900" />
      </div>
      <div className="h-4 w-20 rounded bg-zinc-800" />
    </div>
  );
}

export function MemberListSkeleton() {
  return (
    <div className="p-2 space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <MemberSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChatHeaderSkeleton() {
  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-800" />
        <div className="space-y-1.5">
          <div className="h-5 w-24 rounded bg-zinc-800" />
          <div className="h-3 w-32 rounded bg-zinc-800/50" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-zinc-800" />
        <div className="w-9 h-9 rounded-xl bg-zinc-800" />
      </div>
    </div>
  );
}
