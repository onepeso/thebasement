"use client";

import { useState, useMemo } from 'react';
import { Search, X, Filter, User, Calendar, Hash, ChevronDown } from 'lucide-react';
import { useSearch, SearchFilters } from '@/hooks/useSearch';
import { AvatarWithEffect } from '@/components/ui/AvatarWithEffect';
import { useChatStore } from '@/store/useChatStore';

interface SearchPanelProps {
  allProfiles: any[];
  onJumpToMessage: (messageId: string, channelId: string) => void;
}

export function SearchPanel({ allProfiles, onJumpToMessage }: SearchPanelProps) {
  const channels = useChatStore((state) => state.channels);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    userId: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    channelId: undefined,
  });

  const { results, loading, error } = useSearch(filters);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.userId) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.channelId) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      query: filters.query,
      userId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      channelId: undefined,
    });
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-300 rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSelectedUser = () => {
    if (!filters.userId) return null;
    return allProfiles.find((p: any) => p.id === filters.userId);
  };

  const getSelectedChannel = () => {
    if (!filters.channelId) return null;
    return channels.find((c: any) => c.id === filters.channelId);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Search size={14} />
          Search Messages
        </h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1.5 rounded-lg transition-colors ${
            showFilters || activeFiltersCount > 0
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
          title="Filters"
        >
          <Filter size={14} />
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Search messages..."
          className="w-full pl-9 pr-4 py-2.5 bg-zinc-800/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
          autoFocus
        />
        {filters.query && (
          <button
            onClick={() => setFilters({ ...filters, query: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showFilters && (
        <div className="space-y-3 p-3 bg-zinc-800/30 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[10px] text-indigo-400 hover:text-indigo-300"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select
                value={filters.userId || ''}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
                className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-white/10 rounded-lg text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50"
              >
                <option value="">All users</option>
                {allProfiles.map((profile: any) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.username}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>

            <div className="relative">
              <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select
                value={filters.channelId || ''}
                onChange={(e) => setFilters({ ...filters, channelId: e.target.value || undefined })}
                className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-white/10 rounded-lg text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50"
              >
                <option value="">All channels</option>
                {channels.map((channel: any) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
                  className="w-full pl-9 pr-2 py-2 bg-zinc-800/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="From"
                />
              </div>
              <div className="relative flex-1">
                <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
                  className="w-full pl-9 pr-2 py-2 bg-zinc-800/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && filters.query && results.length === 0 && (
          <div className="text-center py-8">
            <Search size={24} className="mx-auto text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-500">No messages found</p>
          </div>
        )}

        {!filters.query && (
          <div className="text-center py-8">
            <Search size={24} className="mx-auto text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-500">Start typing to search</p>
          </div>
        )}

        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => onJumpToMessage(result.id, result.channel_id)}
            className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-start gap-2">
              {result.profiles && (
                <AvatarWithEffect
                  profile={{ ...result.profiles, avatar_url: result.profiles.avatar_url || '' }}
                  size="sm"
                  showStatus={false}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-indigo-400 truncate">
                    {result.profiles?.username || 'Unknown'}
                  </span>
                  <span className="text-[9px] text-zinc-600">
                    {result.channel?.name && `#${result.channel.name}`}
                  </span>
                  <span className="text-[9px] text-zinc-700 ml-auto">
                    {formatDate(result.created_at)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {highlightText(result.text, filters.query)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
