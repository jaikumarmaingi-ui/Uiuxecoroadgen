import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/shared/demo-badge";
import { DataConfidenceBadge } from "@/components/shared/data-confidence-badge";
import { PredictionChart } from "@/components/charts/prediction-chart";
import { dataQualityRows } from "@/lib/ai-analytics";
import { ROAD_SEGMENTS, SPARKLINES } from "@/lib/mock-data";
import { daysAgo } from "@/lib/utils";
import { Database, Check, X, Wifi, WifiOff } from "lucide-react";

export default function DataAnalyticsPage() {
  const rows = dataQualityRows();
  const trend = SPARKLINES.health.map((v, i) => ({ label: `W${i + 1}`, health: v }));
  const sensors = ROAD_SEGMENTS.flatMap((s) =>
    s.landmarks
      .filter((l) => l.type === "weather-station")
      .map(() => ({ id: `${s.id}-station`, label: `${s.region} Weather Station`, online: s.dataConfidence !== "LOW" })),
  );

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Database className="h-5 w-5 text-cyan" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Data &amp; Analytics</h1>
          <DemoBadge />
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          Historical trends, data quality and sensor network status underpinning every prediction.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Network Health Trend (7-Week Rolling)</CardTitle>
        </CardHeader>
        <CardContent>
          <PredictionChart data={trend} series={[{ key: "health", label: "Overall Health", color: "var(--accent-green)" }]} height={240} />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Data Quality by Segment</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="text-left text-text-tertiary">
                  <th className="pb-2 font-semibold">Segment</th>
                  <th className="pb-2 font-semibold">Confidence</th>
                  <th className="pb-2 font-semibold">Last Inspection</th>
                  <th className="pb-2 text-center font-semibold">Imagery</th>
                  <th className="pb-2 text-center font-semibold">Weather</th>
                  <th className="pb-2 text-center font-semibold">History</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-hairline">
                    <td className="py-2 pr-2">
                      <span className="font-mono-tech font-semibold text-cyan">{r.routeNumber}</span>{" "}
                      <span className="text-text-secondary">{r.segmentLabel}</span>
                    </td>
                    <td className="py-2">
                      <DataConfidenceBadge level={r.dataConfidence} />
                    </td>
                    <td className="py-2 text-text-secondary">{daysAgo(r.lastInspectionIso)}d ago</td>
                    <td className="py-2 text-center">{r.imageAvailable ? <Check className="mx-auto h-3.5 w-3.5 text-green" /> : <X className="mx-auto h-3.5 w-3.5 text-critical" />}</td>
                    <td className="py-2 text-center">{r.weatherAvailable ? <Check className="mx-auto h-3.5 w-3.5 text-green" /> : <X className="mx-auto h-3.5 w-3.5 text-critical" />}</td>
                    <td className="py-2 text-center">{r.historicalAvailable ? <Check className="mx-auto h-3.5 w-3.5 text-green" /> : <X className="mx-auto h-3.5 w-3.5 text-critical" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sensor Network Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sensors.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-hairline bg-white/[0.02] px-3 py-2.5 text-xs">
                <span className="text-text-secondary">{s.label}</span>
                <span className={`flex items-center gap-1.5 font-semibold ${s.online ? "text-green" : "text-critical"}`}>
                  {s.online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                  {s.online ? "Online" : "Offline"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
