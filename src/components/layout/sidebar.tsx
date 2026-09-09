"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight, Smartphone, X } from "lucide-react";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-cyan/10 text-cyan"
                  : "text-text-secondary hover:bg-white/[0.04] hover:text-text-primary",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_8px_var(--accent-cyan-glow)]" />}
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("space-y-2 border-t border-hairline p-2.5", collapsed && "px-1")}>
        <Link
          href="/field-inspection"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg border border-hairline-strong bg-white/[0.03] px-2.5 py-2.5 text-xs font-semibold text-text-secondary hover:border-cyan/30 hover:text-cyan",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Field Inspection" : undefined}
        >
          <Smartphone className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>Field Inspection Mode</span>}
        </Link>
      </div>
    </div>
  );
}

export function DesktopSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "relative hidden h-full shrink-0 border-r border-hairline bg-raised/80 backdrop-blur transition-[width] duration-200 md:block",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-hairline-strong bg-panel text-text-tertiary hover:text-cyan"
      >
        {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={cn("fixed inset-0 z-50 md:hidden", !open && "pointer-events-none")}>
      <div
        className={cn("absolute inset-0 bg-black/70 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-72 border-r border-hairline bg-raised transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button onClick={onClose} className="absolute right-3 top-4 text-text-tertiary hover:text-text-primary">
          <X className="h-5 w-5" />
        </button>
        <SidebarContent collapsed={false} onNavigate={onClose} />
      </div>
    </div>
  );
}
