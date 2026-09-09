import { Star } from "lucide-react";
import type { RepairOption } from "@/lib/types";
import { cn } from "@/lib/utils";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-3 w-3", i < count ? "fill-cyan text-cyan" : "text-hairline-strong")} />
      ))}
    </div>
  );
}

const COLS: { key: keyof RepairOption; label: string }[] = [
  { key: "estimatedCostLakhPerKm", label: "Cost (₹L/km)" },
  { key: "expectedLifeYearsMax", label: "Expected Life" },
  { key: "climateSuitability", label: "Cold Climate" },
  { key: "waterResistanceStars", label: "Water Resistance" },
  { key: "freezeThawResistanceStars", label: "Freeze-Thaw Resistance" },
  { key: "trafficLoadCapacityStars", label: "Traffic Load Capacity" },
  { key: "constructionTimeDays", label: "Construction Time" },
  { key: "maintenanceFrequency", label: "Maintenance" },
  { key: "carbonReductionTons", label: "CO₂ Impact" },
  { key: "recycledMaterialPct", label: "Recycled %" },
  { key: "suitabilityScore", label: "Suitability Score" },
];

export function RepairComparisonTable({ options }: { options: RepairOption[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-panel px-3 py-2.5 text-left font-semibold text-text-tertiary">Repair Method</th>
            {options.map((o) => (
              <th key={o.id} className="px-3 py-2.5 text-left font-semibold text-text-primary">
                {o.shortLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COLS.map((col) => (
            <tr key={col.key} className="border-t border-hairline">
              <td className="sticky left-0 z-10 bg-panel px-3 py-2.5 font-medium text-text-tertiary">{col.label}</td>
              {options.map((o) => (
                <td key={o.id} className="px-3 py-2.5 text-text-secondary">
                  {renderCell(col.key, o)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(key: keyof RepairOption, o: RepairOption) {
  switch (key) {
    case "estimatedCostLakhPerKm":
      return `₹${o.estimatedCostLakhPerKm}`;
    case "expectedLifeYearsMax":
      return `${o.expectedLifeYearsMin}–${o.expectedLifeYearsMax} yrs`;
    case "climateSuitability":
      return o.climateSuitability;
    case "waterResistanceStars":
      return <Stars count={o.waterResistanceStars} />;
    case "freezeThawResistanceStars":
      return <Stars count={o.freezeThawResistanceStars} />;
    case "trafficLoadCapacityStars":
      return <Stars count={o.trafficLoadCapacityStars} />;
    case "constructionTimeDays":
      return `${o.constructionTimeDays} days`;
    case "maintenanceFrequency":
      return o.maintenanceFrequency;
    case "carbonReductionTons":
      return o.carbonReductionTons > 0 ? `-${o.carbonReductionTons} t` : `+${Math.abs(o.carbonReductionTons)} t`;
    case "recycledMaterialPct":
      return `${o.recycledMaterialPct}%`;
    case "suitabilityScore":
      return <span className="font-display text-sm font-bold text-cyan">{o.suitabilityScore}/100</span>;
    default:
      return String(o[key] ?? "");
  }
}
