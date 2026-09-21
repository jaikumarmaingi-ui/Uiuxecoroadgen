/**
 * Corridor regimes for the 3D field inspection.
 *
 * One drivable corridor, five landscapes. Everything that differs between them
 * — the cross-section of the cut and fill, the relief, the palette, the light,
 * the roadside furniture, and crucially *which road failures actually occur* —
 * is data here rather than conditionals scattered through the scene.
 *
 * The failure weighting is the part that matters to the product: a road does
 * not fail the same way in a Himalayan pass as it does in the Thar desert, and
 * the whole EcoRoadGen argument is that the causal model has to reflect that.
 */

export type CorridorTerrain = "mountain" | "hilly" | "plains" | "desert" | "forest";

export const CORRIDOR_TERRAIN_ORDER: CorridorTerrain[] = [
  "mountain",
  "hilly",
  "plains",
  "desert",
  "forest",
];

/** A point on the lateral cross-section: distance from the centreline, height. */
export type ProfileStop = readonly [distance: number, height: number];

export type RGB = readonly [number, number, number];

/**
 * How a carriageway fails. Distinct from the dashboard's `DefectType` on
 * purpose: these are the things you can stand next to and see in section, and
 * several of them (washout, rockfall burial, frost heave) are failures of the
 * ground rather than of the pavement.
 */
export type RoadFailureKind =
  | "potholeCluster"
  | "crocodileCracking"
  | "longitudinalCracking"
  | "rutting"
  | "ravelling"
  | "edgeBreak"
  | "settlement"
  | "washout"
  | "rockfallBurial"
  | "frostHeave"
  | "bleeding"
  | "corrugation";

export interface FailureMeta {
  label: string;
  /** What the inspector is looking at, in one line. */
  summary: string;
  /** The mechanism, for the explainable-AI readout. */
  mechanism: string;
  /** Surface treatment used to draw it on the carriageway. */
  form: "pits" | "crazing" | "seams" | "troughs" | "erosion" | "debris" | "heave" | "sheen";
}

export const FAILURE_META: Record<RoadFailureKind, FailureMeta> = {
  potholeCluster: {
    label: "Pothole cluster",
    summary: "Bound layers lost over a patch of carriageway, down to base.",
    mechanism:
      "Water reaches the base through open cracking, traffic pumps it out with the fines, and the unsupported surface breaks up.",
    form: "pits",
  },
  crocodileCracking: {
    label: "Crocodile cracking",
    summary: "Interconnected fatigue cracking in the wheel path.",
    mechanism:
      "Repeated axle loading exceeds the fatigue life of a base that has lost stiffness, so cracks initiate at the bottom of the bound layer and work upward.",
    form: "crazing",
  },
  longitudinalCracking: {
    label: "Longitudinal cracking",
    summary: "Cracks running with the carriageway, often on a joint line.",
    mechanism:
      "Thermal cycling and a weak construction joint open a seam that then admits water into the pavement.",
    form: "seams",
  },
  rutting: {
    label: "Rutting",
    summary: "Permanent deformation channelled along the wheel paths.",
    mechanism:
      "Heavy, slow axles densify and shove a binder course that is too soft for the service temperature.",
    form: "troughs",
  },
  ravelling: {
    label: "Ravelling",
    summary: "Aggregate stripping out of the surface course.",
    mechanism:
      "The bitumen film has aged and embrittled, losing adhesion to the aggregate, which traffic then plucks out.",
    form: "crazing",
  },
  edgeBreak: {
    label: "Edge break",
    summary: "Carriageway edge crumbling into the shoulder.",
    mechanism:
      "An unsupported or eroded shoulder leaves the edge of the bound layer cantilevered, and it shears under wheel loads that track too close to it.",
    form: "erosion",
  },
  settlement: {
    label: "Settlement",
    summary: "Localised depression where the formation has given way.",
    mechanism:
      "A saturated or poorly compacted subgrade consolidates under load, taking the pavement down with it.",
    form: "troughs",
  },
  washout: {
    label: "Washout",
    summary: "Shoulder and sub-base scoured away by surface water.",
    mechanism:
      "Concentrated run-off with nowhere to go erodes the fill, undercutting the carriageway from the side.",
    form: "erosion",
  },
  rockfallBurial: {
    label: "Rockfall debris",
    summary: "Slope material on the carriageway, with impact damage beneath.",
    mechanism:
      "Freeze-thaw prises blocks off the cut face; they land on the running surface and punch through the bound layers.",
    form: "debris",
  },
  frostHeave: {
    label: "Frost heave",
    summary: "Surface lifted and cracked by ice in the formation.",
    mechanism:
      "Water in a frost-susceptible subgrade forms ice lenses that jack the pavement upward, then leave a void when they thaw.",
    form: "heave",
  },
  bleeding: {
    label: "Bleeding",
    summary: "Binder drawn to the surface, leaving a slick black film.",
    mechanism:
      "Excess binder expands in high pavement temperatures and migrates upward, filling the surface texture and destroying skid resistance.",
    form: "sheen",
  },
  corrugation: {
    label: "Corrugation",
    summary: "Regular ripples across the running surface.",
    mechanism:
      "An unstable mix shoves into waves where vehicles brake and accelerate, often at approaches and bends.",
    form: "heave",
  },
};

