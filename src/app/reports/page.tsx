"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoBadge } from "@/components/shared/demo-badge";
import { AIStatusIndicator } from "@/components/shared/ai-status-indicator";
import { REPORT_TYPES, DASHBOARD_KPIS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FileText, Download, FileSpreadsheet, Presentation, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0].id);
  const [region, setRegion] = useState("All Regions");
  const [riskLevel, setRiskLevel] = useState("All Levels");
  const [status, setStatus] = useState<"idle" | "generating" | "ready">("idle");

  const type = REPORT_TYPES.find((r) => r.id === selectedType)!;

  function generate() {
    setStatus("generating");
    setTimeout(() => setStatus("ready"), 1200);
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2.5">
          <FileText className="h-5 w-5 text-cyan" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Reports</h1>
          <DemoBadge />
        </div>
        <p className="mt-1 text-sm text-text-tertiary">Generate audience-specific reports from live network intelligence.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Select Report Type</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2">
            {REPORT_TYPES.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedType(r.id);
                  setStatus("idle");
                }}
                className={cn(
                  "rounded-xl border p-3.5 text-left transition-colors",
                  selectedType === r.id ? "border-cyan/40 bg-cyan/[0.06]" : "border-hairline bg-white/[0.02] hover:border-hairline-strong",
                )}
              >
                <div className="text-sm font-semibold text-text-primary">{r.name}</div>
                <div className="mt-1 text-xs text-text-tertiary">{r.description}</div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-cyan">{r.audience}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FilterRow label="Date Range">
              <select className={selectClass}>
                <option>Last 30 days</option>
                <option>Last quarter</option>
                <option>Year to date</option>
                <option>Custom range</option>
              </select>
            </FilterRow>
            <FilterRow label="Region">
              <select className="select-field" value={region} onChange={(e) => setRegion(e.target.value)}>
                <option>All Regions</option>
                <option>Kashmir Valley</option>
                <option>Ladakh Plateau</option>
                <option>Lahaul Corridor</option>
                <option>Nubra Valley</option>
              </select>
            </FilterRow>
            <FilterRow label="Risk Level">
              <select className="select-field" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
                <option>All Levels</option>
                <option>Critical</option>
                <option>High Risk</option>
                <option>Moderate</option>
              </select>
            </FilterRow>
            <FilterRow label="Repair Status">
              <select className={selectClass}>
                <option>All Statuses</option>
                <option>Recommended</option>
                <option>Approved</option>
                <option>Under Repair</option>
                <option>Completed</option>
              </select>
            </FilterRow>

            <Button variant="primary" className="mt-2 w-full" onClick={generate} disabled={status === "generating"}>
              {status === "generating" ? "Generating…" : "Generate Report"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview — {type.name}</CardTitle>
          {status === "generating" && <AIStatusIndicator state="analyzing" />}
        </CardHeader>
        <CardContent>
          {status === "idle" && (
            <div className="rounded-xl border border-dashed border-hairline-strong bg-white/[0.02] p-8 text-center text-xs text-text-tertiary">
              Configure filters and generate a report to preview it here.
            </div>
          )}
          {status === "generating" && (
            <div className="rounded-xl border border-hairline bg-white/[0.02] p-8 text-center text-xs text-text-tertiary">
              AI ANALYZING ROAD CONDITIONS… compiling {type.name.toLowerCase()}.
            </div>
          )}
          {status === "ready" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-green">
                <CheckCircle2 className="h-4 w-4" /> Report ready — {type.name}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Total Network" value={`${DASHBOARD_KPIS.totalRoadLengthKm} km`} />
                <MiniStat label="Overall Health" value={`${DASHBOARD_KPIS.overallHealth}/100`} />
                <MiniStat label="High Risk Segments" value={`${DASHBOARD_KPIS.highRiskSegments}`} />
                <MiniStat label="Cost Savings" value={`₹${DASHBOARD_KPIS.estimatedCostSavingsCr} Cr`} />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button variant="secondary">
                  <Download className="h-4 w-4" /> Export PDF
                </Button>
                <Button variant="secondary">
                  <FileSpreadsheet className="h-4 w-4" /> Export Excel
                </Button>
                <Button variant="secondary">
                  <Presentation className="h-4 w-4" /> Export Presentation
                </Button>
              </div>
              <p className="text-[11px] text-text-tertiary">{DemoNote}</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

const selectClass =
  "w-full rounded-lg border border-hairline-strong bg-white/[0.03] px-3 py-2 text-xs text-text-primary outline-none focus:border-cyan/40";

const DemoNote = "Export actions are illustrative in this prototype build and do not produce downloadable files.";

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</label>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className="font-display text-base font-bold text-text-primary">{value}</div>
    </div>
  );
}
