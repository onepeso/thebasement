"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, Hash, Search, Users, Globe, Send, Check, Crown } from 'lucide-react';
import { AvatarWithEffect } from '@/components/ui/AvatarWithEffect';
import { useChatStore } from '@/store/useChatStore';
import { supabase } from '@/lib/supabase';

const GRADIENT_COLORS: Record<string, { from: string; to: string }> = {
  indigo: { from: '#4f46e5', to: '#7c3aed' },
  blue: { from: '#2563eb', to: '#06b6d4' },
  purple: { from: '#9333ea', to: '#db2777' },
  emerald: { from: '#059669', to: '#10b981' },
  orange: { from: '#ea580c', to: '#f97316' },
  red: { from: '#dc2626', to: '#f43f5e' },
  pink: { from: '#db2777', to: '#e879f9' },
  cyan: { from: '#0891b2', to: '#22d3ee' },
  amber: { from: '#d97706', to: '#fbbf24' },
  slate: { from: '#334155', to: '#64748b' },
};

interface ChannelDiscoveryModalProps {
  open: boolean;
  allProfiles: any[];
  onClose: () => void;
  onSelectChannel: (channel: any) => void;
}

interface DiscoverChannel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  emoji?: string;
  color?: string;
  created_by: string;
  creator?: {
    username: string;
  };
  member_count: number;
  is_member: boolean;
  has_pending_request: boolean;
}

export function ChannelDiscoveryModal({
  open,
  allProfiles,
  onClose,
  onSelectChannel,
}: ChannelDiscoveryModalProps) {
  const channels = useChatStore((state) => state.channels);
  const myProfile = useChatStore((state) => state.userProfile);
  const [search, setSearch] = useState('');
  const [discoverChannels, setDiscoverChannels] = useState<DiscoverChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !myProfile) return;

    const fetchDiscoverChannels = async () => {
      setLoading(true);
      try {
        const myChannelIds = channels.map((c: any) => c.id);

        const { data: allChannels } = await supabase
          .from('channels')
          .select(`
            id,
            name,
            slug,
            description,
            emoji,
            color,
            created_by,
            profiles:created_by(username)
          `)
          .order('name');

        if (allChannels) {
          const channelsWithStatus = await Promise.all(
            allChannels.map(async (channel: any) => {
              const { count } = await supabase
                .from('channel_members')
                .select('*', { count: 'exact', head: true })
                .eq('channel_id', channel.id);

              const { data: memberData } = await supabase
                .from('channel_members')
                .select('id')
                .eq('channel_id', channel.id)
                .eq('user_id', myProfile.id)
                .maybeSingle();

              const { data: inviteData } = await supabase
                .from('channel_invites')
                .select('id')
                .eq('channel_id', channel.id)
                .eq('invited_user_id', myProfile.id)
                .eq('status', 'pending')
                .maybeSingle();

              return {
                ...channel,
                creator: channel.profiles,
                member_count: count || 0,
                is_member: !!memberData,
                has_pending_request: !!inviteData,
              };
            })
          );

          const filtered = channelsWithStatus.filter(
            (c: any) =>
              !myChannelIds.includes(c.id) &&
              (c.created_by === myProfile.id || c.is_member || c.has_pending_request || !c.created_by)
          );

          setDiscoverChannels(filtered);
        }
      } catch (err) {
        console.error('Error fetching channels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscoverChannels();
  }, [open, myProfile, channels]);

  const handleRequestInvite = async (channel: DiscoverChannel) => {
    if (!myProfile) return;
    setRequesting(channel.id);

    try {
      await supabase.from('channel_invites').insert({
        channel_id: channel.id,
        inviter_id: channel.created_by,
        invited_user_id: myProfile.id,
        status: 'pending',
      });

      setDiscoverChannels((prev) =>
        prev.map((c) =>
          c.id === channel.id ? { ...c, has_pending_request: true } : c
        )
      );
    } catch (err) {
      console.error('Error requesting invite:', err);
    } finally {
      setRequesting(null);
    }
  };

  const filteredChannels = useMemo(() => {
    if (!search.trim()) return discoverChannels;
    const searchLower = search.toLowerCase();
    return discoverChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
    );
  }, [discoverChannels, search]);

  const getCreatorUsername = (creatorId: string) => {
    const profile = allProfiles.find((p: any) => p.id === creatorId);
    return profile?.username || 'Unknown';
  };

  useEffect(() => {
    if (!open) {
      setSearch('');
      setDiscoverChannels([]);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl animate-scale-in max-h-[80vh] flex flex-col">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-xl" />

        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Globe size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Discover Channels</h2>
                  <p className="text-xs text-zinc-500">Find and join public channels</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search channels..."
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}

            {!loading && filteredChannels.length === 0 && (
              <div className="text-center py-12">
                <Hash size={32} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">
                  {search ? 'No channels found' : 'No public channels available'}
                </p>
              </div>
            )}

            {filteredChannels.map((channel) => {
              const color = GRADIENT_COLORS[channel.color || 'indigo'] || GRADIENT_COLORS.indigo;
              const emoji = channel.emoji;
              const hasEmoji = emoji && emoji !== '💬';

              return (
                <div
                  key={channel.id}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors mb-2 last:mb-0"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                    }}
                  >
                    {hasEmoji ? (
                      <span className="text-xl">{emoji}</span>
                    ) : (
                      <Hash size={20} className="text-white/80" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white truncate">#{channel.name}</h3>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <Users size={10} />
                        {channel.member_count}
                      </span>
                    </div>
                    {channel.description && (
                      <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
                        {channel.description}
                      </p>
                    )}
                    <p className="text-[10px] text-zinc-600 flex items-center gap-1">
                      <Crown size={10} className="text-amber-500" />
                      Created by {getCreatorUsername(channel.created_by)}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {channel.has_pending_request ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Send size={12} />
                        Pending
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequestInvite(channel)}
                        disabled={requesting === channel.id}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {requesting === channel.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send size={12} />
                            Request
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
