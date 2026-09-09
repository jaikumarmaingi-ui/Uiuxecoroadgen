"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertPanel } from "@/components/shared/alert-panel";
import { DemoBadge } from "@/components/shared/demo-badge";
import { ALERTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { BellRing } from "lucide-react";

const SEVERITIES = ["all", "critical", "warning", "info"] as const;

export default function AlertsPage() {
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("all");
  const filtered = severity === "all" ? ALERTS : ALERTS.filter((a) => a.severity === severity);

  return (
    <div className="mx-auto max-w-[900px] space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2.5">
          <BellRing className="h-5 w-5 text-cyan" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Alert Center</h1>
          <DemoBadge />
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          Critical deterioration, weather risk, overdue inspections/repairs, sensor and budget alerts across the network.
        </p>
      </div>

      <div className="flex gap-2">
        {SEVERITIES.map((s) => (
          <button
            key={s}
            onClick={() => setSeverity(s)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize",
              severity === s ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-hairline-strong text-text-tertiary hover:text-text-secondary",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertPanel alerts={filtered} />
        </CardContent>
      </Card>
    </div>
  );
}
