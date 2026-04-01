"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="relative w-full max-w-xs animate-scale-in">
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              {destructive && (
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={14} className="text-red-400" />
                </div>
              )}
              <h2 className="text-sm font-semibold text-white">{title}</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-4 py-3">
            <p className="text-xs text-zinc-400 leading-relaxed">{message}</p>
          </div>

          <div className="px-4 py-3 border-t border-white/5 bg-black/20">
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-medium rounded-lg transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 py-2 font-medium text-xs rounded-lg transition-all ${
                  destructive
                    ? "bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white"
                } disabled:cursor-not-allowed`}
              >
                {loading ? "..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [config, setConfig] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const confirm = (params: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfig({ ...params, open: true });
  };

  const close = () => {
    setConfig((prev) => ({ ...prev, open: false }));
  };

  return { confirm, ConfirmComponent: ConfirmModal, config, close };
}
