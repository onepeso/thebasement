import { Profile, UserStatus } from '@/types/database';
import { useChatStore } from '@/store/useChatStore';
import { AvatarWithEffect } from '@/components/ui/AvatarWithEffect';

interface MemberListProps {
  allProfiles: Profile[];
  onlineUsers: string[];
}

const STATUS_COLORS: Record<UserStatus, { dot: string; text: string }> = {
  online: { dot: 'bg-emerald-500 shadow-emerald-500/50', text: 'text-zinc-200' },
  away: { dot: 'bg-yellow-500 shadow-yellow-500/50', text: 'text-zinc-200' },
  busy: { dot: 'bg-red-500 shadow-red-500/50', text: 'text-zinc-200' },
  dnd: { dot: 'bg-red-600 shadow-red-600/50', text: 'text-zinc-200' },
  offline: { dot: 'bg-zinc-600', text: 'text-zinc-600' },
};

export function MemberList({ allProfiles, onlineUsers }: MemberListProps) {
  const sortedProfiles = [...allProfiles].sort((a, b) => {
    const statusOrder: Record<UserStatus, number> = { online: 0, dnd: 1, busy: 2, away: 3, offline: 4 };
    
    const aIsOnline = onlineUsers.includes(a.id);
    const bIsOnline = onlineUsers.includes(b.id);
    const aStatus = (a.status || (aIsOnline ? 'online' : 'offline')) as UserStatus;
    const bStatus = (b.status || (bIsOnline ? 'online' : 'offline')) as UserStatus;
    
    const aOrder = statusOrder[aStatus] ?? 4;
    const bOrder = statusOrder[bStatus] ?? 4;
    
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.username.localeCompare(b.username);
  });

  const onlineCount = onlineUsers.length;

  return (
    <aside className="w-56 bg-gradient-to-b from-zinc-900/30 to-zinc-950/50 hidden lg:flex flex-col border-l border-white/5 shrink-0 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/3 via-transparent to-purple-500/3 pointer-events-none" />
      
      <div className="relative h-14 flex items-center px-4 border-b border-white/5">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
          Members
        </span>
        <span className="ml-2 px-2 py-0.5 bg-zinc-800/80 rounded-full text-[9px] font-bold text-zinc-400">
          {onlineCount} online
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar relative">
        {sortedProfiles.map((profile) => {
          const isOnline = onlineUsers.includes(profile.id);
          const customStatus = profile.status as UserStatus | undefined;
          
          let status: UserStatus;
          if (isOnline) {
            status = customStatus && customStatus !== 'offline' ? customStatus : 'online';
          } else {
            status = 'offline';
          }
          
          const colors = STATUS_COLORS[status];
          const isOffline = status === 'offline';

          return (
            <div 
              key={profile.id} 
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200 group"
              onClick={() => useChatStore.getState().setViewProfile(profile)}
            >
              <div className="shrink-0 transition-all duration-300">
                <AvatarWithEffect 
                  profile={profile} 
                  size="md" 
                  isOnline={isOnline}
                  className={isOffline ? 'opacity-50' : ''}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-semibold truncate transition-colors duration-300 ${colors.text}`}>
                  {profile.username}
                </div>
                {profile.bio && (
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5" title={profile.bio}>
                    {profile.bio.slice(0, 24)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}