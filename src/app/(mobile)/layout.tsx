"use client";

import { ReactNode } from "react";
import { MobileNavProvider } from "@/components/mobile/MobileNavContext";
import { MobileNav } from "@/components/mobile/MobileNav";
import { MobileTabContent } from "@/components/mobile/MobileTabContent";

export default function MobileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MobileNavProvider>
      <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
        <MobileTabContent>{children}</MobileTabContent>
        <MobileNav />
      </div>
    </MobileNavProvider>
  );
}
