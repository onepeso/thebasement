import { useEffect, useCallback, useState, useRef } from 'react';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { useChatStore } from '@/store/useChatStore';

const playNotificationSound = () => {
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
};

export function useNotifications(currentUserId: string | undefined, currentUsername: string | undefined) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const notificationSettings = useChatStore((state) => state.notificationSettings);
  const lastNotificationRef = useRef<number>(0);

  useEffect(() => {
    async function initNotifications() {
      let granted = await isPermissionGranted();
      console.log('Notification permission status:', granted);
      
      if (!granted) {
        const permission = await requestPermission();
        console.log('Permission request result:', permission);
        granted = permission === 'granted';
      }
      
      setPermissionGranted(granted);
    }
    
    initNotifications();
  }, []);

  const notifyMention = useCallback((senderName: string, messageText: string, channelName: string) => {
    const now = Date.now();
    if (now - lastNotificationRef.current < 2000) return;
    lastNotificationRef.current = now;
    
    if (notificationSettings.sound) {
      playNotificationSound();
    }
    
    if (permissionGranted) {
      sendNotification({
        title: `💬 ${senderName} mentioned you`,
        body: `#${channelName}: ${messageText.length > 80 ? messageText.substring(0, 80) + '...' : messageText}`,
      });
    }
  }, [permissionGranted, notificationSettings.sound]);

  const notifyNewMessage = useCallback((senderName: string, messageText: string, channelName: string) => {
    if (!permissionGranted || !notificationSettings.directMessages) return;
    
    const now = Date.now();
    if (now - lastNotificationRef.current < 2000) return;
    lastNotificationRef.current = now;
    
    if (notificationSettings.sound) {
      playNotificationSound();
    }
    
    sendNotification({
      title: `💬 ${senderName} in #${channelName}`,
      body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
    });
  }, [permissionGranted, notificationSettings.sound]);

  const testNotification = useCallback(() => {
    if (notificationSettings.sound) {
      playNotificationSound();
    }
    if (permissionGranted) {
      sendNotification({
        title: '🔔 The Basement',
        body: 'Notifications are working! You\'ll be notified when someone mentions you.',
      });
    }
  }, [permissionGranted, notificationSettings.sound]);

  const checkForMention = useCallback((message: any, channelName: string) => {
    if (!currentUsername || message.user_id === currentUserId) return;
    if (!notificationSettings.mentions) return;
    
    const mentionPattern = new RegExp(`@${currentUsername}\\b`, 'i');
    if (mentionPattern.test(message.text)) {
      const senderName = message.profiles?.username || 'Someone';
      notifyMention(senderName, message.text, channelName);
    }
  }, [currentUsername, currentUserId, notifyMention, notificationSettings.mentions]);

  const checkForNewMessage = useCallback((message: any, channelName: string) => {
    if (!currentUsername || message.user_id === currentUserId) return;
    if (!notificationSettings.directMessages) return;
    
    const senderName = message.profiles?.username || 'Someone';
    notifyNewMessage(senderName, message.text, channelName);
  }, [currentUsername, currentUserId, notifyNewMessage, notificationSettings.directMessages]);

  return { notifyMention, notifyNewMessage, checkForMention, checkForNewMessage, testNotification, permissionGranted };
}
