import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIWidget } from "@/components/shared/kpi-widget";
import { DemoBadge } from "@/components/shared/demo-badge";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { co2ByRegion, co2ByRepairType, materialReuseByType, networkTotals } from "@/lib/sustainability-analytics";
import { Leaf } from "lucide-react";

export default function SustainabilityPage() {
  const totals = networkTotals();
  const byRegion = co2ByRegion();
  const byType = co2ByRepairType();
  const reuseByType = materialReuseByType();

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Leaf className="h-5 w-5 text-green" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Sustainability Impact</h1>
          <DemoBadge />
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          Network-wide environmental impact of AI-recommended repair methods versus conventional construction.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KPIWidget label="Total CO₂ Avoided" value={totals.totalCo2AvoidedTons} suffix=" t" tone="green" />
        <KPIWidget label="Material Reused (avg)" value={totals.avgMaterialReusePct} suffix="%" tone="cyan" />
        <KPIWidget label="Plastic Waste Utilized" value={totals.totalPlasticWasteTons} suffix=" t" tone="cyan" />
        <KPIWidget label="Fuel Saved (est.)" value={totals.fuelSavedKl} suffix=" kL" tone="blue" />
        <KPIWidget label="Lifecycle Extension" value={totals.lifecycleExtensionYears} decimals={1} suffix=" yrs" tone="green" />
        <KPIWidget label="Cost Savings" value={totals.totalCostSavingCr} decimals={1} prefix="₹" suffix=" Cr" tone="cyan" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CO₂ Reduction by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={byRegion} xKey="region" yKey="tons" color="var(--accent-green)" unit=" t" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CO₂ Reduction by Repair Type</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={byType} xKey="method" yKey="tons" color="var(--accent-cyan)" unit=" t" horizontal />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Material Reuse by Repair Type</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={reuseByType} xKey="method" yKey="avgReusePct" color="var(--accent-blue)" unit="%" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plastic Waste Diverted by Repair Type (tons)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={reuseByType} xKey="method" yKey="totalWasteTons" color="var(--state-moderate)" unit=" t" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-green/20 bg-green/[0.03]">
        <CardHeader>
          <CardTitle className="text-green">Traditional Maintenance vs EcoRoadGen Recommended Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ComparisonBlock
            label="Traditional Maintenance"
            co2="Baseline (100%)"
            cost="Higher long-run cost — frequent reactive repairs"
            material="Predominantly virgin material"
          />
          <ComparisonBlock
            label="EcoRoadGen Recommended"
            co2={`~${totals.emissionsPctOfBaseline}% of baseline emissions`}
            cost={`₹${totals.totalCostSavingCr} Cr network-wide savings`}
            material={`${totals.avgMaterialReusePct}% average recycled material`}
            highlight
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ComparisonBlock({
  label,
  co2,
  cost,
  material,
  highlight,
}: {
  label: string;
  co2: string;
  cost: string;
  material: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-green/30 bg-green/[0.05]" : "border-hairline bg-white/[0.02]"}`}>
      <div className={`font-display text-sm font-bold uppercase tracking-wide ${highlight ? "text-green" : "text-text-secondary"}`}>{label}</div>
      <dl className="mt-3 space-y-2 text-xs">
        <div>
          <dt className="text-text-tertiary">CO₂ Emissions</dt>
          <dd className="font-medium text-text-primary">{co2}</dd>
        </div>
        <div>
          <dt className="text-text-tertiary">Cost</dt>
          <dd className="font-medium text-text-primary">{cost}</dd>
        </div>
        <div>
          <dt className="text-text-tertiary">Material Sourcing</dt>
          <dd className="font-medium text-text-primary">{material}</dd>
        </div>
      </dl>
    </div>
  );
}
