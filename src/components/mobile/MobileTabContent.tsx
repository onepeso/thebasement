"use client";

import { ReactNode, Children, isValidElement, cloneElement } from "react";
import { useMobileNav } from "./MobileNavContext";

export function MobileTabContent({ children }: { children: ReactNode }) {
  const { activeTab } = useMobileNav();

  const tabs = ["channels", "activity", "profile"] as const;
  const childArray = Children.toArray(children);

  return (
    <div className="flex-1 overflow-hidden pb-16">
      {childArray.map((child, index) => {
        if (isValidElement(child)) {
          const isActive = tabs[index] === activeTab;
          return (
            <div
              key={index}
              className="h-full"
              style={{ display: isActive ? "block" : "none" }}
            >
              {child}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
