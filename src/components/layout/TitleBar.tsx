"use client";

import { useEffect, useState } from "react";
import { Minus, X, Maximize2, Minimize2 } from "lucide-react";

export function TitleBar() {
  const [windowApi, setWindowApi] = useState<any>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    import("@tauri-apps/api/window").then((m) => {
      const win = m.getCurrentWindow();
      setWindowApi(win);
      win.isMaximized().then(setIsMaximized);
    });
  }, []);

  const handleMaximize = async () => {
    if (windowApi) {
      await windowApi.toggleMaximize();
      setIsMaximized(await windowApi.isMaximized());
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="h-10 flex justify-between items-center bg-zinc-950/80 backdrop-blur-xl cursor-default shrink-0 z-50 select-none"
    >
      <div className="pl-4 flex items-center gap-3 pointer-events-none">
        <div className="relative">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-[10px] font-black italic text-white">B</span>
          </div>
        </div>
        <span className="text-xs font-semibold text-zinc-400 tracking-wide">
          The Basement
        </span>
      </div>
      
      <div className="flex h-full items-center">
        <button
          onClick={() => windowApi?.minimize()}
          className="w-12 h-full flex items-center justify-center hover:bg-white/5 text-zinc-500 hover:text-white transition-all duration-150"
          title="Minimize"
        >
          <Minus size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-12 h-full flex items-center justify-center hover:bg-white/5 text-zinc-500 hover:text-white transition-all duration-150"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Minimize2 size={14} strokeWidth={1.5} />
          ) : (
            <Maximize2 size={14} strokeWidth={1.5} />
          )}
        </button>
        <button
          onClick={() => windowApi?.close()}
          className="w-12 h-full flex items-center justify-center hover:bg-red-500 text-zinc-500 hover:text-white transition-all duration-150"
          title="Close"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
