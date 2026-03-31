import { useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/useToastStore";
import { X, Hash, Trash2, Palette, Sparkles } from "lucide-react";

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

    // Only update emoji and color if user is the creator
    if (canEdit) {
      updateData.emoji = emoji;
      updateData.color = color;
      updateData.accent_color = accentColor;
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
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="absolute -inset-1 rounded-2xl blur-xl" style={{ background: `linear-gradient(135deg, ${selectedGradient.from}40, ${selectedGradient.to}40)` }} />
        
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Color Banner */}
          <div 
            className="h-20 relative"
            style={{ background: `linear-gradient(135deg, ${selectedGradient.from}, ${selectedGradient.to})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
            <div className="absolute -bottom-6 left-4 flex gap-2">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border-2 border-white/20 flex items-center justify-center text-xl">
                {channel.emoji || emoji}
              </div>
              {canEdit && (
                <>
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-12 h-12 rounded-xl bg-zinc-900/80 border-2 border-white/20 flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    style={{ background: `linear-gradient(135deg, ${selectedGradient.from}, ${selectedGradient.to})` }}
                  >
                    <Palette size={18} className="text-white" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowAccentPicker(!showAccentPicker)}
                      className="w-12 h-12 rounded-xl bg-zinc-900/80 border-2 border-white/20 flex items-center justify-center hover:bg-zinc-800 transition-colors"
                      style={{ borderColor: ACCENT_OPTIONS.find(a => a.id === accentColor)?.color }}
                    >
                      <Sparkles size={18} style={{ color: ACCENT_OPTIONS.find(a => a.id === accentColor)?.color }} />
                    </button>
                    {showAccentPicker && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3 z-50 animate-scale-in">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Accent Color</p>
                        <div className="grid grid-cols-5 gap-2">
                          {ACCENT_OPTIONS.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => {
                                setAccentColor(a.id);
                                setShowAccentPicker(false);
                              }}
                              className={`w-full aspect-square rounded-lg transition-all ${accentColor === a.id ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'hover:scale-110'}`}
                              style={{ backgroundColor: a.color }}
                              title={a.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {showColorPicker && canEdit && (
              <div className="absolute top-full left-4 mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3 z-50 animate-scale-in">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Theme Color</p>
                <div className="grid grid-cols-5 gap-2">
                  {GRADIENT_OPTIONS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setColor(g.id);
                        setShowColorPicker(false);
                      }}
                      className={`w-full aspect-square rounded-lg transition-all ${color === g.id ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'hover:scale-110'}`}
                      style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                      title={g.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 pt-8 border-b border-white/5">
            <div>
              <h2 className="text-base font-bold text-white">Edit Channel</h2>
              <p className="text-[10px] text-zinc-500">
                {channel.is_official ? "Official Channel" : canEdit ? "Your Channel" : "View Only"}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Emoji & Name Row */}
            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={() => canEdit && setShowEmojiPicker(!showEmojiPicker)}
                  disabled={!canEdit}
                  className={`w-12 h-12 rounded-xl bg-zinc-800/50 border border-white/10 flex items-center justify-center text-xl transition-colors ${canEdit ? 'hover:bg-zinc-800 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                  {emoji}
                </button>
                {showEmojiPicker && canEdit && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-scale-in">
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={e}
                          onClick={() => {
                            setEmoji(e);
                            setShowEmojiPicker(false);
                          }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 transition-colors ${emoji === e ? 'bg-indigo-500/20' : ''}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEditOfficial}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEditOfficial}
                placeholder="What's this channel about?"
                rows={2}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex gap-3">
              {canEdit && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-4 py-3 text-zinc-400 hover:text-white font-semibold text-sm uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              {canEditOfficial && (
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-zinc-700 disabled:to-zinc-600 disabled:cursor-not-allowed rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
