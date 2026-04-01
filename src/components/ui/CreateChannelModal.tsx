import { useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/useToastStore";
import { X, Hash, Palette, Sparkles } from "lucide-react";

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

interface CreateChannelModalProps {
  userId: string;
  onClose: () => void;
  onChannelCreated?: () => void;
}

export function CreateChannelModal({ userId, onClose, onChannelCreated }: CreateChannelModalProps) {
  const { channels, setChannels, setActiveChannel } = useChatStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("💬");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [color, setColor] = useState("indigo");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [accentColor, setAccentColor] = useState("white");
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const myChannels = channels.filter((c: any) => c.created_by === userId);
  const canCreate = myChannels.length < 3;

  const generatedSlug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  const slugExists = channels.some((c: any) => c.slug === generatedSlug);
  const canCreateFinal = canCreate && name.trim() && !slugExists;

  const selectedGradient = GRADIENT_OPTIONS.find(g => g.id === color) || GRADIENT_OPTIONS[0];

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    if (!canCreate) {
      toast.error("You can only create up to 3 channels");
      return;
    }

    if (slugExists) {
      toast.error("A channel with this name already exists");
      return;
    }

    setLoading(true);

    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

    const { data, error } = await supabase
      .from("channels")
      .insert({
        name: name.trim(),
        slug,
        description: description.trim() || null,
        emoji: emoji,
        color: color,
        accent_color: accentColor,
        created_by: userId,
        is_official: false,
        is_private: isPrivate,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast.error("A channel with this name already exists");
      } else {
        toast.error("Failed to create channel");
      }
      setLoading(false);
      return;
    }

    await supabase.from("channel_members").insert({
      channel_id: data.id,
      user_id: userId,
      role: "owner",
    });

    const updatedChannels = [...channels, data];
    setChannels(updatedChannels);
    setActiveChannel(data);
    toast.success("Channel created!");
    onChannelCreated?.();
    onClose();
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
              <h2 className="text-sm font-semibold text-white">Create Channel</h2>
              <p className="text-[10px] text-zinc-500">{myChannels.length}/3</p>
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
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-white/10 flex items-center justify-center text-lg hover:bg-zinc-800 transition-colors"
                >
                  {emoji}
                </button>
                {showEmojiPicker && (
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
              <div className="flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Channel name"
                  className={`w-full px-3 py-2.5 bg-zinc-900/50 border rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all ${
                    name.trim() && slugExists ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  autoFocus
                />
              </div>
              {name.trim() && slugExists && (
                <p className="text-[10px] text-red-400 mt-1">A channel with this name already exists</p>
              )}
            </div>

            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-zinc-900/30 rounded-lg border border-white/5">
              <p className="text-xs text-zinc-300">Private</p>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative w-10 h-5 rounded-full transition-colors ${isPrivate ? 'bg-indigo-600' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isPrivate ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-white/5 bg-black/20">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!canCreateFinal || loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:cursor-not-allowed py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? "..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
