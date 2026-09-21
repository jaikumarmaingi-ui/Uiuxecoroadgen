import { CORRIDOR_REGIMES, FAILURE_META, type CorridorTerrain, type RoadFailureKind } from "./regimes";
import { CHAINAGE_M_PER_UNIT, ROAD_END_Z, ROAD_START_Z, ROAD_WIDTH_M } from "./terrain";

/**
 * The flagged failures along a corridor.
 *
 * Generated per regime from its failure weighting, so a mountain pass produces
 * frost heave and rockfall damage while a desert section produces ravelling
 * and bleeding. Seeded, so the same corridor is the same corridor every time
 * it is opened — an inspection you cannot return to is not an inspection.
 */

export type FailureSeverity = "moderate" | "high" | "critical";

export interface CorridorDefect {
  id: string;
  kind: RoadFailureKind;
  severity: FailureSeverity;
  /** World Z along the corridor. */
  z: number;
  /** Lateral offset from the centreline, in world units. */
  x: number;
  /** Plan extent of the affected area. */
  lengthM: number;
  widthM: number;
  /** Chainage from the start of the drivable stretch, in metres. */
  chainageM: number;
  confidencePct: number;
  /** Share of this segment's failure probability attributed to this defect. */
  contributionPct: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T extends string>(entries: [T, number][], r: number): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let acc = r * total;
  for (const [key, w] of entries) {
    acc -= w;
    if (acc <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

/** Plan size of the affected patch, by failure kind. */
function extentFor(kind: RoadFailureKind, severity: FailureSeverity, rng: () => number) {
  const scale = severity === "critical" ? 1.45 : severity === "high" ? 1.15 : 0.85;
  const base: Record<RoadFailureKind, [number, number]> = {
    potholeCluster: [4.5, 2.6],
    crocodileCracking: [7, 2.2],
    longitudinalCracking: [14, 0.9],
    rutting: [18, 2.0],
    ravelling: [9, 3.2],
    edgeBreak: [11, 1.3],
    settlement: [8, 4.2],
    washout: [10, 3.0],
    rockfallBurial: [6, 3.6],
    frostHeave: [7, 3.4],
    bleeding: [12, 2.4],
    corrugation: [10, 3.2],
  };
  const [l, w] = base[kind];
  return {
    lengthM: l * scale * (0.85 + rng() * 0.3),
    widthM: w * scale * (0.85 + rng() * 0.3),
  };
}

/**
 * Where across the carriageway a failure sits.
 *
 * Not random: edge breaks and washouts are edge phenomena, rutting and
 * crocodile cracking live in the wheel paths, and a longitudinal crack follows
 * the joint near the centreline. Scattering them uniformly would undercut the
 * whole point of naming the mechanism.
 */
function lateralFor(kind: RoadFailureKind, rng: () => number): number {
  const half = ROAD_WIDTH_M / 2;
  const side = rng() > 0.5 ? 1 : -1;
  const wheelPath = side * (half * 0.42 + rng() * half * 0.18);
  switch (kind) {
    case "edgeBreak":
    case "washout":
      return side * (half - 0.45 - rng() * 0.35);
    case "longitudinalCracking":
      return side * (0.15 + rng() * 0.5);
    case "rutting":
    case "crocodileCracking":
    case "bleeding":
      return wheelPath;
    case "rockfallBurial":
      // Debris lands on the cut-face side of the road.
      return -(half * 0.35 + rng() * half * 0.5);
    case "corrugation":
    case "settlement":
    case "frostHeave":
      return side * rng() * half * 0.4;
    default:
      return side * rng() * half * 0.7;
  }
}

export interface CorridorDefectsOptions {
  /** How many failures to flag along the corridor. */
  count?: number;
  /** Extra seed offset, so two corridors of the same regime can differ. */
  seed?: number;
}

/** Seeded per regime so a given corridor is stable across visits. */
const REGIME_SEED: Record<CorridorTerrain, number> = {
  mountain: 10_601,
  hilly: 20_809,
  plains: 31_013,
  desert: 41_231,
  forest: 51_439,
};

export function generateCorridorDefects(
  terrain: CorridorTerrain,
  opts: CorridorDefectsOptions = {},
): CorridorDefect[] {
  const regime = CORRIDOR_REGIMES[terrain];
  const { count = 8, seed = 0 } = opts;
  const rng = mulberry32(REGIME_SEED[terrain] + seed);

  const weights = Object.entries(regime.failureWeights) as [RoadFailureKind, number][];
  // Leave a run-up at the start and a tail at the end so the first failure is
  // not on top of the vehicle and the last is not at the edge of the world.
  const firstZ = ROAD_START_Z - 110;
  const lastZ = ROAD_END_Z + 190;
  const span = firstZ - lastZ;

  const defects: CorridorDefect[] = [];
  for (let i = 0; i < count; i++) {
    // Even spacing with jitter: an inspector should not be able to predict the
    // next one exactly, but should not drive three minutes without seeing any.
    const slot = (i + 0.5) / count;
    const jitter = (rng() - 0.5) * (0.7 / count);
    const t = Math.min(0.98, Math.max(0.02, slot + jitter));
    const z = firstZ - t * span;

    const kind = pickWeighted(weights, rng());
    const sevRoll = rng();
    const severity: FailureSeverity = sevRoll > 0.82 ? "critical" : sevRoll > 0.48 ? "high" : "moderate";
    const { lengthM, widthM } = extentFor(kind, severity, rng);

    defects.push({
      id: `${terrain}-${i + 1}-${kind}`,
      kind,
      severity,
      z,
      x: lateralFor(kind, rng),
      lengthM,
      widthM,
      chainageM: (ROAD_START_Z - z) * CHAINAGE_M_PER_UNIT,
      confidencePct: Math.round(72 + rng() * 26),
      contributionPct: 0,
    });
  }

  // Attribute a share of the segment's failure probability to each defect,
  // weighted by severity, so the numbers in the panel add up to 100.
  const sevWeight: Record<FailureSeverity, number> = { moderate: 1, high: 2.1, critical: 3.6 };
  const total = defects.reduce((s, d) => s + sevWeight[d.severity], 0);
  for (const d of defects) {
    d.contributionPct = Math.round((sevWeight[d.severity] / total) * 100);
  }

  return defects.sort((a, b) => b.z - a.z);
}

export const SEVERITY_HEX: Record<FailureSeverity, string> = {
  moderate: "#f0b93d",
  high: "#ff9a3d",
  critical: "#ff4d4d",
};

export const SEVERITY_LABEL: Record<FailureSeverity, string> = {
  moderate: "MODERATE",
  high: "HIGH",
  critical: "CRITICAL",
};

export function failureLabel(kind: RoadFailureKind) {
  return FAILURE_META[kind].label;
}
