"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar, MobileDrawer } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isFieldMode = pathname.startsWith("/field-inspection");
  const isHero = pathname === "/";
  const isBareMode = isFieldMode || isHero;

  if (isBareMode) {
    return <div className="min-h-screen bg-grid">{children}</div>;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-grid">
      <TopNav onMenuClick={() => setMobileOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <DesktopSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
