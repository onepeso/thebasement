"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Hash, Settings, Plus, Users, Search as SearchIcon, Bell, ChevronRight } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: "navigation" | "actions" | "settings" | "search";
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onCreateChannel: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export function CommandPalette({ open, onClose, onCreateChannel, onOpenSettings, onOpenProfile }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { channels, setActiveChannel, setIsSearching } = useChatStore();

  const commands: Command[] = useMemo(() => [
    {
      id: "go-to-channel",
      label: "Go to channel...",
      description: "Jump to a channel",
      icon: <Hash size={16} />,
      category: "navigation",
      action: () => {},
    },
    {
      id: "create-channel",
      label: "Create channel",
      description: "Create a new channel",
      icon: <Plus size={16} />,
      category: "actions",
      action: () => {
        onClose();
        onCreateChannel();
      },
    },
    {
      id: "search-messages",
      label: "Search messages",
      description: "Search across all messages",
      icon: <SearchIcon size={16} />,
      category: "search",
      action: () => {
        onClose();
        setIsSearching(true);
      },
    },
    {
      id: "settings",
      label: "Settings",
      description: "Open app settings",
      icon: <Settings size={16} />,
      category: "settings",
      action: () => {
        onClose();
        onOpenSettings();
      },
    },
    {
      id: "profile",
      label: "Edit profile",
      description: "Edit your profile",
      icon: <Users size={16} />,
      category: "settings",
      action: () => {
        onClose();
        onOpenProfile();
      },
    },
    {
      id: "notifications",
      label: "Notification settings",
      icon: <Bell size={16} />,
      category: "settings",
      action: () => {
        onClose();
        onOpenSettings();
      },
    },
  ], [onClose, onCreateChannel, onOpenSettings, onOpenProfile, setIsSearching]);

  const channelCommands: Command[] = useMemo(() => 
    channels.map((channel) => ({
      id: `channel-${channel.id}`,
      label: `#${channel.name}`,
      description: channel.description || channel.slug,
      icon: <Hash size={16} />,
      category: "navigation" as const,
      action: () => {
        setActiveChannel(channel);
        onClose();
      },
    })), 
  [channels, setActiveChannel, onClose]);

  const filteredCommands = useMemo(() => {
    if (!query) {
      return [...commands, ...channelCommands.slice(0, 5)];
    }

    const lowerQuery = query.toLowerCase();
    const allCommands = [...commands, ...channelCommands];

    return allCommands.filter((cmd) => {
      const labelMatch = cmd.label.toLowerCase().includes(lowerQuery);
      const descMatch = cmd.description?.toLowerCase().includes(lowerQuery);
      return labelMatch || descMatch;
    });
  }, [query, commands, channelCommands]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-start justify-center pt-[15vh] px-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl animate-scale-in">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl" />

          <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
              <Search size={18} className="text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-zinc-600 bg-zinc-800/50 border border-white/10 rounded">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
              {filteredCommands.length === 0 ? (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                  No results found
                </div>
              ) : (
                filteredCommands.map((cmd, index) => (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      index === selectedIndex
                        ? "bg-indigo-500/20 text-white"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className={`shrink-0 ${index === selectedIndex ? "text-indigo-400" : "text-zinc-600"}`}>
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{cmd.label}</div>
                      {cmd.description && (
                        <div className="text-xs text-zinc-600 truncate">{cmd.description}</div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="shrink-0 px-2 py-1 text-[10px] font-medium text-zinc-600 bg-zinc-800/50 border border-white/10 rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {index === selectedIndex && (
                      <ChevronRight size={14} className="shrink-0 text-indigo-400" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/5 bg-black/20">
              <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800/50 border border-white/10 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-zinc-800/50 border border-white/10 rounded">↓</kbd>
                  <span className="ml-1">Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800/50 border border-white/10 rounded">↵</kbd>
                  <span className="ml-1">Select</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcuts(callbacks: {
  onOpenCommandPalette: () => void;
  onCloseModals: () => void;
  onFocusSearch: () => void;
  onSendMessage: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === "k") {
        e.preventDefault();
        callbacks.onOpenCommandPalette();
      }

      if (e.key === "Escape") {
        callbacks.onCloseModals();
      }

      if (modKey && e.key === "f") {
        e.preventDefault();
        callbacks.onFocusSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callbacks]);
}
