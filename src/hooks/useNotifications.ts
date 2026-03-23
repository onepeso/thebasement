import { useEffect, useCallback, useState } from 'react';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { useChatStore } from '@/store/useChatStore';

export function useNotifications(currentUserId: string | undefined, currentUsername: string | undefined) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const notificationSettings = useChatStore((state) => state.notificationSettings);

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
    if (!permissionGranted) return;
    sendNotification({
      title: `💬 ${senderName} mentioned you`,
      body: `#${channelName}: ${messageText.length > 80 ? messageText.substring(0, 80) + '...' : messageText}`,
    });
  }, [permissionGranted]);

  const notifyNewMessage = useCallback((senderName: string, messageText: string, channelName: string) => {
    if (!permissionGranted || !notificationSettings.directMessages) return;
    sendNotification({
      title: `💬 ${senderName} in #${channelName}`,
      body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
    });
  }, [permissionGranted, notificationSettings.directMessages]);

  const testNotification = useCallback(() => {
    if (!permissionGranted) return;
    sendNotification({
      title: '🔔 The Basement',
      body: 'Notifications are working! You\'ll be notified when someone mentions you.',
    });
  }, [permissionGranted]);

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