export interface CorridorRegime {
  id: CorridorTerrain;
  label: string;
  /** One line for the selector. */
  blurb: string;
  /** Representative corridor name, for the roadside board and the HUD. */
  routeLabel: string;
  chainageLabel: string;

  /** Lateral cross-section on the cut side (negative X) and fill side (+X). */
  cutProfile: readonly ProfileStop[];
  fillProfile: readonly ProfileStop[];

  /** Relief amplitudes: close to the road, and out towards the skyline. */
  nearAmp: number;
  farAmp: number;
  /** Frequency multiplier for the near-field detail noise. */
  detailScale: number;
  /** Height of the range closing the far end of the corridor. */
  aheadHeight: number;

  palette: {
    rockDark: RGB;
    rockLight: RGB;
    soil: RGB;
    scree: RGB;
    /** Vegetation tint mixed in on gentle ground; null for bare regimes. */
    verdure: RGB | null;
    /** Snow cap colour, or null where there is no snowline. */
    snow: RGB | null;
  };
  /** Height band over which snow comes in. Ignored when palette.snow is null. */
  snowline: readonly [number, number];
  /** Slope above which ground reads as bare rock rather than soil. */
  rockSlope: readonly [number, number];

  sky: {
    sunPosition: readonly [number, number, number];
    sunIntensity: number;
    sunColor: string;
    turbidity: number;
    rayleigh: number;
    fogColor: string;
    fogNear: number;
    fogFar: number;
    hemiSky: string;
    hemiGround: string;
    hemiIntensity: number;
    /** Tone-mapping exposure — deserts need pulling down, forests lifting. */
    exposure: number;
  };

  props: {
    boulders: number;
    boulderSpread: number;
    /** Conifers / broadleaf scatter. */
    trees: number;
    treeHeight: readonly [number, number];
    /** Low scrub or tussock tufts. */
    scrub: number;
    barrier: boolean;
    snowPoles: boolean;
    /** Wind-blown sand streaks across the carriageway. */
    sandDrift: boolean;
  };

  /** Baseline surface wear for the carriageway texture, 0..1. */
  surfaceDistress: number;
  /** Failure modes that actually occur here, with relative likelihood. */
  failureWeights: Partial<Record<RoadFailureKind, number>>;
}

const MOUNTAIN: CorridorRegime = {
  id: "mountain",
  label: "Mountain",
  blurb: "High-altitude pass — cut face, gorge, freeze-thaw",
  routeLabel: "NH-3 · SRINAGAR–LEH",
  chainageLabel: "KM 210–230",
  cutProfile: [
    [8.2, 0],
    [11.2, 3.2],
    [26, 20],
    [60, 44],
    [120, 86],
    [210, 128],
  ],
  fillProfile: [
    [8.2, 0],
    [12.2, -6.5],
    [30, -26],
    [52, -33],
    [88, -6],
    [140, 52],
    [230, 112],
  ],
  nearAmp: 11,
  farAmp: 34,
  detailScale: 1,
  aheadHeight: 40,
  palette: {
    rockDark: [0.19, 0.19, 0.2],
    rockLight: [0.4, 0.39, 0.39],
    soil: [0.26, 0.23, 0.19],
    scree: [0.34, 0.33, 0.32],
    verdure: null,
    snow: [0.82, 0.85, 0.9],
  },
  snowline: [58, 96],
  rockSlope: [0.28, 1.0],
  sky: {
    sunPosition: [132, 74, 104],
    sunIntensity: 2.35,
    sunColor: "#fff0dd",
    turbidity: 4,
    rayleigh: 0.95,
    fogColor: "#7d94ab",
    fogNear: 60,
    fogFar: 450,
    hemiSky: "#aecbe8",
    hemiGround: "#6b5a44",
    hemiIntensity: 0.26,
    exposure: 0.7,
  },
  props: {
    boulders: 120,
    boulderSpread: 9,
    trees: 0,
    treeHeight: [0, 0],
    scrub: 40,
    barrier: true,
    snowPoles: true,
    sandDrift: false,
  },
  surfaceDistress: 0.42,
  failureWeights: {
    frostHeave: 3,
    crocodileCracking: 3,
    potholeCluster: 2.5,
    rockfallBurial: 2.5,
    edgeBreak: 2,
    longitudinalCracking: 1.5,
  },
};

