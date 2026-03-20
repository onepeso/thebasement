import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';
import { User, Palette, Save, X } from 'lucide-react';

const AVATAR_SEEDS = ['cool', 'tech', 'gamer', 'bit', 'shade', 'neo', 'pixel', 'basement', 'vapor', 'retro', 'funky', 'bottts'];

export function SettingsModal({ myProfile }: { myProfile?: any }) {
  const { showSettings, setShowSettings } = useChatStore();
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  useEffect(() => {
    if (showSettings && myProfile) {
      setEditUsername(myProfile.username || '');
      setEditAvatar(myProfile.avatar_url || '');
    }
  }, [showSettings, myProfile]);

  if (!showSettings) return null;

  const handleSave = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ username: editUsername, avatar_url: editAvatar })
      .eq('id', myProfile.id);
    
    if (!error) setShowSettings(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
    >
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-xl" />
        
        <div className="relative bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-white">
          <button 
            onClick={() => setShowSettings(false)}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-indigo-600/20 rounded-xl">
              <User size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Profile Settings</h2>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Customize your identity</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-3">Username</label>
              <input 
                className="w-full bg-zinc-900/80 p-4 rounded-xl outline-none border border-white/5 focus:border-indigo-500/50 text-sm transition-all" 
                value={editUsername} 
                onChange={(e) => setEditUsername(e.target.value)} 
                placeholder="Enter username..."
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette size={14} className="text-zinc-500" />
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Choose Avatar</label>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_SEEDS.map(s => {
                  const url = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}`;
                  return (
                    <button
                      key={s} 
                      onClick={() => setEditAvatar(url)}
                      className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${editAvatar === url ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950 scale-105' : 'hover:scale-105 hover:ring-1 hover:ring-white/20'}`}
                    >
                      <img src={url} className="w-full h-full object-cover bg-zinc-800" alt="" />
                    </button>
                  );
                })}
              </div>
            </div>
            
            {editAvatar && (
              <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5">
                <img src={editAvatar} className="w-12 h-12 rounded-full bg-zinc-800" alt="" />
                <span className="text-xs text-zinc-500">Selected avatar preview</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button 
              onClick={handleSave} 
              className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 p-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Save size={16} /> Save Changes
            </button>
            <button 
              onClick={() => setShowSettings(false)} 
              className="px-6 py-4 text-zinc-500 hover:text-white font-semibold text-sm uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}