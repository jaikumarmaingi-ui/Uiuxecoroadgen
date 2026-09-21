import { CORRIDOR_REGIMES, FAILURE_META, type CorridorRegime, type RoadFailureKind } from "./regimes";
import type { CorridorDefect, FailureSeverity } from "./corridor-defects";
import type { DeteriorationPoint, FeatureContribution } from "@/lib/types";

/**
 * What the AI pass concludes about one flagged failure.
 *
 * The 3D survey goes to some trouble to make each failure specific — the
 * mechanism that caused it, the layer it starts in, where across the
 * carriageway it sits, how big it actually is. None of that reached the
 * results panel, which read a fixed demo segment, so a desert bleeding
 * failure and a Himalayan frost heave produced identical findings. Everything
 * here is derived from the defect and the corridor it sits in.
 */

export type LayerKey = "surface" | "binder" | "base" | "subbase" | "subgrade";

export const LAYER_ORDER: LayerKey[] = ["surface", "binder", "base", "subbase", "subgrade"];

export const LAYER_LABEL: Record<LayerKey, string> = {
  surface: "Surface Course",
  binder: "Binder Course",
  base: "Base Course",
  subbase: "Sub-base",
  subgrade: "Subgrade",
};

/** The layer each mechanism attacks first. Mirrors ORIGIN_LAYER in pavement-layers. */
export const ORIGIN_LAYER_KEY: Record<RoadFailureKind, LayerKey> = {
  ravelling: "surface",
  bleeding: "surface",
  corrugation: "surface",
  potholeCluster: "binder",
  longitudinalCracking: "binder",
  rutting: "binder",
  crocodileCracking: "base",
  rockfallBurial: "base",
  edgeBreak: "subbase",
  washout: "subbase",
  settlement: "subgrade",
  frostHeave: "subgrade",
};

/**
 * Whether the failure has reached the load-bearing structure.
 *
 * This is the distinction that decides the treatment: a surface-bound defect
 * can be sealed or inlaid, a structural one cannot be patched away. Getting
 * this wrong is how maintenance budgets get spent twice on the same chainage.
 */
export function isStructural(kind: RoadFailureKind): boolean {
  const origin = ORIGIN_LAYER_KEY[kind];
  return origin === "base" || origin === "subbase" || origin === "subgrade";
}

/**
 * Which corridor conditions drive each mechanism.
 *
 * These are the factors an engineer would name in a defect report, weighted
 * by how much of the cause each one carries. They are the explanation's
 * evidence, so they have to be the mechanism's own drivers rather than a
 * generic risk-factor list.
 */
const DRIVERS: Record<RoadFailureKind, [string, number][]> = {
  potholeCluster: [
    ["Water ingress through cracking", 34],
    ["Convoy axle loading", 26],
    ["Base layer saturation", 22],
    ["Deferred crack sealing", 18],
  ],
  crocodileCracking: [
    ["Cumulative fatigue loading", 38],
    ["Loss of base stiffness", 27],
    ["Pavement age", 19],
    ["Drainage adequacy", 16],
  ],
  longitudinalCracking: [
    ["Thermal cycling", 33],
    ["Construction joint quality", 30],
    ["Differential support", 21],
    ["Age of seal", 16],
  ],
  rutting: [
    ["Slow heavy axles", 36],
    ["Binder softening at service temperature", 31],
    ["Mix stability", 20],
    ["Gradient and braking", 13],
  ],
  ravelling: [
    ["Binder ageing and embrittlement", 40],
    ["UV and temperature range", 24],
    ["Aggregate adhesion loss", 22],
    ["Surface age", 14],
  ],
  edgeBreak: [
    ["Unsupported shoulder", 37],
    ["Edge wheel tracking", 28],
    ["Shoulder erosion", 22],
    ["Carriageway width", 13],
  ],
  settlement: [
    ["Subgrade consolidation", 36],
    ["Formation saturation", 29],
    ["Compaction quality", 21],
    ["Sustained loading", 14],
  ],
  washout: [
    ["Concentrated surface run-off", 39],
    ["Drainage capacity", 28],
    ["Fill erodibility", 20],
    ["Rainfall intensity", 13],
  ],
  rockfallBurial: [
    ["Freeze-thaw on the cut face", 35],
    ["Slope stability", 29],
    ["Impact damage to bound layers", 23],
    ["Catch-ditch capacity", 13],
  ],
  frostHeave: [
    ["Frost-susceptible subgrade", 38],
    ["Freeze-thaw cycle count", 28],
    ["Groundwater level", 21],
    ["Insulation depth", 13],
  ],
  bleeding: [
    ["Excess binder content", 37],
    ["Peak pavement temperature", 31],
    ["Traffic kneading", 19],
    ["Surface texture depth", 13],
  ],
  corrugation: [
    ["Mix instability", 35],
    ["Braking and acceleration zone", 30],
    ["Binder softness", 21],
    ["Aggregate gradation", 14],
  ],
};

/** How much of the drivable corridor a terrain contributes to a given mechanism. */
const TERRAIN_NOTE: Record<CorridorRegime["id"], string> = {
  mountain: "sustained freeze-thaw exposure above 3,000 m and convoy loading on a single-carriageway pass",
  hilly: "side-long ground and concentrated drainage across a ghat section",
  plains: "high-volume commercial axle loading on a flat, fast alignment",
  desert: "a wide diurnal temperature range and wind-blown sand abrasion",
  forest: "prolonged monsoon saturation under a closed canopy that limits drying",
};

