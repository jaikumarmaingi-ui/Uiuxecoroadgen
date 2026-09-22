import type { CorridorTerrain, RoadFailureKind } from "./regimes";

/**
 * Conditions and hazards the corridor can be surveyed under.
 *
 * Not a visual filter. Weather is what drives the deterioration mechanisms
 * this product is built on — the corridor already argues that terrain decides
 * how a road dies, and terrain does that largely through the water, ice and
 * wind it delivers. So a condition shifts which failures occur, how fast they
 * run, and whether an inspector can safely open the pavement at all. If it
 * only changed the sky it would be undermining the model rather than
 * demonstrating it.
 *
 * Two of these are not weather and are not described as such: a landslide and
 * an earthquake are hazard events. They sit here because they are surveyed the
 * same way and they act on the same mechanisms.
 */

export type CorridorCondition =
  | "clear"
  | "rain"
  | "flood"
  | "snow"
  | "sandstorm"
  | "landslide"
  | "quake";

export const CONDITION_ORDER: CorridorCondition[] = [
  "clear",
  "rain",
  "flood",
  "snow",
  "sandstorm",
  "landslide",
  "quake",
];

export type PrecipKind = "rain" | "snow" | "dust" | null;

export interface ConditionSpec {
  id: CorridorCondition;
  label: string;
  /** One line for the selector. */
  blurb: string;
  /** Whether this is weather or a discrete hazard event. */
  kind: "weather" | "hazard";
  /**
   * What it does to the pavement, in an engineer's terms. Shown beside the
   * failure list so the shift in what is failing is attributable.
   */
  mechanism: string;

  /** Multipliers applied on top of the regime's own sky and fog. */
  env: {
    fogNearMul: number;
    fogFarMul: number;
    /** Overrides the regime fog colour when set. */
    fogColor: string | null;
    exposureMul: number;
    sunIntensityMul: number;
    sunColor: string | null;
    hemiIntensityMul: number;
    /** Extra turbidity, for haze-heavy conditions. */
    turbidityAdd: number;
  };

  /**
   * Multiplies the regime's own failure weighting. A value of 0 suppresses a
   * mechanism the condition makes impossible; above 1 promotes one it drives.
   */
  failureBias: Partial<Record<RoadFailureKind, number>>;

  /** Scales how fast an untreated defect deteriorates. */
  decayMul: number;
  /** Scales the confidence of a reading taken in these conditions. */
  confidenceMul: number;

  /** Whether the pavement can be opened for a trial pit at all. */
  inspectable: boolean;
  /** Why not, when it is not. Empty when inspectable. */
  inspectionNote: string;

  /** Terrains this is plausible in. A sandstorm in Assam is not a scenario. */
  terrains: readonly CorridorTerrain[] | "all";

  /** What the scene should mount. */
  fx: {
    precip: PrecipKind;
    /** 0-1, drives particle count and opacity. */
    precipRate: number;
    /** 0-1, darkens and gloss-lifts the carriageway. */
    surfaceWet: number;
    /** 0-1, lightens the carriageway and verges toward snow cover. */
    surfaceSnow: number;
    /** 0-1, standing water depth factor on the verge and low ground. */
    standingWater: number;
    /** 0-1, camera and world shake amplitude. */
    shake: number;
    /** 0-1, extra slope debris spilled toward the carriageway. */
    slopeDebris: number;
    /** 0-1, wind strength, for driven precipitation slant. */
    wind: number;
  };
}

const NO_SHIFT = {
  fogNearMul: 1,
  fogFarMul: 1,
  fogColor: null,
  exposureMul: 1,
  sunIntensityMul: 1,
  sunColor: null,
  hemiIntensityMul: 1,
  turbidityAdd: 0,
};

const NO_FX = {
  precip: null as PrecipKind,
  precipRate: 0,
  surfaceWet: 0,
  surfaceSnow: 0,
  standingWater: 0,
  shake: 0,
  slopeDebris: 0,
  wind: 0,
};

