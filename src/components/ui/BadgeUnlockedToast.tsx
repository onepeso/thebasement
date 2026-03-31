"use client";

import { useEffect, useState } from 'react';
import { Award, X } from 'lucide-react';
import type { Badge } from '@/types/database';

interface BadgeUnlockedToastProps {
  badge: Badge | null;
  onClose: () => void;
}

const BADGE_ICONS: Record<string, string> = {
  'message': '💬',
  'message-circle': '💬',
  'message-square': '💬',
  'heart': '❤️',
  'pin': '📌',
  'plus-square': '➕',
  'layers': '📚',
  'log-in': '🚪',
  'flame': '🔥',
  'zap': '⚡',
  'at-sign': '@️',
  'corner-down-right': '↩️',
  'star': '⭐',
  'trophy': '🏆',
  'award': '🏅',
  'medal': '🎖️',
  'crown': '👑',
};

export function BadgeUnlockedToast({ badge, onClose }: BadgeUnlockedToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      setVisible(true);
    }
  }, [badge]);

  if (!badge || !visible) return null;

  const icon = BADGE_ICONS[badge.icon] || '🏅';

  return (
    <div className="fixed bottom-4 right-4 z-[300] animate-slide-in-right">
      <div className="relative">
        <div 
          className="absolute -inset-1 rounded-2xl blur-md opacity-75"
          style={{ backgroundColor: badge.color + '40' }}
        />
        <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4 max-w-sm">
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: badge.color + '30' }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} style={{ color: badge.color }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: badge.color }}>
                Badge Unlocked!
              </span>
            </div>
            <h4 className="text-white font-bold text-sm truncate">{badge.name}</h4>
            <p className="text-xs text-zinc-400">{badge.description}</p>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 300);
            }}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
