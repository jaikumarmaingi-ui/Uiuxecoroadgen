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

  if (isFieldMode) {
    return <div className="min-h-screen bg-grid">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-grid">
      <DesktopSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
