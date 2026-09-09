import { ROAD_SEGMENTS } from "./mock-data";
import type { FeatureContribution } from "./types";

export function globalFeatureImportance(): FeatureContribution[] {
  const totals = new Map<string, number>();
  for (const seg of ROAD_SEGMENTS) {
    for (const c of seg.featureContributions) {
      totals.set(c.factor, (totals.get(c.factor) ?? 0) + c.weight);
    }
  }
  const entries = Array.from(totals.entries()).map(([factor, sum]) => [factor, sum / ROAD_SEGMENTS.length] as const);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);
  return entries
    .map(([factor, v]) => ({ factor, weight: Math.round((v / total) * 1000) / 10 }))
    .sort((a, b) => b.weight - a.weight);
}

export function confidenceDistribution() {
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const s of ROAD_SEGMENTS) counts[s.dataConfidence]++;
  return [
    { level: "High", count: counts.HIGH },
    { level: "Medium", count: counts.MEDIUM },
    { level: "Low", count: counts.LOW },
  ];
}

export function avgPredictionConfidence() {
  return Math.round(ROAD_SEGMENTS.reduce((a, s) => a + s.predictionConfidencePct, 0) / ROAD_SEGMENTS.length);
}

export function dataQualityRows() {
  return ROAD_SEGMENTS.map((s) => ({
    id: s.id,
    roadName: s.roadName,
    routeNumber: s.routeNumber,
    segmentLabel: s.segmentLabel,
    dataConfidence: s.dataConfidence,
    lastInspectionIso: s.lastInspectionIso,
    imageAvailable: s.dataConfidence !== "LOW",
    weatherAvailable: s.altitudeM < 5000 || s.dataConfidence === "HIGH",
    historicalAvailable: s.history.length >= 4,
  }));
}
