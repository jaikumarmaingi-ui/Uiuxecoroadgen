import type { RoadSegment } from "@/lib/types";
import { clamp } from "@/lib/utils";
import type { FreezeThawRisk, RecommendedRepair, RoadHealthData, SlopeRisk } from "./types";

// Adapts the app's existing RoadSegment mock schema (src/lib/types.ts) onto
// the RoadHealthData contract EcoRoadGenMotion expects, so the dashboard
// hero tells the same story as the rest of the page instead of showing an
// unrelated canned example. Every mapping here is a deterministic formula
// over real segment fields — nothing is randomized or invented per render.
// Swap this file out once a real road-health API exists.

const REPAIR_ID_TO_RECOMMENDATION: Record<string, RecommendedRepair> = {
  "hot-mix": "PATCH_REPAIR",
  "cold-mix-recycled": "MILLING_OVERLAY",
  "recycled-plastic": "SUSTAINABLE_REHABILITATION",
};

const REPAIR_HEALTH_BOOST: Record<RecommendedRepair, number> = {
  PATCH_REPAIR: 18,
  MILLING_OVERLAY: 32,
  SUSTAINABLE_REHABILITATION: 48,
};

const RISK_LEVEL_TO_SLOPE_RISK: Record<RoadSegment["riskLevel"], SlopeRisk> = {
  healthy: "LOW",
  good: "LOW",
  moderate: "MEDIUM",
  "high-risk": "HIGH",
  critical: "CRITICAL",
};

function freezeThawRiskFor(cycles: number): FreezeThawRisk {
  if (cycles >= 140) return "CRITICAL";
  if (cycles >= 100) return "HIGH";
  if (cycles >= 60) return "MEDIUM";
  return "LOW";
}

export function roadHealthDataFromSegment(segment: RoadSegment): RoadHealthData {
  const recommendedRepair = REPAIR_ID_TO_RECOMMENDATION[segment.recommendedRepairId] ?? "MILLING_OVERLAY";
  const midKm = (segment.startKm + segment.endKm) / 2;

  return {
    route: segment.roadName,
    section: segment.segmentLabel,
    km: `KM ${midKm.toFixed(1)}`,

    pavementHealth: Math.round(segment.healthScore),
    potholeCount: Math.max(1, Math.round(segment.distress.potholes / 8)),
    ruttingMm: Number(((segment.distress.rutting / 100) * 12).toFixed(1)),
    crackingPercent: Math.round(segment.distress.cracking * 10) / 10,
    moisturePercent: clamp(Math.round(100 - segment.drainageScore * 0.7), 0, 100),

    freezeThawRisk: freezeThawRiskFor(segment.freezeThawCycles),
    slopeRisk: RISK_LEVEL_TO_SLOPE_RISK[segment.riskLevel],

    failureProbability: Math.round(segment.probabilityOfFailurePct),
    predictedFailureMonths: Math.max(1, Math.round(segment.timeToInterventionDays / 30)),

    recommendedRepair,
    roadHealthAfterRepair: Math.min(97, Math.round(segment.healthScore + REPAIR_HEALTH_BOOST[recommendedRepair])),
  };
}