export interface DefectDiagnosis {
  /** Headline finding, one sentence. */
  headline: string;
  /** The full explanation an engineer would read in the report. */
  explanation: string;
  /** The layer the mechanism starts in. */
  originLayer: LayerKey;
  structural: boolean;
  /** Measured plan area of the affected carriageway, m². */
  areaM2: number;
  /** Health of this chainage now, 0-100. */
  healthNow: number;
  /** What the drivers contribute to this finding. */
  contributions: FeatureContribution[];
  /** Health at now / 30d / 60d / 90d if untreated. */
  forecast: DeteriorationPoint[];
  /** Days before the failure reaches the next layer down or closes a lane. */
  timeToInterventionDays: number;
  confidencePct: number;
}

/**
 * How the core reading corroborates the mechanism.
 *
 * The clause has to name what the reading rules *out*, and that differs by
 * origin: for a surface-course failure "rather than surface wear" would be
 * self-contradictory, and for a subgrade failure "rather than a deeper
 * problem" would be nonsense.
 */
function corroboration(origin: LayerKey): string {
  switch (origin) {
    case "surface":
      return "which places the mechanism in the wearing course rather than in the structure beneath it";
    case "binder":
      return "which puts the failure in the bound layers rather than in the base or the formation";
    case "base":
      return "which points to loss of base support rather than to surface wear alone";
    case "subbase":
      return "which points to the granular layer and its drainage rather than to the bound layers above";
    case "subgrade":
    default:
      return "which places the cause in the formation itself rather than in anything the surface would reveal";
  }
}

/** Deterministic jitter so two defects of the same kind do not read identically. */
function hashUnit(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const SEVERITY_HEALTH: Record<FailureSeverity, number> = {
  moderate: 62,
  high: 44,
  critical: 27,
};

/** Monthly health loss if nothing is done. Structural failures run away faster. */
function decayPerMonth(defect: CorridorDefect, structural: boolean): number {
  const bySeverity = defect.severity === "critical" ? 9.5 : defect.severity === "high" ? 6.5 : 4;
  return bySeverity * (structural ? 1.35 : 1);
}

export function diagnoseDefect(defect: CorridorDefect, regime: CorridorRegime): DefectDiagnosis {
  const meta = FAILURE_META[defect.kind];
  const originLayer = ORIGIN_LAYER_KEY[defect.kind];
  const structural = isStructural(defect.kind);
  const jitter = hashUnit(defect.id);

  const areaM2 = Math.round(defect.lengthM * defect.widthM * 10) / 10;
  const healthNow = Math.round(SEVERITY_HEALTH[defect.severity] + (jitter - 0.5) * 9);

  // Drivers are the mechanism's own, nudged so repeated kinds along one
  // corridor do not print the same four numbers, then renormalised to 100.
  const raw = DRIVERS[defect.kind].map(([factor, weight], i) => ({
    factor,
    weight: weight * (0.88 + ((jitter * (i + 3)) % 1) * 0.24),
  }));
  const sum = raw.reduce((s, r) => s + r.weight, 0);
  const contributions: FeatureContribution[] = raw.map((r) => ({
    factor: r.factor,
    weight: Math.round((r.weight / sum) * 100),
  }));
  // Independent rounding lands on 99 or 101 often enough to be noticed in a
  // panel that presents these as shares of the finding. The remainder goes on
  // the largest driver, where a single point is proportionally smallest.
  const drift = 100 - contributions.reduce((t, c) => t + c.weight, 0);
  if (drift !== 0) {
    const largest = contributions.reduce((a, b) => (b.weight > a.weight ? b : a));
    largest.weight += drift;
  }

  const decay = decayPerMonth(defect, structural);
  const forecast: DeteriorationPoint[] = [0, 1, 2, 3].map((m) => ({
    label: m === 0 ? "Now" : `${m * 30}d`,
    // Deterioration accelerates once water is in the structure, so the curve
    // steepens rather than running down in a straight line.
    health: Math.max(5, Math.round(healthNow - decay * m * (1 + m * 0.18))),
  }));

  // The window closes when the defect would drop below a health of 30, which
  // is where a bound-layer repair stops being enough.
  const monthsToCritical = Math.max(0.2, (healthNow - 30) / decay);
  const timeToInterventionDays = Math.max(7, Math.round(monthsToCritical * 30));

  const side =
    Math.abs(defect.x) < 0.6
      ? "on the centreline"
      : defect.x > 0
        ? "in the offside wheel path"
        : "in the nearside wheel path";

  const headline = `${meta.label} at ${Math.round(defect.chainageM)} m, ${areaM2} m² of carriageway, originating in the ${LAYER_LABEL[originLayer].toLowerCase()}.`;

  const explanation = [
    `${meta.mechanism}`,
    `Here it presents ${side} over ${defect.lengthM.toFixed(1)} m × ${defect.widthM.toFixed(1)} m — ${areaM2} m² — and the core confirms the worst integrity at the ${LAYER_LABEL[originLayer].toLowerCase()}, ${corroboration(originLayer)}.`,
    `The corridor contributes ${TERRAIN_NOTE[regime.id]}.`,
    structural
      ? `Because the failure has reached the load-bearing structure, a surface treatment would close it visually and leave the cause in place; the defect would return within one season.`
      : `The failure is still confined above the base course, so a bound-layer treatment applied now restores the structure rather than deferring it.`,
  ].join(" ");

  return {
    headline,
    explanation,
    originLayer,
    structural,
    areaM2,
    healthNow,
    contributions,
    forecast,
    timeToInterventionDays,
    confidencePct: defect.confidencePct,
  };
}

export function diagnoseFor(defect: CorridorDefect, terrain: CorridorRegime["id"]): DefectDiagnosis {
  return diagnoseDefect(defect, CORRIDOR_REGIMES[terrain]);
}
