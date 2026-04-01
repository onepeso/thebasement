"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SearchFilters {
  query: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  channelId?: string;
}

export interface SearchResult {
  id: string;
  text: string;
  created_at: string;
  channel_id: string;
  user_id: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  channel?: {
    id: string;
    name: string;
  };
}

export function useSearch(filters: SearchFilters) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async () => {
    if (!filters.query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('messages')
        .select(`
          id,
          text,
          created_at,
          channel_id,
          user_id,
          profiles:user_id(id, username, avatar_url, font_style, text_color),
          channel:channel_id(id, name)
        `)
        .ilike('text', `%${filters.query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.channelId) {
        query = query.eq('channel_id', filters.channelId);
      }

      const { data, error: searchError } = await query;

      if (searchError) {
        setError(searchError.message);
      } else {
        setResults((data as unknown as SearchResult[]) || []);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [filters]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  return { results, loading, error, search };
}
