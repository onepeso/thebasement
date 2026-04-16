"use client";

import { X, Hash, Plus, Compass, UserPlus, Settings } from "lucide-react";
import { useMobileNav } from "./MobileNavContext";
import { useChatStore } from "@/store/useChatStore";
import { useAuth } from "@/hooks/useAuth";

interface MobileChannelListProps {
  onOpenProfile: () => void;
  onCreateChannel: () => void;
  onOpenDiscovery: () => void;
  onOpenInvite: (channel: any) => void;
  onEditChannel: (channel: any) => void;
  memberCounts?: Record<string, number>;
}

export function MobileChannelList({
  onOpenProfile,
  onCreateChannel,
  onOpenDiscovery,
  onOpenInvite,
  onEditChannel,
  memberCounts = {},
}: MobileChannelListProps) {
  const { showChannelDrawer, setShowChannelDrawer } = useMobileNav();
  const { channels, activeChannel, setActiveChannel } = useChatStore();
  const { myProfile } = useAuth();

  if (!showChannelDrawer) return null;

  const officialChannels = channels.filter((c: any) => c.is_official);
  const privateChannels = channels.filter(
    (c: any) => c.is_private && c.created_by === myProfile?.id
  );

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowChannelDrawer(false)}
      />

      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-zinc-950 border-r border-white/10 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-lg font-black text-white">B</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white">The Basement</h1>
              <p className="text-xs text-zinc-500">
                {myProfile?.username || "Guest"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowChannelDrawer(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-3 py-3 border-b border-white/5">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowChannelDrawer(false);
                onOpenProfile();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition-all active:scale-[0.98]"
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Official Channels */}
          <div className="px-3 py-2">
            <h2 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 px-2">
              Official
            </h2>
            <div className="space-y-0.5">
              {officialChannels.map((channel: any) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setActiveChannel(channel);
                    setShowChannelDrawer(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                    activeChannel?.id === channel.id
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Hash size={16} />
                  <span className="text-sm font-medium truncate">
                    {channel.name}
                  </span>
                  {memberCounts[channel.id] && (
                    <span className="ml-auto text-[10px] text-zinc-600">
                      {memberCounts[channel.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Private Channels */}
          {privateChannels.length > 0 && (
            <div className="px-3 py-2">
              <h2 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 px-2">
                Private
              </h2>
              <div className="space-y-0.5">
                {privateChannels.map((channel: any) => (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setActiveChannel(channel);
                      setShowChannelDrawer(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                      activeChannel?.id === channel.id
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Hash size={16} />
                    <span className="text-sm font-medium truncate">
                      {channel.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <button
            onClick={() => {
              setShowChannelDrawer(false);
              onCreateChannel();
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            <span className="text-sm">Create Channel</span>
          </button>
          <button
            onClick={() => {
              setShowChannelDrawer(false);
              onOpenDiscovery();
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98]"
          >
            <Compass size={18} />
            <span className="text-sm">Channel Discovery</span>
          </button>
          <button
            onClick={() => {
              if (activeChannel) {
                setShowChannelDrawer(false);
                onOpenInvite(activeChannel);
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98]"
          >
            <UserPlus size={18} />
            <span className="text-sm">Invite People</span>
          </button>
        </div>
      </div>
    </div>
  );
}
