import { Profile } from '@/types/database';
import { MemberList } from './MemberList';

interface RightSidebarProps {
  allProfiles: Profile[];
  onlineUsers: string[];
}

export function RightSidebar({ allProfiles, onlineUsers }: RightSidebarProps) {
  return (
    <aside className="hidden lg:flex lg:w-64 bg-gradient-to-b from-zinc-900/30 to-zinc-950/50 border-l border-white/5 flex-col shrink-0 overflow-y-auto">
      <MemberList allProfiles={allProfiles} onlineUsers={onlineUsers} />
    </aside>
  );
}
