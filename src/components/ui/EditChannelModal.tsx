import { useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/useToastStore";
import { X, Hash, Trash2 } from "lucide-react";

interface EditChannelModalProps {
  channel: any;
  userId: string;
  isAdmin: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onRequestDelete?: (onConfirm: () => void) => void;
}

export function EditChannelModal({ channel, userId, isAdmin, onClose, onDelete, onRequestDelete }: EditChannelModalProps) {
  const { channels, setChannels } = useChatStore();
  const toast = useToast();
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || "");
  const [loading, setLoading] = useState(false);

  const canEdit = channel.created_by === userId || (isAdmin && channel.is_official);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    if (!canEdit) {
      toast.error("You don't have permission to edit this channel");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("channels")
      .update({
        name: name.trim(),
        description: description.trim() || null,
      })
      .eq("id", channel.id);

    if (error) {
      toast.error("Failed to update channel");
      setLoading(false);
      return;
    }

    const updatedChannels = channels.map((c: any) => 
      c.id === channel.id ? { ...c, name: name.trim(), description: description.trim() || null } : c
    );
    setChannels(updatedChannels);
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
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                <Hash size={18} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Edit Channel</h2>
                <p className="text-[10px] text-zinc-500">
                  {channel.is_official ? "Official Channel" : "Your Channel"}
                </p>
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
                disabled={!canEdit}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                placeholder="What's this channel about?"
                rows={2}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
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
              {canEdit && (
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
