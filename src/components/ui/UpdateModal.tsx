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
      <div className="relative w-full max-w-xs animate-scale-in">
        <div className="relative bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-all z-10"
          >
            <X size={14} />
          </button>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <RefreshCw size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Update</h2>
                <p className="text-[10px] text-zinc-400">
                  {isChecking ? 'Checking...' : 
                   update ? `v${update.version}` : 'Up to date!'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">
                {error}
              </div>
            )}

            {isDownloading && (
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-400">Downloading...</span>
                  <span className="text-white font-medium">{downloadProgress}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {update && !isDownloading && (
              <div className="mb-3">
                {update.body && (
                  <div className="p-2 bg-zinc-800/50 rounded border border-white/5">
                    <p className="text-xs text-zinc-300 whitespace-pre-wrap">{update.body}</p>
                  </div>
                )}

                <button
                  onClick={handleInstall}
                  className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-all"
                >
                  <Download size={12} />
                  Download
                </button>
              </div>
            )}

            {!update && !isChecking && !error && (
              <div className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded border border-white/5">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                <p className="text-xs text-zinc-300">
                  Latest version installed
                </p>
              </div>
            )}

            {isChecking && (
              <div className="flex items-center justify-center py-3">
                <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            )}

            {!isChecking && !isDownloading && (
              <button
                onClick={checkForUpdates}
                className="w-full mt-2 py-1.5 text-[10px] text-zinc-500 hover:text-white transition-colors"
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
