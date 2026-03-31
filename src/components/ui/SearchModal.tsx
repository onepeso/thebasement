"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, X, Filter, User, Calendar, Hash, ChevronDown } from 'lucide-react';
import { useSearch, SearchFilters, SearchResult } from '@/hooks/useSearch';
import { AvatarWithEffect } from '@/components/ui/AvatarWithEffect';
import { useChatStore } from '@/store/useChatStore';

interface SearchModalProps {
  open: boolean;
  allProfiles: any[];
  onClose: () => void;
  onJumpToMessage: (messageId: string, channelId: string) => void;
}

export function SearchModal({ open, allProfiles, onClose, onJumpToMessage }: SearchModalProps) {
  const channels = useChatStore((state) => state.channels);
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
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
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

  useEffect(() => {
    if (!open) {
      setFilters({
        query: '',
        userId: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        channelId: undefined,
      });
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-start justify-center pt-[15vh] p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl animate-scale-in">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-xl" />

        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  placeholder="Search messages..."
                  className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                  autoFocus
                />
                {filters.query && (
                  <button
                    onClick={() => setFilters({ ...filters, query: '' })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setFilters({
                  query: filters.query,
                  userId: undefined,
                  dateFrom: undefined,
                  dateTo: undefined,
                  channelId: undefined,
                })}
                className={`p-3 rounded-xl transition-colors ${
                  activeFiltersCount > 0
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'bg-zinc-800/50 text-zinc-500 hover:text-white'
                }`}
                title="Clear filters"
              >
                <X size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-3 bg-zinc-800/50 rounded-xl text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <div className="relative">
                <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <select
                  value={filters.userId || ''}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
                  className="pl-8 pr-8 py-1.5 bg-zinc-800/50 border border-white/10 rounded-lg text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="">All users</option>
                  {allProfiles.map((profile: any) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.username}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>

              <div className="relative">
                <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <select
                  value={filters.channelId || ''}
                  onChange={(e) => setFilters({ ...filters, channelId: e.target.value || undefined })}
                  className="pl-8 pr-8 py-1.5 bg-zinc-800/50 border border-white/10 rounded-lg text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="">All channels</option>
                  {channels.map((channel: any) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>

              <div className="relative">
                <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
                  className="pl-8 pr-3 py-1.5 bg-zinc-800/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="relative">
                <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
                  className="pl-8 pr-3 py-1.5 bg-zinc-800/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}

            {error && (
              <div className="p-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && filters.query && results.length === 0 && (
              <div className="text-center py-12">
                <Search size={32} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">No messages found</p>
              </div>
            )}

            {!filters.query && (
              <div className="text-center py-12">
                <Search size={32} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">Start typing to search</p>
              </div>
            )}

            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  onJumpToMessage(result.id, result.channel_id);
                  onClose();
                }}
                className="w-full text-left p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  {result.profiles && (
                    <AvatarWithEffect
                      profile={{ ...result.profiles, avatar_url: result.profiles.avatar_url || '' }}
                      size="sm"
                      showStatus={false}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-indigo-400 truncate">
                        {result.profiles?.username || 'Unknown'}
                      </span>
                      {result.channel && (
                        <span className="text-xs text-zinc-600 flex items-center gap-1">
                          <Hash size={10} />
                          {result.channel.name}
                        </span>
                      )}
                      <span className="text-xs text-zinc-700 ml-auto shrink-0">
                        {formatDate(result.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {highlightText(result.text, filters.query)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-white/5 bg-black/20">
            <div className="flex items-center justify-between text-[10px] text-zinc-600">
              <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
              <span>Press Esc to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
