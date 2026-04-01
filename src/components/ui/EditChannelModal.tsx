import { useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/useToastStore";
import { X, Hash, Trash2, Palette, Sparkles, Lock, Globe } from "lucide-react";

const EMOJI_OPTIONS = [
  "💬", "🎮", "🎵", "🎬", "📸", "🎨", "📚", "💻", 
  "🏆", "🎉", "🔥", "⭐", "🌟", "💡", "🎯", "🎲",
  "🎸", "🎤", "🎧", "🕹️", "♟️", "🏀",
  "⚽", "🎾", "🏋️", "🚴", "🏊", "🎳", "🎱",
  "🍕", "🍔", "🍜", "☕", "🍺", "🍷", "🎂", "🍰",
  "🌈", "🌊", "🌋", "🏔️", "🌲", "🌸", "🍀", "🌙",
  "❤️", "💜", "💙", "💚", "🧡", "💛", "🖤", "🤍",
];

const GRADIENT_OPTIONS = [
  { id: 'indigo', name: 'Indigo', from: '#4f46e5', to: '#7c3aed' },
  { id: 'blue', name: 'Ocean', from: '#2563eb', to: '#06b6d4' },
  { id: 'purple', name: 'Royal', from: '#9333ea', to: '#db2777' },
  { id: 'emerald', name: 'Forest', from: '#059669', to: '#10b981' },
  { id: 'orange', name: 'Sunset', from: '#ea580c', to: '#f97316' },
  { id: 'red', name: 'Fire', from: '#dc2626', to: '#f43f5e' },
  { id: 'pink', name: 'Dream', from: '#db2777', to: '#e879f9' },
  { id: 'cyan', name: 'Teal', from: '#0891b2', to: '#22d3ee' },
  { id: 'amber', name: 'Gold', from: '#d97706', to: '#fbbf24' },
  { id: 'slate', name: 'Night', from: '#334155', to: '#64748b' },
];

const ACCENT_OPTIONS = [
  { id: 'white', name: 'White', color: '#ffffff' },
  { id: 'yellow', name: 'Yellow', color: '#facc15' },
  { id: 'green', name: 'Green', color: '#22c55e' },
  { id: 'blue', name: 'Blue', color: '#3b82f6' },
  { id: 'purple', name: 'Purple', color: '#a855f7' },
  { id: 'pink', name: 'Pink', color: '#ec4899' },
  { id: 'red', name: 'Red', color: '#ef4444' },
  { id: 'orange', name: 'Orange', color: '#f97316' },
  { id: 'teal', name: 'Teal', color: '#14b8a6' },
  { id: 'indigo', name: 'Indigo', color: '#6366f1' },
];

interface EditChannelModalProps {
  channel: any;
  userId: string;
  isAdmin: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onRequestDelete?: (onConfirm: () => void) => void;
}

export function EditChannelModal({ channel, userId, isAdmin, onClose, onDelete, onRequestDelete }: EditChannelModalProps) {
  const { channels, setChannels, activeChannel, setActiveChannel } = useChatStore();
  const toast = useToast();
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || "");
  const [emoji, setEmoji] = useState(channel.emoji || "💬");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [color, setColor] = useState(channel.color || "indigo");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [accentColor, setAccentColor] = useState(channel.accent_color || "white");
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [isPrivate, setIsPrivate] = useState(channel.is_private || false);
  const [loading, setLoading] = useState(false);

  // Only the creator can edit (not admins for official channels)
  const canEdit = channel.created_by === userId;
  const canEditOfficial = channel.created_by === userId || (isAdmin && channel.is_official);

  const selectedGradient = GRADIENT_OPTIONS.find(g => g.id === color) || GRADIENT_OPTIONS[0];

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    if (!canEditOfficial) {
      toast.error("You don't have permission to edit this channel");
      return;
    }

    setLoading(true);

    const updateData: Record<string, any> = {
      name: name.trim(),
      description: description.trim() || null,
    };

    // Only update emoji, color, and visibility if user is the creator
    if (canEdit) {
      updateData.emoji = emoji;
      updateData.color = color;
      updateData.accent_color = accentColor;
      updateData.is_private = isPrivate;
    }

    const { error } = await supabase
      .from("channels")
      .update(updateData)
      .eq("id", channel.id);

    if (error) {
      toast.error("Failed to update channel");
      setLoading(false);
      return;
    }

    const updatedChannel = { ...channel, ...updateData };
    const updatedChannels = channels.map((c: any) => 
      c.id === channel.id ? updatedChannel : c
    );
    setChannels(updatedChannels);
    
    if (activeChannel?.id === channel.id) {
      setActiveChannel(updatedChannel);
    }
    
    toast.success("Channel updated!");
    onClose();
  };

  const handleDelete = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to delete this channel");
      return;
    }

    const doDelete = async () => {
      setLoading(true);

      const { error } = await supabase
        .from("channels")
        .delete()
        .eq("id", channel.id);

      if (error) {
        toast.error("Failed to delete channel");
        setLoading(false);
        return;
      }

      const updatedChannels = channels.filter((c: any) => c.id !== channel.id);
      setChannels(updatedChannels);
      toast.success("Channel deleted!");
      onClose();
      onDelete?.();
    };

    if (onRequestDelete) {
      onRequestDelete(doDelete);
    } else {
      doDelete();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div>
              <h2 className="text-sm font-semibold text-white">Edit Channel</h2>
              <p className="text-[10px] text-zinc-500">
                {channel.is_official ? "Official" : canEdit ? "Your Channel" : "View Only"}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => canEdit && setShowEmojiPicker(!showEmojiPicker)}
                  disabled={!canEdit}
                  className={`w-10 h-10 rounded-lg bg-zinc-800/50 border border-white/10 flex items-center justify-center text-lg transition-colors ${canEdit ? 'hover:bg-zinc-800 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                  {emoji}
                </button>
                {showEmojiPicker && canEdit && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-scale-in">
                    <div className="grid grid-cols-8 gap-0.5">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={e}
                          onClick={() => {
                            setEmoji(e);
                            setShowEmojiPicker(false);
                          }}
                          className={`w-6 h-6 rounded flex items-center justify-center text-sm hover:bg-white/10 transition-colors ${emoji === e ? 'bg-indigo-500/20' : ''}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {canEdit && (
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    style={{ background: `linear-gradient(135deg, ${selectedGradient.from}, ${selectedGradient.to})` }}
                  >
                    <Palette size={14} className="text-white" />
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-2 w-52 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-scale-in">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5">Color</p>
                      <div className="grid grid-cols-5 gap-1">
                        {GRADIENT_OPTIONS.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => {
                              setColor(g.id);
                              setShowColorPicker(false);
                            }}
                            className={`w-full aspect-square rounded transition-all ${color === g.id ? 'ring-1 ring-white' : ''}`}
                            style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEditOfficial}
                  className="w-full px-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEditOfficial}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[10px] font-medium transition-all ${
                    !isPrivate
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                      : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Globe size={12} />
                  Public
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[10px] font-medium transition-all ${
                    isPrivate
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                      : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Lock size={12} />
                  Private
                </button>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-white/5 bg-black/20">
            <div className="flex gap-2">
              {canEdit && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-[10px] font-medium transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-3 py-2 text-zinc-400 hover:text-white text-[10px] font-medium transition-colors"
              >
                Cancel
              </button>
              {canEditOfficial && (
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-[10px] font-medium transition-all flex items-center gap-1.5"
                >
                  {loading ? "..." : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
