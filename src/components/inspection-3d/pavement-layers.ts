import type { RoadSegment } from "@/lib/types";

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

export interface LayerInspection {
  label: string;
  composition: string;
  integrityPct: number;
  note: string;
}

export function layerInspectionFor(index: number, segment: RoadSegment): LayerInspection {
  switch (index) {
    case 0:
      return {
        label: "Surface Course",
        composition: "Dense-graded hot-mix wearing course",
        integrityPct: Math.max(5, 100 - segment.distress.cracking),
        note: `Cracking index ${segment.distress.cracking}, ravelling ${segment.distress.ravelling}. The surface course is the first structural indicator to show freeze-thaw stress.`,
      };
    case 1:
      return {
        label: "Binder Course",
        composition: "Bituminous binder / intermediate course",
        integrityPct: segment.structural.loadResponse,
        note: `Load response ${segment.structural.loadResponse}/100 — measures how the binder course redistributes convoy axle loading before it reaches the base.`,
      };
    case 2:
      return {
        label: "Base Course",
        composition: "Crushed aggregate base course",
        integrityPct: segment.structural.pavementStrength,
        note: `Pavement strength ${segment.structural.pavementStrength}/100. Primary load-bearing layer — deflection reading of ${segment.structural.deflection} suggests ${segment.structural.deflection > 45 ? "elevated" : "controlled"} structural movement under load.`,
      };
    case 3:
      return {
        label: "Sub-base",
        composition: "Granular sub-base, primary drainage layer",
        integrityPct: segment.drainageScore,
        note: `Drainage score ${segment.drainageScore}/100 at ${segment.rainfallMm}mm annual rainfall. Poor permeability here accelerates frost-heave damage upward through the structure.`,
      };
    case 4:
    default:
      return {
        label: "Subgrade",
        composition: "Compacted natural subgrade",
        integrityPct: segment.structural.subgradeCondition,
        note: `Subgrade condition ${segment.structural.subgradeCondition}/100 after ${segment.freezeThawCycles} annual freeze-thaw cycles. Root-cause layer behind most structural failures on this corridor.`,
      };
  }
}
