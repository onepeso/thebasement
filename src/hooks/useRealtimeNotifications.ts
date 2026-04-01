"use client";

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/store/useToastStore';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  body: string;
  channel_id?: string;
}

export function useRealtimeNotifications(userId: string | undefined) {
  const toast = useToast();
  const subscriptionRef = useRef<any>(null);
  const lastNotificationRef = useRef<number>(0);
  
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Could not play sound:', e);
    }
  }, []);

  const handleNotification = useCallback((notification: NotificationData) => {
    const now = Date.now();
    if (now - lastNotificationRef.current < 2000) return;
    lastNotificationRef.current = now;
    
    playNotificationSound();
    
    toast.info(`${notification.title}: ${notification.body}`);
  }, [playNotificationSound, toast]);

  useEffect(() => {
    if (!userId) return;

    const subscribeToNotifications = async () => {
      // Ensure settings exist for user
      const { data: existingSettings } = await supabase
        .from('notification_settings')
        .select('mentions, sound')
        .eq('user_id', userId)
        .single();
      
      if (!existingSettings) {
        // Create default settings
        await supabase.from('notification_settings').insert({
          user_id: userId,
          mentions: true,
          invites: true,
          sound: true,
        });
        return;
      }
      
      if (!existingSettings.mentions) return;

      const channel = supabase
        .channel(`user-notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            const notification = payload.new as NotificationData;
            
            // Mark as read immediately
            await supabase
              .from('user_notifications')
              .update({ read: true })
              .eq('id', notification.id);
            
            // Only notify for mentions
            if (notification.type === 'mention') {
              handleNotification(notification);
            }
          }
        )
        .subscribe();

      subscriptionRef.current = channel;
    };

    subscribeToNotifications();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [userId, handleNotification]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
  }, [userId]);

  return { markAsRead, markAllAsRead };
}