const HILLY: CorridorRegime = {
  id: "hilly",
  label: "Hilly",
  blurb: "Rolling ghat section — side-long ground, drainage stress",
  routeLabel: "SH-17 · WESTERN GHATS",
  chainageLabel: "KM 62–78",
  cutProfile: [
    [8.2, 0],
    [12, 2.2],
    [30, 11],
    [70, 24],
    [140, 40],
    [230, 52],
  ],
  fillProfile: [
    [8.2, 0],
    [13, -4],
    [34, -13],
    [70, -17],
    [120, 4],
    [230, 34],
  ],
  nearAmp: 7,
  farAmp: 18,
  detailScale: 1.3,
  aheadHeight: 22,
  palette: {
    rockDark: [0.2, 0.2, 0.18],
    rockLight: [0.38, 0.37, 0.33],
    soil: [0.24, 0.24, 0.16],
    scree: [0.31, 0.32, 0.25],
    verdure: [0.19, 0.28, 0.15],
    snow: null,
  },
  snowline: [999, 1000],
  rockSlope: [0.45, 1.3],
  sky: {
    sunPosition: [118, 96, 128],
    sunIntensity: 2.2,
    sunColor: "#fff4e4",
    turbidity: 6,
    rayleigh: 1.5,
    fogColor: "#8fa5b0",
    fogNear: 70,
    fogFar: 420,
    hemiSky: "#bcd3e6",
    hemiGround: "#4c5334",
    hemiIntensity: 0.34,
    exposure: 0.74,
  },
  props: {
    boulders: 60,
    boulderSpread: 8,
    trees: 220,
    treeHeight: [3.5, 7.5],
    scrub: 140,
    barrier: true,
    snowPoles: false,
    sandDrift: false,
  },
  surfaceDistress: 0.48,
  failureWeights: {
    edgeBreak: 3,
    washout: 2.5,
    settlement: 2.5,
    potholeCluster: 2,
    crocodileCracking: 2,
    rutting: 1.5,
  },
};

const PLAINS: CorridorRegime = {
  id: "plains",
  label: "Plains",
  blurb: "Flat alluvial corridor — heavy axle loading, poor drainage",
  routeLabel: "NH-19 · GANGETIC PLAIN",
  chainageLabel: "KM 340–358",
  cutProfile: [
    [8.2, 0],
    [14, 0.6],
    [40, 1.6],
    [120, 2.4],
    [230, 3.6],
  ],
  fillProfile: [
    [8.2, 0],
    [13, -2.2],
    [34, -2.8],
    [110, -1.6],
    [230, 1.2],
  ],
  nearAmp: 1.6,
  farAmp: 4,
  detailScale: 0.7,
  aheadHeight: 6,
  palette: {
    rockDark: [0.22, 0.21, 0.17],
    rockLight: [0.36, 0.34, 0.28],
    soil: [0.3, 0.27, 0.19],
    scree: [0.33, 0.31, 0.24],
    verdure: [0.26, 0.31, 0.16],
    snow: null,
  },
  snowline: [999, 1000],
  rockSlope: [0.6, 1.6],
  sky: {
    sunPosition: [96, 118, 150],
    sunIntensity: 2.25,
    sunColor: "#fff6e8",
    turbidity: 9,
    rayleigh: 1.9,
    fogColor: "#a8b3b8",
    fogNear: 90,
    fogFar: 520,
    hemiSky: "#c6d6e2",
    hemiGround: "#5d5a3c",
    hemiIntensity: 0.4,
    exposure: 0.76,
  },
  props: {
    boulders: 0,
    boulderSpread: 6,
    trees: 90,
    treeHeight: [4, 9],
    scrub: 220,
    barrier: false,
    snowPoles: false,
    sandDrift: false,
  },
  surfaceDistress: 0.5,
  failureWeights: {
    rutting: 3.5,
    crocodileCracking: 3,
    settlement: 2.5,
    potholeCluster: 2,
    corrugation: 1.5,
    bleeding: 1,
  },
};

