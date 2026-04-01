"use client";

import { X } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";

interface Shortcut {
  keys: string[];
  description: string;
}

export function KeyboardShortcutsModal() {
  const { showKeyboardShortcuts, setShowKeyboardShortcuts } = useChatStore();

  const shortcuts: { category: string; items: Shortcut[] }[] = [
    {
      category: "General",
      items: [
        { keys: ["Ctrl", "K"], description: "Open search" },
        { keys: ["Ctrl", "/"], description: "Show shortcuts" },
        { keys: ["Esc"], description: "Close modal / Cancel" },
      ],
    },
    {
      category: "Messages",
      items: [
        { keys: ["Ctrl", "Enter"], description: "Send message" },
        { keys: ["Enter"], description: "New line in message" },
      ],
    },
  ];

  if (!showKeyboardShortcuts) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && setShowKeyboardShortcuts(false)}
    >
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Shortcuts</h2>
            <button
              onClick={() => setShowKeyboardShortcuts(false)}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-3 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-[9px] font-bold text-indigo-400 uppercase mb-2">
                  {section.category}
                </h3>
                <div className="space-y-1">
                  {section.items.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 px-2 bg-zinc-900/30 rounded-lg"
                    >
                      <span className="text-xs text-zinc-300">{shortcut.description}</span>
                      <div className="flex items-center gap-0.5">
                        {shortcut.keys.map((key, j) => (
                          <kbd
                            key={j}
                            className="px-1.5 py-0.5 text-[9px] font-medium text-zinc-300 bg-zinc-800 border border-white/10 rounded"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-white/5 bg-black/20">
            <p className="text-[9px] text-zinc-500 text-center">
              <kbd className="px-1 py-0.5 bg-zinc-800 border border-white/10 rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-zinc-800 border border-white/10 rounded">K</kbd> to search
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
