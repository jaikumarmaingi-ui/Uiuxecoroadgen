import type { ExplainableFactor, PavementLayer, RepairMethod, RoadRepairOption, TerrainConfig, TerrainType } from "./types";

// Derives the structural-scan / prediction / repair data every inspection
// panel reads from the terrain's existing health/risk/stats fields, so
// nothing is hand-typed per terrain and nothing is invented per interaction
// — the same base numbers just get reused a different way each time.

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

const RISK_TO_FAILURE_PROB: Record<string, [number, number]> = {
  LOW: [18, 34],
  MEDIUM: [42, 64],
  HIGH: [68, 89],
};

export const DOMINANT_FAILURE_CAUSES: Record<TerrainType, string[]> = {
  plains: ["Traffic loading", "Surface aging", "Water ingress"],
  hilly: ["Water ingress", "Shoulder erosion", "Traffic loading"],
  mountain: ["Freeze-thaw cycling", "Slope instability", "Rockfall damage", "Snow load"],
  desert: ["Thermal expansion", "Sand abrasion", "UV surface aging"],
  forest: ["Water ingress", "Poor drainage", "Root heave"],
  urban: ["Traffic loading", "Drainage overload", "Utility cuts"],
};

const FACTOR_WEIGHTS: Record<TerrainType, Record<string, number>> = {
  plains: { "Traffic Loading": 34, "Surface Age": 26, "Water Ingress": 22, Drainage: 12, "Freeze-Thaw": 6 },
  hilly: { "Water Ingress": 30, "Shoulder Erosion": 24, "Traffic Loading": 20, Drainage: 16, "Freeze-Thaw": 10 },
  mountain: { "Freeze-Thaw": 34, "Slope Instability": 26, "Water Ingress": 20, "Traffic Loading": 12, Rockfall: 8 },
  desert: { "Thermal Expansion": 33, "Sand Abrasion": 24, "UV Aging": 21, "Traffic Loading": 14, Drainage: 8 },
  forest: { "Water Ingress": 36, Drainage: 27, "Root Heave": 18, "Traffic Loading": 12, "Freeze-Thaw": 7 },
  urban: { "Traffic Loading": 38, "Drainage Overload": 25, "Utility Cuts": 18, "Surface Age": 12, "Water Ingress": 7 },
};

function buildExplainableFactors(terrain: TerrainType): ExplainableFactor[] {
  const weights = FACTOR_WEIGHTS[terrain];
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  return Object.entries(weights)
    .map(([factor, w]) => ({ factor, contributionPct: Math.round((w / total) * 100) }))
    .sort((a, b) => b.contributionPct - a.contributionPct);
}

const PAVEMENT_LAYER_TEMPLATE: { name: string; thicknessMm: number; material: string }[] = [
  { name: "Wearing Course", thicknessMm: 35, material: "Dense Bituminous Macadam" },
  { name: "Binder Course", thicknessMm: 60, material: "Bituminous Macadam" },
  { name: "Base Course", thicknessMm: 180, material: "Wet Mix Macadam" },
  { name: "Granular Sub-base", thicknessMm: 220, material: "Graded Aggregate" },
  { name: "Compacted Subgrade", thicknessMm: 300, material: "Compacted Natural Soil" },
  { name: "Natural Ground", thicknessMm: 0, material: "In-situ Ground" },
];

function conditionFor(health: number, depthIndex: number): PavementLayer["condition"] {
  // Shallower layers take the damage first; deeper layers read healthier.
  const adjusted = clamp(health + depthIndex * 14, 0, 100);
  if (adjusted >= 75) return "Good";
  if (adjusted >= 55) return "Moderate";
  if (adjusted >= 35) return "Poor";
  return "Critical";
}

const CONTRIBUTION_BY_CONDITION: Record<PavementLayer["condition"], number> = {
  Critical: 34,
  Poor: 24,
  Moderate: 14,
  Good: 6,
};

