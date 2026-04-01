import { useState } from "react";
import { Profile, UserStatus } from '@/types/database';
import { useChatStore } from '@/store/useChatStore';
import { AvatarWithEffect } from '@/components/ui/AvatarWithEffect';
import { Users, ChevronDown } from "lucide-react";

interface MemberListProps {
  allProfiles: Profile[];
  onlineUsers: string[];
}

export function MemberList({ allProfiles, onlineUsers }: MemberListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const onlineCount = onlineUsers.length;
  const offlineCount = allProfiles.length - onlineCount;

  return (
    <div className="border-t border-white/5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-12 flex items-center justify-between px-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users size={14} className="text-indigo-400" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
            Members
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-full">
            {onlineCount}
          </span>
          <ChevronDown 
            size={12} 
            className={`text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 400px)' }}>
          {onlineCount > 0 && (
            <div className="mb-3">
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-2 px-1">
                Online — {onlineCount}
              </p>
              <div className="space-y-0.5">
                {allProfiles
                  .filter(p => onlineUsers.includes(p.id))
                  .map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => useChatStore.getState().setViewProfile(profile)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <AvatarWithEffect 
                        profile={profile} 
                        size="sm"
                        isOnline={true}
                      />
                      <span className="text-xs font-medium text-zinc-300 truncate">
                        {profile.username}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
          
          {offlineCount > 0 && (
            <div>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-2 px-1">
                Offline — {offlineCount}
              </p>
              <div className="space-y-0.5">
                {allProfiles
                  .filter(p => !onlineUsers.includes(p.id))
                  .map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => useChatStore.getState().setViewProfile(profile)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors opacity-60 hover:opacity-100"
                    >
                      <AvatarWithEffect 
                        profile={profile} 
                        size="sm"
                        isOnline={false}
                      />
                      <span className="text-xs font-medium text-zinc-400 truncate">
                        {profile.username}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
