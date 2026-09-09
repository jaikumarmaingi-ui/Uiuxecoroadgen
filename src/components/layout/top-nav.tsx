"use client";

import Link from "next/link";
import { Menu, CloudSnow, MapPinned, ChevronDown, BellRing } from "lucide-react";
import { GlobalSearch } from "@/components/layout/global-search";
import { LogoMark } from "@/components/shared/logo-mark";
import { WEATHER } from "@/lib/mock-data";
import { useState } from "react";
import { cn } from "@/lib/utils";

function BroModeToggle() {
  const [on, setOn] = useState(true);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className="hidden items-center gap-2 rounded-full border border-hairline-strong bg-white/[0.03] py-1 pl-3 pr-1 text-[11px] font-semibold text-text-secondary sm:flex"
      title="BRO Mode — Border Roads Organisation display preset"
    >
      BRO Mode
      <span className={cn("relative rounded-full transition-colors", on ? "bg-green/80" : "bg-white/10")} style={{ height: 18, width: 32 }}>
        <span
          className={cn(
            "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all",
            on ? "left-[15px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="z-30 flex shrink-0 items-center gap-3 border-b border-hairline bg-base/95 px-4 py-3 backdrop-blur md:px-6">
      <button onClick={onMenuClick} className="text-text-secondary hover:text-text-primary md:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex shrink-0 items-center gap-2.5">
        <LogoMark size={34} />
        <div className="hidden min-w-0 leading-tight lg:block">
          <div className="font-display text-sm font-extrabold tracking-wide text-text-primary">
            ECO<span className="text-text-primary">ROADGEN</span>
            <span className="text-green">1.0</span>
          </div>
          <div className="max-w-[300px] truncate text-[10px] text-text-tertiary">
            AI-Powered Predictive Road Health &amp; Sustainable Repair System for Strategic Defence Roads
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <GlobalSearch />
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-hairline-strong bg-white/[0.03] px-3 py-1.5 text-xs text-text-secondary sm:flex">
        <CloudSnow className="h-3.5 w-3.5 text-cyan" />
        <span className="font-mono-tech font-semibold text-text-primary">{WEATHER.tempC}°C</span>
        <span className="hidden text-text-tertiary md:inline">·</span>
        <span className="hidden items-center gap-1 text-text-tertiary md:flex">
          <MapPinned className="h-3 w-3" />
          {WEATHER.location}
        </span>
      </div>

      <BroModeToggle />

      <div className="relative">
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-hairline-strong bg-white/[0.03] py-1.5 pl-1.5 pr-2.5 hover:border-cyan/30"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan/15 font-display text-[11px] font-bold text-cyan">
            JM
          </span>
          <span className="hidden text-xs font-medium text-text-secondary sm:inline">J. Maingi</span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-text-tertiary sm:inline" />
        </button>
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
            <div className="glass-panel absolute right-0 z-50 mt-2 w-56 rounded-xl border border-hairline-strong p-1.5 shadow-2xl">
              <div className="px-3 py-2 text-xs">
                <div className="font-semibold text-text-primary">Jai Kumar Maingi</div>
                <div className="text-text-tertiary">Maintenance Planner</div>
              </div>
              <div className="my-1 h-px bg-hairline" />
              <Link
                href="/alerts"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-text-secondary hover:bg-white/[0.05] hover:text-text-primary"
              >
                <BellRing className="h-3.5 w-3.5" />
                Alert Center
              </Link>
              {["Switch role", "Notification preferences", "Settings", "Sign out"].map((item) => (
                <button
                  key={item}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-xs text-text-secondary hover:bg-white/[0.05] hover:text-text-primary",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