function buildPavementLayers(health: number): PavementLayer[] {
  return PAVEMENT_LAYER_TEMPLATE.map((layer, i) => {
    const condition = conditionFor(health, i);
    return { ...layer, condition, contributionPct: CONTRIBUTION_BY_CONDITION[condition] };
  });
}

function buildRepairOptions(repairCostLakh: number, health: number): { options: RoadRepairOption[]; recommended: RepairMethod } {
  const options: RoadRepairOption[] = [
    {
      id: "PATCH_REPAIR",
      label: "Conventional Patch Repair",
      description: "Localized asphalt patching over identified defects.",
      costLakh: Math.round(repairCostLakh * 0.5 * 10) / 10,
      expectedLifeYears: 2.5,
      embodiedCo2: "High",
    },
    {
      id: "MILLING_OVERLAY",
      label: "Milling + Overlay",
      description: "Mill the distressed surface and lay a new bituminous overlay.",
      costLakh: Math.round(repairCostLakh * 0.85 * 10) / 10,
      expectedLifeYears: 5.5,
      embodiedCo2: "Moderate",
    },
    {
      id: "SUSTAINABLE_REHABILITATION",
      label: "Sustainable Recycled Rehabilitation",
      description: "Full-depth reclamation with recycled aggregate and plastic-waste binder.",
      costLakh: Math.round(repairCostLakh * 1.35 * 10) / 10,
      expectedLifeYears: 9,
      embodiedCo2: "Lower",
    },
  ];
  const recommended: RepairMethod = health < 55 ? "SUSTAINABLE_REHABILITATION" : health < 72 ? "MILLING_OVERLAY" : "PATCH_REPAIR";
  return { options, recommended };
}

type MetricsInput = Pick<TerrainConfig, "health" | "risk" | "stats" | "defectCounts">;

const DRAINAGE_MOISTURE_RANGE: Record<string, [number, number]> = {
  POOR: [68, 92],
  MODERATE: [40, 66],
  GOOD: [14, 38],
};

function deriveMetrics(config: MetricsInput) {
  const crackDensityPct = clamp(Math.round((100 - config.health) * 0.55 + config.defectCounts.critical * 0.4), 3, 94);
  const ruttingMm = Math.round((2 + (100 - config.health) * 0.16) * 10) / 10;

  const [mLo, mHi] = DRAINAGE_MOISTURE_RANGE[config.stats.drainage] ?? DRAINAGE_MOISTURE_RANGE.MODERATE;
  const moisturePct = Math.round(mLo + (mHi - mLo) * ((100 - config.health) / 100));

  const [pLo, pHi] = RISK_TO_FAILURE_PROB[config.risk.overall] ?? RISK_TO_FAILURE_PROB.MEDIUM;
  const failureProbabilityPct = Math.round(pLo + (pHi - pLo) * clamp((100 - config.health) / 60, 0, 1));

  const predictedFailureDays = clamp(Math.round(420 - failureProbabilityPct * 3.6), 12, 380);
  const predictionConfidencePct = clamp(Math.round(84 + config.defectCounts.total / 30), 84, 97);

  const trendDrop = config.risk.trend[0] - config.risk.trend[config.risk.trend.length - 1];
  const healthProjected12mo = clamp(Math.round(config.health - trendDrop * 2.1), 4, config.health);

  return { crackDensityPct, ruttingMm, moisturePct, failureProbabilityPct, predictedFailureDays, predictionConfidencePct, healthProjected12mo };
}

export function deriveInspectionExtras(base: MetricsInput & Pick<TerrainConfig, "segment">, terrain: TerrainType) {
  const { options, recommended } = buildRepairOptions(base.segment.repairCostLakh, base.health);
  return {
    ...deriveMetrics(base),
    dominantFailureCauses: DOMINANT_FAILURE_CAUSES[terrain],
    explainableFactors: buildExplainableFactors(terrain),
    pavementLayers: buildPavementLayers(base.health),
    repairOptions: options,
    recommendedRepair: recommended,
  };
}
