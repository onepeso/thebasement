import { useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/useToastStore";
import { X, Hash } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  const myChannels = channels.filter((c: any) => c.created_by === userId);
  const canCreate = myChannels.length < 3;

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    if (!canCreate) {
      toast.error("You can only create up to 3 channels");
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
        created_by: userId,
        is_official: false,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create channel");
      setLoading(false);
      return;
    }

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
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                <Hash size={18} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Create Channel</h2>
                <p className="text-[10px] text-zinc-500">{myChannels.length}/3 channels created</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Channel Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. gaming, music, memes"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this channel about?"
                rows={2}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              />
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-zinc-400 hover:text-white font-semibold text-sm uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !canCreate || loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-zinc-700 disabled:to-zinc-600 disabled:cursor-not-allowed p-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {loading ? "Creating..." : "Create Channel"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
