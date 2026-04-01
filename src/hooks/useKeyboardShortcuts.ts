import { useEffect, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';

export function useGlobalKeyboardShortcuts(handlers: {
  onEscape?: () => void;
  onEnter?: () => void;
  onSlash?: () => void;
  onCtrlK?: () => void;
  onCtrlEnter?: () => void;
}) {
  const { setShowSettings, showSettings, setShowKeyboardShortcuts, showKeyboardShortcuts } = useChatStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Escape - Close modals
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
          handlers.onEscape?.();
          return;
        }
        if (showKeyboardShortcuts) {
          setShowKeyboardShortcuts(false);
          return;
        }
        handlers.onEscape?.();
        return;
      }

      // Ctrl/Cmd + Enter - Send message (when in textarea)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (target.tagName === 'TEXTAREA') {
          e.preventDefault();
          handlers.onCtrlEnter?.();
          return;
        }
      }

      // Ctrl/Cmd + K - Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handlers.onCtrlK?.();
        return;
      }

      // Ctrl/Cmd + / - Show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
        return;
      }

      // / - Slash commands (when in input, not in message input)
      if (e.key === '/' && !isInput) {
        handlers.onSlash?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, setShowSettings, showSettings, setShowKeyboardShortcuts, showKeyboardShortcuts]);
}
