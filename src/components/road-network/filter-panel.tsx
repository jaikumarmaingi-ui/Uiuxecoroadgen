"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskLevel } from "@/lib/types";
import { RISK_META } from "@/lib/risk";
import { cn } from "@/lib/utils";

export interface RoadFilters {
  region: string;
  roadClass: string;
  riskLevels: RiskLevel[];
  minHealth: number;
  inspection: "any" | "recent" | "overdue";
}

export const DEFAULT_FILTERS: RoadFilters = {
  region: "All",
  roadClass: "All",
  riskLevels: [],
  minHealth: 0,
  inspection: "any",
};

export function FilterPanel({
  filters,
  onChange,
  regions,
}: {
  filters: RoadFilters;
  onChange: (f: RoadFilters) => void;
  regions: string[];
}) {
  const toggleRisk = (level: RiskLevel) => {
    const has = filters.riskLevels.includes(level);
    onChange({
      ...filters,
      riskLevels: has ? filters.riskLevels.filter((r) => r !== level) : [...filters.riskLevels, level],
    });
  };

  return (
    <Card className="p-0">
      <CardHeader className="items-center pb-2 pt-3.5">
        <CardTitle className="text-xs">Filters</CardTitle>
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary hover:text-cyan"
        >
          Reset
        </button>
      </CardHeader>
      <div className="space-y-3.5 p-3.5 pt-2">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Region</label>
          <select
            value={filters.region}
            onChange={(e) => onChange({ ...filters, region: e.target.value })}
            className="w-full rounded-lg border border-hairline-strong bg-white/[0.03] px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-cyan/40"
          >
            <option>All</option>
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Road Class</label>
          <select
            value={filters.roadClass}
            onChange={(e) => onChange({ ...filters, roadClass: e.target.value })}
            className="w-full rounded-lg border border-hairline-strong bg-white/[0.03] px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-cyan/40"
          >
            <option>All</option>
            <option>National Highway</option>
            <option>Border Road</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Risk Level</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(RISK_META) as RiskLevel[]).map((level) => {
              const active = filters.riskLevels.includes(level);
              return (
                <button
                  key={level}
                  onClick={() => toggleRisk(level)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase transition-colors",
                    active ? cn(RISK_META[level].bgClass, RISK_META[level].textClass, RISK_META[level].borderClass) : "border-hairline-strong text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {RISK_META[level].label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
            <span>Minimum Health Score</span>
            <span className="font-mono-tech text-cyan">{filters.minHealth}</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={filters.minHealth}
            onChange={(e) => onChange({ ...filters, minHealth: Number(e.target.value) })}
            className="slider-input h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08]"
            style={{ background: `linear-gradient(to right, var(--accent-cyan) ${filters.minHealth}%, rgba(255,255,255,0.08) ${filters.minHealth}%)` }}
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Last Inspection</label>
          <select
            value={filters.inspection}
            onChange={(e) => onChange({ ...filters, inspection: e.target.value as RoadFilters["inspection"] })}
            className="w-full rounded-lg border border-hairline-strong bg-white/[0.03] px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-cyan/40"
          >
            <option value="any">Any time</option>
            <option value="recent">Within 7 days</option>
            <option value="overdue">Overdue (14+ days)</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
