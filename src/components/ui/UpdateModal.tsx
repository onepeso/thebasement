"use client";

import { useState } from 'react';
import { X, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useUpdate } from '@/hooks/useUpdate';

interface UpdateModalProps {
  onClose: () => void;
}

export function UpdateModal({ onClose }: UpdateModalProps) {
  const {
    update,
    isChecking,
    isDownloading,
    downloadProgress,
    error,
    checkForUpdates,
    downloadAndInstall,
  } = useUpdate();

  const [isInstalled, setIsInstalled] = useState(false);

  const handleInstall = async () => {
    await downloadAndInstall();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-2xl blur-xl" />

        <div className="relative bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-all z-10"
          >
            <X size={18} />
          </button>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <RefreshCw size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Update Available</h2>
                <p className="text-sm text-zinc-400">
                  {isChecking ? 'Checking for updates...' : 
                   update ? `Version ${update.version}` : 'You\'re up to date!'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {isDownloading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Downloading update...</span>
                  <span className="text-white font-medium">{downloadProgress}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {update && !isDownloading && (
              <div className="mb-4">
                {update.body && (
                  <div className="p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{update.body}</p>
                  </div>
                )}

                <button
                  onClick={handleInstall}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Download size={18} />
                  Download & Install Update
                </button>
              </div>
            )}

            {!update && !isChecking && !error && (
              <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                <CheckCircle size={20} className="text-emerald-500" />
                <p className="text-sm text-zinc-300">
                  You have the latest version. No updates available.
                </p>
              </div>
            )}

            {isChecking && (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            )}

            {!isChecking && !isDownloading && (
              <button
                onClick={checkForUpdates}
                className="w-full mt-3 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Check for Updates
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
