import { useState, useEffect, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  version: string;
  date?: string;
  body?: string;
}

export function useUpdate() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const update = await check();
      
      if (update) {
        setUpdate(update);
        setUpdateInfo({
          version: update.version,
          date: update.date,
          body: update.body,
        });
      } else {
        setUpdate(null);
        setUpdateInfo(null);
      }
    } catch (e) {
      console.error('Update check failed:', e);
      setError('Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (!update) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);
    
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === 'Progress') {
          const chunkLength = event.data.chunkLength;
          setDownloadProgress((prev) => Math.min(prev + 5, 95));
        }
      });
      
      await relaunch();
    } catch (e) {
      console.error('Update failed:', e);
      setError('Failed to download update');
      setIsDownloading(false);
    }
  }, [update]);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    update: updateInfo,
    isChecking,
    isDownloading,
    downloadProgress,
    error,
    checkForUpdates,
    downloadAndInstall,
  };
}
