"use client";

import { X } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
}

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts: { category: string; items: Shortcut[] }[] = [
    {
      category: "General",
      items: [
        { keys: ["Ctrl", "K"], description: "Open command palette" },
        { keys: ["Ctrl", "F"], description: "Focus search" },
        { keys: ["Esc"], description: "Close modal / Cancel" },
      ],
    },
    {
      category: "Messages",
      items: [
        { keys: ["Ctrl", "Enter"], description: "Send message" },
        { keys: ["↑"], description: "Edit last message" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["Ctrl", "Shift", "→"], description: "Next channel" },
        { keys: ["Ctrl", "Shift", "←"], description: "Previous channel" },
        { keys: ["↑", "↓"], description: "Navigate in command palette" },
      ],
    },
  ];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl" />

        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h2 className="text-base font-bold text-white">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 bg-zinc-900/30 rounded-lg"
                    >
                      <span className="text-sm text-zinc-400">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <kbd
                            key={j}
                            className="px-2 py-1 text-[10px] font-bold text-zinc-400 bg-zinc-800/50 border border-white/10 rounded"
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

          <div className="p-4 border-t border-white/5 bg-black/20">
            <p className="text-[10px] text-zinc-600 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-zinc-800/50 border border-white/10 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-800/50 border border-white/10 rounded">K</kbd> anytime to open command palette
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
