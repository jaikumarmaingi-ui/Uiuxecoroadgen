import type { DefectType, RoadDefect, Severity, TerrainType } from "./types";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const SEVERITY_RISK: Record<Severity, RoadDefect["risk"]> = {
  low: "LOW",
  moderate: "MODERATE",
  high: "HIGH",
  critical: "CRITICAL",
};

const TERRAIN_DEFECT_WEIGHTS: Record<TerrainType, Partial<Record<DefectType, number>>> = {
  plains: { crack: 3, pothole: 3, edge: 2, water: 2 },
  hilly: { edge: 3, crack: 2, rutting: 2, water: 2, deformation: 1 },
  mountain: { edge: 3, crack: 2, deformation: 3, water: 1, pothole: 1 },
  desert: { rutting: 3, deformation: 2, edge: 2, crack: 2 },
  forest: { water: 3, crack: 2, edge: 2, deformation: 1 },
  urban: { pothole: 3, crack: 3, deformation: 2, water: 2 },
};

function pickWeighted(rand: () => number, weights: Partial<Record<DefectType, number>>): DefectType {
  const entries = Object.entries(weights) as [DefectType, number][];
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [type, w] of entries) {
    r -= w;
    if (r <= 0) return type;
  }
  return entries[0][0];
}

export function generateDefects(terrain: TerrainType, seed: number, count = 11): RoadDefect[] {
  const rand = seededRandom(seed + 7);
  const weights = TERRAIN_DEFECT_WEIGHTS[terrain];
  const defects: RoadDefect[] = [];
  const severities: Severity[] = ["low", "moderate", "high", "critical"];
  const severityWeights = [0.35, 0.32, 0.23, 0.1];

  for (let i = 0; i < count; i++) {
    const type = pickWeighted(rand, weights);
    const sevRoll = rand();
    let severity: Severity = "low";
    let acc = 0;
    for (let j = 0; j < severities.length; j++) {
      acc += severityWeights[j];
      if (sevRoll <= acc) {
        severity = severities[j];
        break;
      }
    }
    const t = 0.06 + rand() * 0.88;
    const offset = (rand() - 0.5) * 1.7;
    const daysAgo = Math.floor(rand() * 45) + 1;
    const detected = new Date();
    detected.setDate(detected.getDate() - daysAgo);

    const severityScale = { low: 0.4, moderate: 0.7, high: 1, critical: 1.4 }[severity];

    defects.push({
      id: `${terrain.slice(0, 2).toUpperCase()}-${String(1000 + Math.floor(rand() * 9000)).padStart(5, "0")}`,
      type,
      severity,
      t,
      offset,
      depthMm: type === "pothole" ? Math.round((30 + rand() * 70) * severityScale) : undefined,
      diameterMm: type === "pothole" ? Math.round((250 + rand() * 500) * severityScale) : undefined,
      rutDepthMm: type === "rutting" ? Math.round((15 + rand() * 45) * severityScale) : undefined,
      confidencePct: Math.round((82 + rand() * 17) * 10) / 10,
      segment: `NH-44 / KM ${Math.floor(80 + rand() * 200)}.${Math.floor(rand() * 9)}`,
      detectedIso: detected.toISOString(),
      predictedGrowthPct: Math.round((8 + rand() * 40) * severityScale),
      risk: SEVERITY_RISK[severity],
    });
  }

  return defects.sort((a, b) => a.t - b.t);
}

export const DEFECT_LABEL: Record<DefectType, string> = {
  pothole: "Pothole",
  crack: "Crack",
  rutting: "Rutting",
  edge: "Edge Failure",
  water: "Water Damage",
  deformation: "Deformation",
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  low: "#f0c93d",
  moderate: "#ff9a3d",
  high: "#ff4d4d",
  critical: "#b91c1c",
};
