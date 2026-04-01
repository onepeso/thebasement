"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface TypingUser {
  userId: string;
  username: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
  className?: string;
}

export function TypingIndicator({ users, className = "" }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const names = users.map((u) => u.username);
  let text = "";
  if (names.length === 1) {
    text = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing...`;
  }

  return (
    <div className={`px-4 py-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="text-[10px] text-zinc-500">{text}</span>
      </div>
    </div>
  );
}
