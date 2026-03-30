import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/store/useToastStore';

interface SpamProtectionState {
  isRateLimited: boolean;
  cooldownSeconds: number;
  messagesInLast10Sec: number;
}

const SHORT_COOLDOWN = 3; // 3 seconds for 10+ messages in 10 sec
const MESSAGE_WINDOW = 10000; // 10 seconds in ms
const MESSAGE_LIMIT = 10; // 10 messages triggers cooldown

export function useSpamProtection() {
  const [state, setState] = useState<SpamProtectionState>({
    isRateLimited: false,
    cooldownSeconds: 0,
    messagesInLast10Sec: 0,
  });
  
  const messageTimestamps = useRef<number[]>([]);
  const cooldownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownEndedShown = useRef(false);
  const toast = useToast();

  const cleanupTimestamps = useCallback(() => {
    const now = Date.now();
    messageTimestamps.current = messageTimestamps.current.filter(
      timestamp => now - timestamp < MESSAGE_WINDOW
    );
  }, []);

  const calculateCooldown = useCallback((count: number): number => {
    if (count >= MESSAGE_LIMIT) return SHORT_COOLDOWN;
    return 0;
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    if (cooldownInterval.current) {
      clearInterval(cooldownInterval.current);
    }

    cooldownEndedShown.current = false;

    setState(prev => ({
      ...prev,
      isRateLimited: true,
      cooldownSeconds: seconds,
    }));

    cooldownInterval.current = setInterval(() => {
      setState(prev => {
        if (prev.cooldownSeconds <= 1) {
          if (cooldownInterval.current) {
            clearInterval(cooldownInterval.current);
            cooldownInterval.current = null;
          }
          if (!cooldownEndedShown.current) {
            cooldownEndedShown.current = true;
            toast.success('You can send messages again!');
          }
          return {
            ...prev,
            isRateLimited: false,
            cooldownSeconds: 0,
          };
        }
        return {
          ...prev,
          cooldownSeconds: prev.cooldownSeconds - 1,
        };
      });
    }, 1000);
  }, [toast]);

  const canSendMessage = useCallback((): boolean => {
    cleanupTimestamps();
    return messageTimestamps.current.length < MESSAGE_LIMIT;
  }, [cleanupTimestamps]);

  const recordMessage = useCallback(() => {
    if (state.isRateLimited) return; // Don't record if already rate limited
    
    cleanupTimestamps();
    
    const now = Date.now();
    messageTimestamps.current.push(now);
    
    const count = messageTimestamps.current.length;
    
    // Calculate cooldown based on current count
    const cooldown = calculateCooldown(count);
    
    if (cooldown > 0) {
      toast.info(`Slow down! Cooldown: ${SHORT_COOLDOWN} seconds`);
      startCooldown(cooldown);
    }
    
    setState(prev => ({
      ...prev,
      messagesInLast10Sec: count,
    }));
  }, [cleanupTimestamps, calculateCooldown, state.isRateLimited, toast, startCooldown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownInterval.current) {
        clearInterval(cooldownInterval.current);
      }
      cooldownEndedShown.current = true; // Prevent toast after unmount
    };
  }, []);

  return {
    isRateLimited: state.isRateLimited,
    cooldownSeconds: state.cooldownSeconds,
    messagesInLast10Sec: state.messagesInLast10Sec,
    canSendMessage,
    recordMessage,
  };
}
