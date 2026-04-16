"use client";

import { Hash, Bell, User } from "lucide-react";
import { useMobileNav } from "./MobileNavContext";

const TABS = [
  { id: "channels" as const, label: "Channels", icon: Hash },
  { id: "activity" as const, label: "Activity", icon: Bell },
  { id: "profile" as const, label: "Profile", icon: User },
];

export function MobileNav() {
  const { activeTab, setActiveTab } = useMobileNav();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-all touch-manipulation ${
                isActive
                  ? "text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-300 active:scale-95"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-wide">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
