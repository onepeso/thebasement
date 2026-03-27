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
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 rounded-2xl blur-xl" />

        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              {destructive && (
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
              )}
              <h2 className="text-base font-bold text-white">{title}</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            <p className="text-sm text-zinc-400 leading-relaxed">{message}</p>
          </div>

          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-sm rounded-xl transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-3 font-bold text-sm rounded-xl transition-all shadow-lg ${
                  destructive
                    ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-zinc-700 disabled:to-zinc-600 text-white shadow-red-500/20"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-zinc-700 disabled:to-zinc-600 text-white shadow-indigo-500/20"
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
