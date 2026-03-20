import { supabase } from "@/lib/supabase";
import { useChatStore } from "@/store/useChatStore";
import { LogOut, Hash, ChevronDown } from "lucide-react";

export function Sidebar({ myProfile }: { myProfile?: any }) {
  const { channels, activeChannel, layoutMode, setActiveChannel, setLayoutMode, setShowSettings } = useChatStore();

  return (
    <aside className="w-60 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border-r border-white/5 flex flex-col shrink-0 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="relative">
        <div className="h-14 flex items-center px-4 border-b border-white/5">
          <button className="flex items-center gap-2 text-sm font-black text-zinc-200 tracking-wide hover:text-white transition-colors">
            <span className="text-zinc-500 text-xs font-mono">#</span>
            <span>Chat</span>
            <ChevronDown size={14} className="text-zinc-600" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto custom-scrollbar relative">
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 px-3 pt-2">
          Channels
        </div>
        {channels.map((chan: any) => (
          <div
            key={chan.id}
            onClick={() => setActiveChannel(chan)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200 ${
              activeChannel?.id === chan.id
                ? "bg-gradient-to-r from-indigo-600/90 to-indigo-600/70 text-white shadow-lg shadow-indigo-500/20"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            }`}
          >
            <Hash size={14} className={`shrink-0 ${activeChannel?.id === chan.id ? "text-indigo-200" : "text-zinc-700 group-hover:text-zinc-500"}`} />
            <span className="truncate font-medium">{chan.name}</span>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5 relative">
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 px-2">
          Layout
        </div>
        <div className="flex p-1 bg-black/30 rounded-xl border border-white/5">
          <button
            onClick={() => setLayoutMode("standard")}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              layoutMode === "standard"
                ? "bg-gradient-to-r from-zinc-700 to-zinc-800 text-white shadow-inner"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setLayoutMode("iphone")}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              layoutMode === "iphone"
                ? "bg-gradient-to-r from-zinc-700 to-zinc-800 text-white shadow-inner"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            iPhone
          </button>
        </div>
      </div>

      <div className="p-3 bg-black/40 flex items-center justify-between border-t border-white/5 relative">
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <img
              src={myProfile?.avatar_url}
              className="w-9 h-9 rounded-full bg-zinc-800 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/10 hover:ring-indigo-400 transition-all"
              alt=""
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 shadow-lg shadow-emerald-500/50" />
          </div>
          <div className="min-w-0 text-left">
            <div className="text-sm font-bold truncate text-zinc-200">
              {myProfile?.username}
            </div>
            <div className="text-[9px] font-medium text-emerald-500/80 uppercase tracking-wider">
              Active
            </div>
          </div>
        </button>

        <button
          onClick={() => supabase.auth.signOut()}
          className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          title="Sign Out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
