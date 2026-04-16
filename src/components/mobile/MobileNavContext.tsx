"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type MobileTab = "channels" | "activity" | "profile";

interface MobileNavContextType {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  showChannelDrawer: boolean;
  setShowChannelDrawer: (show: boolean) => void;
  showMemberSheet: boolean;
  setShowMemberSheet: (show: boolean) => void;
}

const MobileNavContext = createContext<MobileNavContextType | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<MobileTab>("channels");
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [showMemberSheet, setShowMemberSheet] = useState(false);

  return (
    <MobileNavContext.Provider
      value={{
        activeTab,
        setActiveTab,
        showChannelDrawer,
        setShowChannelDrawer,
        showMemberSheet,
        setShowMemberSheet,
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (!context) {
    throw new Error("useMobileNav must be used within MobileNavProvider");
  }
  return context;
}
