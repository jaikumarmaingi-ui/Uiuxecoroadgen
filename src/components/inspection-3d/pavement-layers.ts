import type { RoadSegment } from "@/lib/types";
import type { RoadFailureKind } from "@/lib/inspection-3d/regimes";
import type { CorridorDefect } from "@/lib/inspection-3d/corridor-defects";

export interface PavementLayerDef {
  key: string;
  label: string;
  baseColor: string;
  distressColor: string;
}

export const PAVEMENT_LAYERS: PavementLayerDef[] = [
  { key: "surface", label: "Surface Course", baseColor: "#3a3f47", distressColor: "#9c3a3a" },
  { key: "binder", label: "Binder Course", baseColor: "#4a3c2c", distressColor: "#9a5a2f" },
  { key: "base", label: "Base Course", baseColor: "#7a7265", distressColor: "#a5793d" },
  { key: "subbase", label: "Sub-base", baseColor: "#9a927f", distressColor: "#ab8f4d" },
  { key: "subgrade", label: "Subgrade", baseColor: "#5f4a34", distressColor: "#7d5a37" },
];

export const LAYER_THICKNESS = 0.24;
export const LAYER_EXPLODE_GAP = 0.6;
export const LAYER_FOOTPRINT = 2.5;

/**
 * How far the whole stack lifts out of the trial pit when it explodes.
 *
 * The layers explode downwards from the surface course, so an exploded stack
 * left in place sits entirely below ground — and framing it means putting the
 * camera underneath the terrain, which renders as the stack floating in an
 * empty sky. Lifting the assembly by its own exploded depth (plus a little
 * clearance) keeps the surface course on top, puts the whole thing in front of
 * a standing observer, and reads as the exploded diagram it is meant to be.
 */
export const LAYER_EXPLODE_RISE =
  (PAVEMENT_LAYERS.length - 1) * (LAYER_THICKNESS + LAYER_EXPLODE_GAP) + 0.55;

export interface LayerInspection {
  label: string;
  composition: string;
  integrityPct: number;
  note: string;
}

/**
 * Which layer a given failure originates in.
 *
 * The core is meant to answer "where did this start", so the layer the
 * mechanism actually attacks has to read as the worst one. A ravelled surface
 * with a pristine wearing course, or a fatigue failure with a sound base,
 * would contradict the mechanism printed next to it.
 */
const ORIGIN_LAYER: Record<RoadFailureKind, number> = {
  ravelling: 0,
  bleeding: 0,
  corrugation: 0,
  potholeCluster: 1,
  longitudinalCracking: 1,
  rutting: 1,
  crocodileCracking: 2,
  rockfallBurial: 2,
  edgeBreak: 3,
  washout: 3,
  settlement: 4,
  frostHeave: 4,
};

/**
 * Penalty applied to a layer's integrity for the failure under inspection:
 * heaviest at the originating layer, tapering away from it.
 */
function failurePenalty(index: number, defect: CorridorDefect | null | undefined): number {
  if (!defect) return 0;
  const origin = ORIGIN_LAYER[defect.kind];
  const sev = defect.severity === "critical" ? 34 : defect.severity === "high" ? 22 : 12;
  const distance = Math.abs(index - origin);
  return Math.round(sev / (1 + distance * 1.6));
}

export function layerInspectionFor(
  index: number,
  segment: RoadSegment,
  defect?: CorridorDefect | null,
): LayerInspection {
  const penalty = failurePenalty(index, defect);
  const adjust = (v: number) => Math.max(4, Math.min(100, Math.round(v) - penalty));
  switch (index) {
    case 0:
      return {
        label: "Surface Course",
        composition: "Dense-graded hot-mix wearing course",
        integrityPct: adjust(100 - segment.distress.cracking),
        note: `Cracking index ${segment.distress.cracking}, ravelling ${segment.distress.ravelling}. The surface course is the first structural indicator to show freeze-thaw stress.`,
      };
    case 1:
      return {
        label: "Binder Course",
        composition: "Bituminous binder / intermediate course",
        integrityPct: adjust(segment.structural.loadResponse),
        note: `Load response ${segment.structural.loadResponse}/100 — measures how the binder course redistributes convoy axle loading before it reaches the base.`,
      };
    case 2:
      return {
        label: "Base Course",
        composition: "Crushed aggregate base course",
        integrityPct: adjust(segment.structural.pavementStrength),
        note: `Pavement strength ${segment.structural.pavementStrength}/100. Primary load-bearing layer — deflection reading of ${segment.structural.deflection} suggests ${segment.structural.deflection > 45 ? "elevated" : "controlled"} structural movement under load.`,
      };
    case 3:
      return {
        label: "Sub-base",
        composition: "Granular sub-base, primary drainage layer",
        integrityPct: adjust(segment.drainageScore),
        note: `Drainage score ${segment.drainageScore}/100 at ${segment.rainfallMm}mm annual rainfall. Poor permeability here accelerates frost-heave damage upward through the structure.`,
      };
    case 4:
    default:
      return {
        label: "Subgrade",
        composition: "Compacted natural subgrade",
        integrityPct: adjust(segment.structural.subgradeCondition),
        note: `Subgrade condition ${segment.structural.subgradeCondition}/100 after ${segment.freezeThawCycles} annual freeze-thaw cycles. Root-cause layer behind most structural failures on this corridor.`,
      };
  }
}
