"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface TypingUser {
  userId: string;
  username: string;
}

interface TypingUsers {
  [channelId: string]: TypingUser[];
}

export function useTyping(userId?: string, username?: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUsers>({});
  const channels = useRef<Set<string>>(new Set());

  const startTyping = async (channelId: string) => {
    if (!userId || !username) return;
    
    const channel = supabase.channel(`typing:${channelId}`);
    await channel.subscribe();
    
    await channel.track({
      userId,
      username,
      typing: true,
      timestamp: Date.now(),
    });
    
    channels.current.add(channelId);
  };

  const stopTyping = async (channelId: string) => {
    if (!userId || !username) return;
    
    const channel = supabase.channel(`typing:${channelId}`);
    
    await channel.track({
      userId,
      username,
      typing: false,
      timestamp: Date.now(),
    });
  };

  useEffect(() => {
    const cleanup = () => {
      channels.current.forEach((channelId) => {
        supabase.channel(`typing:${channelId}`).unsubscribe();
      });
      channels.current.clear();
    };

    return cleanup;
  }, []);

  return { typingUsers, startTyping, stopTyping };
}
