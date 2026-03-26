"use client";

import { X, RefreshCw } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';

interface UpdateNotificationProps {
  version: string;
  onUpdate: () => void;
}

export function UpdateNotification({ version, onUpdate }: UpdateNotificationProps) {
  const { dismissUpdate } = useChatStore();

  const handleUpdate = () => {
    dismissUpdate(version);
    onUpdate();
  };

  const handleLater = () => {
    dismissUpdate(version);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[300] animate-slide-up">
      <div className="relative w-80">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-emerald-500/30 rounded-2xl blur-lg opacity-75" />
        
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <button
            onClick={handleLater}
            className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={16} />
          </button>

          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <RefreshCw size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">
                  Update Available
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Version {version} is ready
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              Go to Settings → About to update, or click below
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleLater}
                className="flex-1 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
              >
                Update Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
