import { X, Circle } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { AvatarWithEffect } from './AvatarWithEffect';
import { useAuth } from '@/hooks/useAuth';
import type { UserStatus } from '@/types/database';

const STATUS_COLORS: Record<string, { dot: string; label: string; text: string }> = {
  online: { dot: 'bg-emerald-500', label: 'Online', text: 'text-emerald-400' },
  away: { dot: 'bg-yellow-500', label: 'Away', text: 'text-yellow-400' },
  busy: { dot: 'bg-red-500', label: 'Busy', text: 'text-red-400' },
  dnd: { dot: 'bg-red-600', label: 'Do Not Disturb', text: 'text-red-500' },
  offline: { dot: 'bg-zinc-600', label: 'Offline', text: 'text-zinc-400' },
};

interface ViewProfileModalProps {
  onlineUsers: string[];
}

export function ViewProfileModal({ onlineUsers }: ViewProfileModalProps) {
  const { viewProfile, setViewProfile } = useChatStore();
  const { allProfiles } = useAuth();

  if (!viewProfile) return null;

  const profileData = allProfiles.find(p => p.id === viewProfile.id) || viewProfile;
  const isOnline = onlineUsers.includes(viewProfile.id);
  const customStatus = profileData.status as UserStatus | undefined;
  const status = isOnline ? (customStatus || 'online') : 'offline';
  
  const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.offline;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && setViewProfile(null)}
    >
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div 
            className="h-24 sm:h-32 relative bg-cover bg-center"
            style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
            
            <button
              onClick={() => setViewProfile(null)}
              className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white/80 hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            <div className="absolute -bottom-8 left-4">
              <AvatarWithEffect 
                profile={profileData} 
                size="xl"
                showStatus={true}
                isOnline={isOnline}
              />
            </div>
          </div>

          <div className="pt-12 sm:pt-14 px-4 sm:px-6 pb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">
                {profileData.username || viewProfile.username}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Circle size={10} className={`${statusConfig.dot} fill-current`} />
                <span className="text-xs text-zinc-400">{statusConfig.label}</span>
              </div>
            </div>

            {(profileData.bio || viewProfile.bio) && (
              <div className="bg-zinc-800/30 rounded-lg px-4 py-3">
                <p className="text-sm text-zinc-300">
                  {profileData.bio || viewProfile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
