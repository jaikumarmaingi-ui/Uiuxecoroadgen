import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RepairOption } from "@/lib/types";
import { Leaf } from "lucide-react";

export function SustainabilityCalculator({
  option,
  conventional,
  costSavingLakh,
}: {
  option: RepairOption;
  conventional: RepairOption;
  costSavingLakh: number;
}) {
  const conventionalEmissions = 100;
  const recommendedEmissions = Math.max(
    8,
    Math.round(100 - (option.carbonReductionTons / Math.max(1, conventional.estimatedCostLakhPerKm * 3)) * 100),
  );
  const reduction = conventionalEmissions - recommendedEmissions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sustainability Calculator</CardTitle>
        <Leaf className="h-4 w-4 text-green" />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="CO₂ Reduction" value={`${option.carbonReductionTons} t`} tone="text-green" />
          <Metric label="Plastic Waste Diverted" value={`${option.plasticWasteUtilizedTons} t`} tone="text-cyan" />
          <Metric label="Material Reuse" value={`${option.recycledMaterialPct}%`} tone="text-cyan" />
          <Metric label="Cost Saving" value={`₹${costSavingLakh.toFixed(1)} L`} tone="text-green" />
          <Metric label="Expected Service Life" value={`${((option.expectedLifeYearsMin + option.expectedLifeYearsMax) / 2).toFixed(1)} yrs`} />
          <Metric label="Maintenance Frequency" value={option.maintenanceFrequency} />
        </div>

        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
            Emissions vs. Conventional Repair
          </div>
          <div className="space-y-2">
            <EmissionBar label="Conventional Repair" pct={100} tone="var(--text-tertiary)" />
            <EmissionBar label="Recommended Repair" pct={recommendedEmissions} tone="var(--accent-green)" />
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            Potential reduction <span className="font-display font-bold text-green">{reduction}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className={`font-display text-lg font-bold ${tone ?? "text-text-primary"}`}>{value}</div>
    </div>
  );
}

function EmissionBar({ label, pct, tone }: { label: string; pct: number; tone: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-text-secondary">
        <span>{label}</span>
        <span className="font-mono-tech font-semibold">{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, backgroundColor: tone }} />
      </div>
    </div>
  );
}
