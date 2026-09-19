import type { RoadRepairOption, SustainabilityImpact, TerrainConfig } from "./types";

const CO2_REDUCTION_BY_TIER: Record<RoadRepairOption["embodiedCo2"], number> = {
  Lower: 46,
  Moderate: 24,
  High: 6,
  Highest: 0,
};

/** Reusable calc: repair choice + segment scale -> sustainability outcome. Swap for a real lifecycle-assessment API later. */
export function calculateSustainabilityImpact(option: RoadRepairOption, config: Pick<TerrainConfig, "segment">): SustainabilityImpact {
  const scale = config.segment.lengthKm;
  const recycledShare = option.id === "SUSTAINABLE_REHABILITATION" ? 1 : option.id === "MILLING_OVERLAY" ? 0.4 : 0.1;

  return {
    materialSavedTons: Math.round(scale * 62 * recycledShare),
    co2ReductionPct: CO2_REDUCTION_BY_TIER[option.embodiedCo2],
    landfillDiversionTons: Math.round(scale * 26 * recycledShare),
    serviceLifeGainYears: Math.round((option.expectedLifeYears - 2.5) * 10) / 10,
  };
}