export const CONDITIONS: Record<CorridorCondition, ConditionSpec> = {
  clear: {
    id: "clear",
    label: "Clear",
    blurb: "Baseline survey conditions",
    kind: "weather",
    mechanism: "Baseline. The corridor's own terrain drivers act alone.",
    env: { ...NO_SHIFT },
    failureBias: {},
    decayMul: 1,
    confidenceMul: 1,
    inspectable: true,
    inspectionNote: "",
    terrains: "all",
    fx: { ...NO_FX },
  },

  rain: {
    id: "rain",
    label: "Rainfall",
    blurb: "Active rain — drainage under load",
    kind: "weather",
    mechanism:
      "Water reaches the base through open cracking and traffic pumps it out with the fines, which is the pothole mechanism running at speed. Edge erosion accelerates wherever run-off concentrates.",
    env: {
      ...NO_SHIFT,
      fogNearMul: 0.62,
      fogFarMul: 0.55,
      fogColor: "#5c6a74",
      exposureMul: 0.78,
      sunIntensityMul: 0.35,
      sunColor: "#b9c6d2",
      hemiIntensityMul: 1.15,
      turbidityAdd: 4,
    },
    failureBias: {
      potholeCluster: 2.2,
      washout: 2.4,
      edgeBreak: 1.8,
      crocodileCracking: 1.4,
      settlement: 1.3,
      bleeding: 0.3,
      ravelling: 0.6,
    },
    decayMul: 1.45,
    confidenceMul: 0.9,
    inspectable: true,
    inspectionNote: "",
    terrains: "all",
    fx: { ...NO_FX, precip: "rain", precipRate: 0.7, surfaceWet: 0.85, standingWater: 0.25, wind: 0.35 },
  },

  flood: {
    id: "flood",
    label: "Flooding",
    blurb: "Standing water — formation saturated",
    kind: "weather",
    mechanism:
      "Prolonged inundation saturates the subgrade and destroys its bearing capacity. Failures move down the structure: what was a surface problem becomes a formation problem, and a surface treatment applied now would be buried by the settlement that follows.",
    env: {
      ...NO_SHIFT,
      fogNearMul: 0.7,
      fogFarMul: 0.6,
      fogColor: "#6b7280",
      exposureMul: 0.82,
      sunIntensityMul: 0.45,
      sunColor: "#c2ccd6",
      hemiIntensityMul: 1.1,
      turbidityAdd: 3,
    },
    failureBias: {
      settlement: 3.2,
      washout: 3.0,
      potholeCluster: 2.0,
      edgeBreak: 2.0,
      crocodileCracking: 1.5,
      bleeding: 0,
      ravelling: 0.2,
      frostHeave: 0.4,
    },
    decayMul: 1.9,
    confidenceMul: 0.72,
    inspectable: false,
    inspectionNote:
      "A pit cut into a saturated formation fills faster than it can be read, and the walls will not stand. Survey resumes once the water is off the carriageway.",
    terrains: ["plains", "forest", "hilly"],
    fx: { ...NO_FX, precip: "rain", precipRate: 0.35, surfaceWet: 1, standingWater: 1, wind: 0.2 },
  },

  snow: {
    id: "snow",
    label: "Snowfall",
    blurb: "Snow cover — freeze-thaw driving",
    kind: "weather",
    mechanism:
      "Meltwater enters the pavement by day and freezes in it by night. Ice lenses jack the surface apart and leave voids on thaw, which is the frost-heave mechanism; cover also hides surface distress from a visual survey.",
    env: {
      ...NO_SHIFT,
      fogNearMul: 0.5,
      fogFarMul: 0.42,
      fogColor: "#cdd8e2",
      exposureMul: 1.08,
      sunIntensityMul: 0.5,
      sunColor: "#dce8f4",
      hemiIntensityMul: 1.35,
      turbidityAdd: 2,
    },
    failureBias: {
      frostHeave: 3.4,
      potholeCluster: 1.9,
      crocodileCracking: 1.6,
      edgeBreak: 1.4,
      rockfallBurial: 1.5,
      bleeding: 0,
      ravelling: 0.4,
      rutting: 0.5,
    },
    decayMul: 1.35,
    confidenceMul: 0.65,
    inspectable: true,
    inspectionNote: "",
    terrains: ["mountain", "hilly"],
    fx: { ...NO_FX, precip: "snow", precipRate: 0.6, surfaceSnow: 0.8, surfaceWet: 0.25, wind: 0.3 },
  },

  sandstorm: {
    id: "sandstorm",
    label: "Sandstorm",
    blurb: "Wind-driven sand — abrasion and burial",
    kind: "weather",
    mechanism:
      "Wind-driven sand strips the binder film off the aggregate and scours the surface texture. Drifts bury the carriageway edge, and the abrasion accelerates ravelling well beyond its normal rate.",
    env: {
      ...NO_SHIFT,
      fogNearMul: 0.24,
      fogFarMul: 0.16,
      fogColor: "#b08d5c",
      exposureMul: 0.92,
      sunIntensityMul: 0.3,
      sunColor: "#e0b479",
      hemiIntensityMul: 0.85,
      turbidityAdd: 9,
    },
    failureBias: {
      ravelling: 3.2,
      edgeBreak: 1.6,
      longitudinalCracking: 1.2,
      bleeding: 0.7,
      washout: 0,
      settlement: 0.4,
      frostHeave: 0,
    },
    decayMul: 1.3,
    confidenceMul: 0.55,
    inspectable: false,
    inspectionNote:
      "Visibility is below the distance needed to work a live carriageway safely, and an open pit fills with sand faster than the core can be logged.",
    terrains: ["desert", "plains"],
    fx: { ...NO_FX, precip: "dust", precipRate: 0.9, wind: 0.95, slopeDebris: 0.3 },
  },

  landslide: {
    id: "landslide",
    label: "Landslide",
    blurb: "Slope failure — corridor obstructed",
    kind: "hazard",
    mechanism:
      "The cut face has given way. Debris on the carriageway punches through the bound layers where it lands, and the slope above stays unstable until it is scaled — the failure is as much an access problem as a pavement one.",
    env: {
      ...NO_SHIFT,
      fogNearMul: 0.6,
      fogFarMul: 0.5,
      fogColor: "#7a6a5c",
      exposureMul: 0.85,
      sunIntensityMul: 0.55,
      sunColor: "#cbb9a4",
      hemiIntensityMul: 0.95,
      turbidityAdd: 5,
    },
    failureBias: {
      rockfallBurial: 4.5,
      edgeBreak: 1.8,
      potholeCluster: 1.4,
      settlement: 1.3,
      bleeding: 0.2,
      ravelling: 0.4,
    },
    decayMul: 1.25,
    confidenceMul: 0.8,
    inspectable: false,
    inspectionNote:
      "The slope above the defect has not been scaled. Nobody stands under it to cut a pit until it has.",
    terrains: ["mountain", "hilly", "forest"],
    fx: { ...NO_FX, slopeDebris: 1, precip: "dust", precipRate: 0.18, wind: 0.15 },
  },

  quake: {
    id: "quake",
    label: "Earthquake",
    blurb: "Seismic event — structural damage",
    kind: "hazard",
    mechanism:
      "Ground motion opens the pavement along its weak lines and shakes down the slopes above it. Settlement follows wherever the formation was marginal, and cracking runs full depth rather than working up from the base.",
    env: {
      ...NO_SHIFT,
      fogNearMul: 0.75,
      fogFarMul: 0.68,
      fogColor: "#8a8076",
      exposureMul: 0.9,
      sunIntensityMul: 0.7,
      sunColor: "#d6c9b6",
      hemiIntensityMul: 0.9,
      turbidityAdd: 4,
    },
    failureBias: {
      settlement: 3.0,
      longitudinalCracking: 2.6,
      crocodileCracking: 2.0,
      rockfallBurial: 2.4,
      edgeBreak: 1.7,
      bleeding: 0.2,
      ravelling: 0.3,
      corrugation: 0.4,
    },
    decayMul: 1.6,
    confidenceMul: 0.7,
    inspectable: false,
    inspectionNote:
      "Aftershock risk. The corridor is surveyed from the vehicle until the structure has been cleared by an engineer.",
    terrains: "all",
    fx: { ...NO_FX, shake: 1, slopeDebris: 0.55, precip: "dust", precipRate: 0.22, wind: 0.1 },
  },
};

/** Whether a condition is offered for a given corridor. */
export function conditionAllowed(c: CorridorCondition, terrain: CorridorTerrain): boolean {
  const spec = CONDITIONS[c];
  return spec.terrains === "all" || spec.terrains.includes(terrain);
}

/** The conditions offered for a corridor, in canonical order. */
export function conditionsFor(terrain: CorridorTerrain): CorridorCondition[] {
  return CONDITION_ORDER.filter((c) => conditionAllowed(c, terrain));
}
