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
      <div className="relative w-full max-w-lg animate-scale-in max-h-[75vh] flex flex-col">
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Globe size={14} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Discover</h2>
                <p className="text-[9px] text-zinc-500">Find channels</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-white/5">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search channels..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}

            {!loading && filteredChannels.length === 0 && (
              <div className="text-center py-8">
                <Hash size={24} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500">
                  {search ? 'No channels found' : 'No public channels'}
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
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                    }}
                  >
                    {hasEmoji ? (
                      <span className="text-lg">{emoji}</span>
                    ) : (
                      <Hash size={16} className="text-white/80" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-semibold text-white truncate">#{channel.name}</h3>
                      <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
                        <Users size={8} />
                        {channel.member_count}
                      </span>
                    </div>
                    {channel.description && (
                      <p className="text-[10px] text-zinc-400 line-clamp-1">
                        {channel.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {channel.has_pending_request ? (
                      <button
                        disabled
                        className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-[10px] font-medium rounded-lg flex items-center gap-1"
                      >
                        <Send size={10} />
                        Pending
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequestInvite(channel)}
                        disabled={requesting === channel.id}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {requesting === channel.id ? (
                          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send size={10} />
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
