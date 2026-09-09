"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { ALERTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const ICON = { critical: AlertTriangle, warning: AlertCircle, info: Info } as const;
const TONE = { critical: "text-critical", warning: "text-moderate", info: "text-blue" } as const;

export function AlertsDropdown() {
  const [open, setOpen] = useState(false);
  const unread = ALERTS.filter((a) => !a.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-hairline-strong bg-white/[0.03] text-text-secondary hover:text-cyan"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass-panel absolute right-0 z-50 mt-2 w-[22rem] rounded-xl border border-hairline-strong shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="font-display text-xs font-bold uppercase tracking-wide text-text-primary">Alert Center</span>
              <Link href="/alerts" onClick={() => setOpen(false)} className="text-[11px] font-semibold text-cyan hover:underline">
                View all
              </Link>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {ALERTS.slice(0, 6).map((a) => {
                const Icon = ICON[a.severity];
                return (
                  <div key={a.id} className={cn("flex gap-3 border-b border-hairline px-4 py-3 last:border-b-0", !a.read && "bg-white/[0.02]")}>
                    <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", TONE[a.severity])} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-snug text-text-primary">{a.title}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-text-tertiary">{a.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
