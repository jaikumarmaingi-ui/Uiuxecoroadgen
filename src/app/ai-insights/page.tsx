import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIWidget } from "@/components/shared/kpi-widget";
import { DemoBadge } from "@/components/shared/demo-badge";
import { AlertPanel } from "@/components/shared/alert-panel";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { PredictionChart } from "@/components/charts/prediction-chart";
import { AIStatusIndicator } from "@/components/shared/ai-status-indicator";
import { globalFeatureImportance, confidenceDistribution, avgPredictionConfidence } from "@/lib/ai-analytics";
import { ALERTS, DASHBOARD_KPIS, SPARKLINES } from "@/lib/mock-data";
import { BrainCircuit } from "lucide-react";

export default function AIInsightsPage() {
  const importance = globalFeatureImportance().map((f) => ({ factor: f.factor, weight: f.weight }));
  const confidence = confidenceDistribution();
  const avgConfidence = avgPredictionConfidence();
  const accuracyTrend = SPARKLINES.accuracy.map((v, i) => ({ label: `W${i + 1}`, accuracy: v }));
  const anomalies = ALERTS.filter((a) => a.category === "Prediction Anomaly" || a.category === "Sensor Failure");

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="h-5 w-5 text-cyan" />
          <h1 className="font-display text-2xl font-bold text-text-primary">AI Insights</h1>
          <DemoBadge />
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          Model performance, explainability and data quality for the deterioration prediction engine.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPIWidget label="Prediction Accuracy" value={DASHBOARD_KPIS.predictionAccuracyPct} decimals={1} suffix="%" tone="blue" sparklineData={SPARKLINES.accuracy} />
        <KPIWidget label="Avg. Model Confidence" value={avgConfidence} suffix="%" tone="cyan" />
        <KPIWidget label="Anomalies Flagged" value={anomalies.length} tone="amber" />
        <KPIWidget label="Segments Monitored" value={26} tone="green" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Global Feature Importance</CardTitle>
            <AIStatusIndicator state="confident" />
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={importance} xKey="factor" yKey="weight" color="var(--accent-cyan)" horizontal height={280} unit="%" />
            <p className="mt-3 text-xs text-text-tertiary">
              Network-wide average contribution of each factor to deterioration predictions, aggregated across all monitored segments.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prediction Accuracy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <PredictionChart data={accuracyTrend} series={[{ key: "accuracy", label: "Accuracy %", color: "var(--accent-blue)" }]} height={280} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={confidence} xKey="level" yKey="count" color="var(--accent-green)" height={220} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anomaly &amp; Sensor Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {anomalies.length ? <AlertPanel alerts={anomalies} /> : <p className="text-xs text-text-tertiary">No anomalies detected in the current cycle.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
