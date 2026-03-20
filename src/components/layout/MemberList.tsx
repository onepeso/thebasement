import { Profile } from '@/types/database';

interface MemberListProps {
  allProfiles: Profile[];
  onlineUsers: any;
}

export function MemberList({ allProfiles, onlineUsers }: MemberListProps) {
  const sortedProfiles = [...allProfiles].sort((a, b) => {
    const aOnline = !!onlineUsers[a.id];
    const bOnline = !!onlineUsers[b.id];
    if (aOnline === bOnline) return a.username.localeCompare(b.username);
    return aOnline ? -1 : 1;
  });

  const onlineCount = allProfiles.filter(p => onlineUsers.includes(p.id)).length;

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

          return (
            <div 
              key={profile.id} 
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200 group"
            >
              <div className={`relative shrink-0 transition-all duration-300 ${isOnline ? '' : 'opacity-40'}`}>
                <img
                  src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=27272a&color=fff`}
                  className="w-9 h-9 rounded-full bg-zinc-800 object-cover ring-1 ring-white/5 group-hover:ring-indigo-500/30 transition-all shadow-lg"
                  alt={profile.username}
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 transition-all duration-300 ${isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-zinc-600'}`} />
              </div>
              <div className={`text-sm font-semibold truncate transition-colors duration-300 ${isOnline ? 'text-zinc-200' : 'text-zinc-600'}`}>
                {profile.username}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}