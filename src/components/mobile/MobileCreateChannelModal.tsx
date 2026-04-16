"use client";

import { useState } from "react";
import { X, Hash, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/useToastStore";
import { useChatStore } from "@/store/useChatStore";

interface MobileCreateChannelModalProps {
  userId: string;
  onClose: () => void;
}

const CHANNEL_COLORS = [
  { id: "indigo", from: "#4f46e5", to: "#7c3aed" },
  { id: "blue", from: "#2563eb", to: "#06b6d4" },
  { id: "purple", from: "#9333ea", to: "#db2777" },
  { id: "emerald", from: "#059669", to: "#10b981" },
  { id: "orange", from: "#ea580c", to: "#f97316" },
  { id: "red", from: "#dc2626", to: "#f43f5e" },
];

export function MobileCreateChannelModal({ userId, onClose }: MobileCreateChannelModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedColor, setSelectedColor] = useState(CHANNEL_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { setChannels } = useChatStore();

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a channel name");
      return;
    }

    setLoading(true);

    const slug = generateSlug(name.trim());
    const accentColor = selectedColor.from;

    const { data, error } = await supabase
      .from("channels")
      .insert({
        name: name.trim(),
        slug,
        description: description.trim() || null,
        is_private: isPrivate,
        created_by: userId,
        color: selectedColor.id,
        accent_color: accentColor,
      })
      .select()
      .single();

    if (error) {
      console.error("Create channel error:", error);
      toast.error(error.message || "Failed to create channel");
      setLoading(false);
      return;
    }

    if (data) {
      await supabase.from("channel_members").insert({
        channel_id: data.id,
        user_id: userId,
        role: "owner",
      });

      await supabase.from("messages").insert({
        channel_id: data.id,
        user_id: userId,
        text: "created the channel",
        is_system: true,
      });

      toast.success("Channel created!");
      onClose();
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
        <h2 className="text-lg font-semibold text-white">Create Channel</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <X size={22} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-2">Channel Name</label>
          <div className="relative">
            <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-channel"
              className="w-full bg-zinc-900/80 p-4 pl-11 rounded-xl border border-white/10 focus:border-indigo-500/50 text-base outline-none transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this channel about?"
            rows={3}
            className="w-full bg-zinc-900/80 p-4 rounded-xl border border-white/10 focus:border-indigo-500/50 text-base outline-none transition-all resize-none"
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-2">Accent Color</label>
          <div className="flex gap-3">
            {CHANNEL_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color)}
                className={`w-12 h-12 rounded-xl transition-all ${
                  selectedColor.id === color.id ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110" : "hover:scale-105"
                }`}
                style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
              />
            ))}
          </div>
        </div>

        {/* Private Toggle */}
        <div
          className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl cursor-pointer"
          onClick={() => setIsPrivate(!isPrivate)}
        >
          <div className="flex items-center gap-3">
            <Lock size={18} className={isPrivate ? "text-indigo-400" : "text-zinc-500"} />
            <div>
              <p className="text-sm font-medium text-white">Private Channel</p>
              <p className="text-xs text-zinc-500">Only invited members can view</p>
            </div>
          </div>
          <div
            className={`w-12 h-7 rounded-full transition-all relative ${
              isPrivate ? "bg-indigo-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                isPrivate ? "left-6" : "left-1"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 py-4 rounded-xl font-semibold text-base text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Create Channel"
          )}
        </button>
      </div>
    </div>
  );
}
