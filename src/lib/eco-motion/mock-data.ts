import type { RoadHealthData } from "./types";

// Example payload shaped like a future `GET /api/road-health/:segmentId`
// response. Replace with real ML/sensor-pipeline output — the component
// doesn't care where this object comes from.
export const sampleRoadHealthData: RoadHealthData = {
  route: "SECTOR D8",
  section: "KM 17.2 – 19.1",
  km: "KM 18.4",

  pavementHealth: 41,
  potholeCount: 7,
  ruttingMm: 7.2,
  crackingPercent: 18.4,
  moisturePercent: 82,

  freezeThawRisk: "HIGH",
  // Spec's example payload used "MODERATE", which isn't in the SlopeRisk union
  // (LOW | MEDIUM | HIGH | CRITICAL) it also specifies — mapped to "MEDIUM" here.
  slopeRisk: "MEDIUM",
  failureProbability: 78,
  predictedFailureMonths: 12,

  recommendedRepair: "SUSTAINABLE_REHABILITATION",
  roadHealthAfterRepair: 91,

  slopeInstabilityProbability: 72,
  roadAccessCompromised: true,
  landslideRecommendations: ["DRAINAGE IMPROVEMENT", "SLOPE STABILIZATION", "RETAINING INTERVENTION"],
};
