import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Sparkline } from "@/components/shared/sparkline";
import { RoadThumbnail } from "@/components/dashboard/road-thumbnail";
import { getSegment, repairOptionsFor } from "@/lib/mock-data";
import { AlertTriangle, CheckCircle2, Radio, Sparkles } from "lucide-react";

export function LiveFeedRow() {
  const segment = getSegment("nh3-srn-leh-210")!;
  const repair = repairOptionsFor(segment.id).find((r) => r.id === segment.recommendedRepairId)!;
  const probabilityTrend = [38, 44, 51, 58, 63, 68, segment.probabilityOfFailurePct];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Live Road Feed */}
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[16/10]">
          <RoadThumbnail />
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-critical/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-glow-pulse" />
            Live
          </span>
          <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/60 px-2 py-1 font-mono-tech text-[10px] text-white backdrop-blur">
            {segment.routeNumber} | KM {segment.startKm + 3}.{4}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2.5">
          <Radio className="h-3.5 w-3.5 text-critical" />
          <span className="text-xs font-semibold text-text-primary">Live Road Feed</span>
        </div>
      </Card>

      {/* AI Risk Prediction */}
      <Card className="p-0">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-cyan" /> AI Risk Prediction
          </CardTitle>
        </CardHeader>
        <div className="space-y-2.5 px-4 pb-4 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">
              {segment.roadName.replace("–", " - ")} <span className="font-mono-tech text-text-tertiary">{segment.segmentLabel}</span>
            </span>
            <RiskBadge level={segment.riskLevel} />
          </div>
          <div className="text-[11px] text-text-tertiary">Probability of deterioration in next 30 days</div>
          <div className="flex items-end justify-between">
            <span className="font-display text-3xl font-bold text-critical">{segment.probabilityOfFailurePct}%</span>
            <Sparkline data={probabilityTrend} color="var(--state-critical)" width={100} height={32} />
          </div>
          <div className="flex items-start gap-1.5 rounded-lg border border-critical/25 bg-critical/[0.06] px-2.5 py-2 text-[11px] text-text-secondary">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-critical" />
            Alert: high chance of surface cracking due to freeze-thaw cycles.
          </div>
        </div>
      </Card>

      {/* Recommended Action */}
      <Card className="p-0">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-green" /> Recommended Action
          </CardTitle>
        </CardHeader>
        <div className="flex gap-3 px-4 pb-4 pt-1">
          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg">
            <RoadThumbnail />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="text-sm font-semibold leading-snug text-text-primary">{repair.method}</div>
            <div className="space-y-0.5">
              <Reason>Cost Efficient</Reason>
              <Reason>Eco-Friendly</Reason>
              <Reason>High Durability (Cold Climate)</Reason>
            </div>
          </div>
        </div>
        <Link
          href={`/repair-recommendations/${segment.id}`}
          className="mx-4 mb-4 block rounded-lg bg-green py-2 text-center text-xs font-semibold text-text-inverse transition-opacity hover:opacity-90"
        >
          View Plan →
        </Link>
      </Card>
    </div>
  );
}

function Reason({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
      <CheckCircle2 className="h-3 w-3 shrink-0 text-green" />
      {children}
    </div>
  );
}
