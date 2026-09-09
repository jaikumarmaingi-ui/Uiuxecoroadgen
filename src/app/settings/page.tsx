"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/shared/demo-badge";
import { cn } from "@/lib/utils";
import { Settings as SettingsIcon, Shield, Bell, Map, Cpu } from "lucide-react";

const ROLES = [
  { id: "command", label: "Command / Infrastructure Leadership", blurb: "Network health, strategic priority, budget & sustainability reporting." },
  { id: "engineer", label: "Road Engineer", blurb: "Segment health, distress data, prediction, materials & specifications." },
  { id: "field", label: "Field Inspection Team", blurb: "Mobile inspection, GPS, photo capture, condition recording." },
  { id: "planner", label: "Maintenance Planner", blurb: "Prioritization, scheduling, cost estimates, contractor planning." },
  { id: "analyst", label: "AI / Data Analyst", blurb: "Model predictions, feature importance, confidence, anomalies." },
];

export default function SettingsPage() {
  const [role, setRole] = useState("planner");
  const [notifications, setNotifications] = useState({ critical: true, weather: true, overdue: true, budget: false });
  const [units, setUnits] = useState<"metric" | "imperial">("metric");

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2.5">
        <SettingsIcon className="h-5 w-5 text-cyan" />
        <h1 className="font-display text-2xl font-bold text-text-primary">Settings</h1>
        <DemoBadge />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Role &amp; Permissions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-colors",
                role === r.id ? "border-cyan/40 bg-cyan/[0.06]" : "border-hairline bg-white/[0.02] hover:border-hairline-strong",
              )}
            >
              <div>
                <div className="text-sm font-semibold text-text-primary">{r.label}</div>
                <div className="mt-0.5 text-xs text-text-tertiary">{r.blurb}</div>
              </div>
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  role === r.id ? "border-cyan bg-cyan" : "border-hairline-strong",
                )}
              />
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notification Preferences
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ToggleRow label="Critical deterioration alerts" checked={notifications.critical} onChange={(v) => setNotifications((n) => ({ ...n, critical: v }))} />
          <ToggleRow label="Weather risk alerts" checked={notifications.weather} onChange={(v) => setNotifications((n) => ({ ...n, weather: v }))} />
          <ToggleRow label="Inspection / repair overdue alerts" checked={notifications.overdue} onChange={(v) => setNotifications((n) => ({ ...n, overdue: v }))} />
          <ToggleRow label="Budget threshold alerts" checked={notifications.budget} onChange={(v) => setNotifications((n) => ({ ...n, budget: v }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Map className="h-4 w-4" /> Map &amp; Units
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnits(u)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-xs font-semibold uppercase tracking-wide",
                  units === u ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-hairline-strong text-text-tertiary",
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Cpu className="h-4 w-4" /> System
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-text-secondary">
          <p>
            EcoRoadGen 1.0 uses clearly labelled demo/mock AI predictions in this prototype build. The UI is
            architected for future integration with a real ML prediction engine: UI → API layer → prediction
            engine → ML model → database.
          </p>
          <p className="text-text-tertiary">Prototype build · Not connected to live sensor or defence infrastructure systems.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 hover:bg-white/[0.03]">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-cyan/70" : "bg-white/10")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", checked ? "left-4" : "left-0.5")} />
      </span>
    </button>
  );
}