const DESERT: CorridorRegime = {
  id: "desert",
  label: "Desert",
  blurb: "Arid corridor — thermal cycling, sand abrasion, UV ageing",
  routeLabel: "NH-11 · THAR SECTOR",
  chainageLabel: "KM 88–106",
  cutProfile: [
    [8.2, 0],
    [14, 1.4],
    [36, 6],
    [90, 13],
    [180, 19],
    [230, 22],
  ],
  fillProfile: [
    [8.2, 0],
    [13, -2.6],
    [38, -5],
    [100, 3],
    [230, 17],
  ],
  nearAmp: 4.5,
  farAmp: 11,
  detailScale: 0.55,
  aheadHeight: 12,
  palette: {
    rockDark: [0.3, 0.25, 0.18],
    rockLight: [0.52, 0.45, 0.33],
    soil: [0.46, 0.39, 0.27],
    scree: [0.5, 0.43, 0.31],
    verdure: null,
    snow: null,
  },
  snowline: [999, 1000],
  rockSlope: [0.7, 1.8],
  sky: {
    sunPosition: [150, 128, 66],
    sunIntensity: 2.6,
    sunColor: "#fff2d6",
    turbidity: 11,
    rayleigh: 1.1,
    fogColor: "#c2ad8c",
    fogNear: 100,
    fogFar: 560,
    hemiSky: "#d8dcda",
    hemiGround: "#8a7145",
    hemiIntensity: 0.42,
    exposure: 0.58,
  },
  props: {
    boulders: 34,
    boulderSpread: 14,
    trees: 0,
    treeHeight: [0, 0],
    scrub: 90,
    barrier: false,
    snowPoles: false,
    sandDrift: true,
  },
  surfaceDistress: 0.55,
  failureWeights: {
    ravelling: 3.5,
    bleeding: 3,
    longitudinalCracking: 2.5,
    rutting: 2,
    potholeCluster: 1.2,
    edgeBreak: 1.2,
  },
};

const FOREST: CorridorRegime = {
  id: "forest",
  label: "Forest",
  blurb: "Wet forested corridor — water ingress, root heave, shade damp",
  routeLabel: "NH-37 · ASSAM FOREST",
  chainageLabel: "KM 12–29",
  cutProfile: [
    [8.2, 0],
    [12, 2.6],
    [28, 9],
    [70, 18],
    [150, 28],
    [230, 36],
  ],
  fillProfile: [
    [8.2, 0],
    [13, -3.4],
    [32, -9],
    [80, -6],
    [160, 8],
    [230, 24],
  ],
  nearAmp: 6,
  farAmp: 13,
  detailScale: 1.1,
  aheadHeight: 18,
  palette: {
    rockDark: [0.15, 0.17, 0.13],
    rockLight: [0.28, 0.3, 0.24],
    soil: [0.2, 0.21, 0.13],
    scree: [0.25, 0.27, 0.19],
    verdure: [0.14, 0.24, 0.12],
    snow: null,
  },
  snowline: [999, 1000],
  rockSlope: [0.55, 1.5],
  sky: {
    sunPosition: [88, 104, 138],
    sunIntensity: 1.95,
    sunColor: "#f2f6e8",
    turbidity: 8,
    rayleigh: 2.4,
    fogColor: "#8c9b93",
    fogNear: 50,
    fogFar: 330,
    hemiSky: "#b6cbd4",
    hemiGround: "#33401f",
    hemiIntensity: 0.44,
    exposure: 0.82,
  },
  props: {
    boulders: 46,
    boulderSpread: 8,
    trees: 520,
    treeHeight: [6, 14],
    scrub: 260,
    barrier: true,
    snowPoles: false,
    sandDrift: false,
  },
  surfaceDistress: 0.6,
  failureWeights: {
    potholeCluster: 3,
    washout: 3,
    edgeBreak: 2.5,
    settlement: 2.5,
    crocodileCracking: 2,
    ravelling: 1.2,
  },
};

export const CORRIDOR_REGIMES: Record<CorridorTerrain, CorridorRegime> = {
  mountain: MOUNTAIN,
  hilly: HILLY,
  plains: PLAINS,
  desert: DESERT,
  forest: FOREST,
};
