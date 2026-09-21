import type { CorridorRegime, RoadFailureKind } from "./regimes";
import type { CorridorDefect } from "./corridor-defects";
import { ORIGIN_LAYER_KEY, isStructural, type DefectDiagnosis, type LayerKey } from "./diagnosis";

/**
 * Matching a repair to a failure the survey actually measured.
 *
 * The network-level engine prices interventions per kilometre, which is the
 * right unit when you are resurfacing a section. The corridor survey finds
 * defects measured in square metres — a pothole cluster is 12 m², not a
 * kilometre of anything. Quoting a ₹95 lakh/km treatment against it overstates
 * the job by three orders of magnitude, and an engineer reading the panel
 * would stop trusting everything else on it.
 *
 * So treatments here carry a scale, a rate per m² of affected carriageway,
 * and a mobilisation cost that does not scale with area — which is what makes
 * small isolated defects expensive per square metre and large ones cheap, the
 * way real maintenance economics work.
 */

export type TreatmentScale = "spot" | "patch" | "section" | "reconstruction";

export const SCALE_LABEL: Record<TreatmentScale, string> = {
  spot: "Spot repair",
  patch: "Patch repair",
  section: "Section treatment",
  reconstruction: "Reconstruction",
};

export interface TreatmentDef {
  id: string;
  method: string;
  shortLabel: string;
  scale: TreatmentScale;
  description: string;
  /** Deepest layer this treatment reinstates. A treatment cannot fix below it. */
  reachesLayer: LayerKey;
  /** Mechanisms this treatment actually addresses. */
  treats: RoadFailureKind[];
  /** ₹ per m² of affected carriageway. */
  ratePerM2: number;
  /** ₹ lakh to bring plant to site, independent of how small the job is. */
  mobilisationLakh: number;
  /**
   * Minimum continuous treated area, m², below which the method is not
   * practicable regardless of what it scores.
   *
   * This is a plant constraint, not an economic preference: a cold-recycling
   * train has to be walked onto site, calibrated and run continuously, so
   * putting one on four metres of carriageway is not a defensible
   * recommendation however well it scores on carbon. A dig-out has no such
   * constraint, which is why this belongs to the treatment rather than to its
   * scale.
   */
  minContinuousAreaM2: number;
  /** kg CO2e per m², all-in: materials, haulage, plant. */
  co2PerM2: number;
  /** Share of the material that is reclaimed or waste-derived. */
  recycledPct: number;
  /** Tonnes of plastic waste consumed per 100 m². */
  plasticPer100M2: number;
  /** Working days for a 100 m² job; scales sublinearly with area. */
  daysPer100M2: number;
  expectedLifeYears: [number, number];
  /** 1-5. How well it holds up to water sitting on or in the pavement. */
  waterResistance: number;
  freezeThawResistance: number;
  trafficCapacity: number;
  reasons: string[];
  risks: string[];
}

/**
 * The catalogue.
 *
 * Deliberately spans the scale range: a crack seal and a full reconstruction
 * both have to be available, because the survey finds both kinds of failure
 * and recommending one treatment for everything is the failure mode this
 * module exists to avoid.
 */
export const TREATMENTS: TreatmentDef[] = [
  {
    id: "crack-seal",
    method: "Hot-Poured Crack Sealing",
    shortLabel: "Crack seal",
    scale: "spot",
    description:
      "Route out and seal working cracks with a polymer-modified hot-poured sealant before water reaches the base.",
    // Routing a crack cuts through the full depth of the seam, which for a
    // thermal/joint crack runs into the binder course — so this is not a
    // surface-only treatment, and treating it as one would leave the standard
    // answer to longitudinal cracking permanently disqualified.
    reachesLayer: "binder",
    treats: ["longitudinalCracking"],
    ratePerM2: 420,
    mobilisationLakh: 0.6,
    minContinuousAreaM2: 0,
    co2PerM2: 4.2,
    recycledPct: 12,
    plasticPer100M2: 0,
    daysPer100M2: 0.4,
    expectedLifeYears: [3, 5],
    waterResistance: 4,
    freezeThawResistance: 3,
    trafficCapacity: 3,
    reasons: [
      "Keeps water out of the structure at the lowest cost per metre of crack",
      "Opens to traffic within hours of placement",
    ],
    risks: ["Does nothing for a crack that has already spalled or branched into fatigue cracking"],
  },
  {
    id: "surface-dressing",
    method: "Modified Surface Dressing",
    shortLabel: "Surface dressing",
    scale: "section",
    description:
      "Sprayed binder and chip seal restoring texture and waterproofing across the affected surface.",
    reachesLayer: "surface",
    treats: ["ravelling", "bleeding"],
    ratePerM2: 310,
    mobilisationLakh: 1.1,
    minContinuousAreaM2: 0,
    co2PerM2: 7.4,
    recycledPct: 18,
    plasticPer100M2: 0,
    daysPer100M2: 0.5,
    expectedLifeYears: [4, 7],
    waterResistance: 4,
    freezeThawResistance: 3,
    trafficCapacity: 3,
    reasons: [
      "Restores skid resistance and seals an ageing, embrittled surface",
      "Lowest carbon intensity per square metre in the catalogue",
    ],
    risks: [
      "Requires a structurally sound pavement underneath — it adds no strength",
      "Chip loss if placed below about 10 °C",
    ],
  },
  {
    id: "mill-inlay",
    method: "Mill and Inlay — Recycled Asphalt",
    shortLabel: "Mill + inlay",
    scale: "section",
    description:
      "Plane off the distressed bound layers and replace with a cold-recycled mix using the milled material.",
    reachesLayer: "binder",
    treats: ["rutting", "corrugation", "ravelling", "bleeding", "longitudinalCracking"],
    ratePerM2: 1180,
    mobilisationLakh: 2.4,
    minContinuousAreaM2: 0,
    co2PerM2: 19.5,
    recycledPct: 62,
    plasticPer100M2: 0,
    daysPer100M2: 1.1,
    expectedLifeYears: [8, 12],
    waterResistance: 4,
    freezeThawResistance: 4,
    trafficCapacity: 4,
    reasons: [
      "Removes the deformed material rather than overlaying it, so the profile is genuinely corrected",
      "Reuses the planings on site, cutting haulage both ways",
    ],
    risks: ["Leaves an untreated base if the distress turns out to run deeper than the mill depth"],
  },
  {
    id: "patch-plastic",
    method: "Full-Depth Patch — Plastic-Modified Asphalt",
    shortLabel: "Plastic-modified patch",
    scale: "patch",
    description:
      "Saw-cut, excavate to sound material and reinstate in bound layers with a waste-plastic-modified mix.",
    reachesLayer: "base",
    treats: ["potholeCluster", "crocodileCracking", "rockfallBurial"],
    ratePerM2: 2250,
    mobilisationLakh: 2.0,
    minContinuousAreaM2: 0,
    co2PerM2: 26.0,
    recycledPct: 48,
    plasticPer100M2: 0.62,
    daysPer100M2: 1.6,
    expectedLifeYears: [9, 13],
    waterResistance: 5,
    freezeThawResistance: 4,
    trafficCapacity: 4,
    reasons: [
      "Reinstates the full bound thickness, so the patch carries load instead of riding on the failure",
      "Diverts waste plastic into the binder and raises rutting resistance with it",
    ],
    risks: [
      "Only as good as the excavation — sound material has to be reached",
      "Needs a consistent plastic feedstock to hold mix properties",
    ],
  },
  {
    id: "patch-hotmix",
    method: "Full-Depth Patch — Conventional Hot-Mix",
    shortLabel: "Hot-mix patch",
    scale: "patch",
    description: "Saw-cut, excavate and reinstate in dense-graded hot-mix asphalt to the original section.",
    reachesLayer: "base",
    treats: ["potholeCluster", "crocodileCracking", "rockfallBurial", "rutting"],
    ratePerM2: 2050,
    mobilisationLakh: 1.8,
    minContinuousAreaM2: 0,
    co2PerM2: 41.0,
    recycledPct: 8,
    plasticPer100M2: 0,
    daysPer100M2: 1.3,
    expectedLifeYears: [8, 12],
    waterResistance: 4,
    freezeThawResistance: 3,
    trafficCapacity: 5,
    reasons: [
      "Well-understood specification with contractors and materials available at every depot",
      "Highest traffic-load capacity of the patch options",
    ],
    risks: [
      "Roughly 1.6× the embodied carbon of the plastic-modified equivalent for comparable life",
      "Virgin aggregate and binder throughout",
    ],
  },
  {
    id: "edge-reinstate",
    method: "Edge Reinstatement and Shoulder Rebuild",
    shortLabel: "Edge rebuild",
    scale: "patch",
    description:
      "Rebuild the eroded shoulder to support the carriageway edge, reinstate the broken bound edge and re-cut the drainage line.",
    reachesLayer: "subbase",
    treats: ["edgeBreak", "washout"],
    ratePerM2: 1850,
    mobilisationLakh: 1.9,
    minContinuousAreaM2: 0,
    co2PerM2: 22.0,
    recycledPct: 54,
    plasticPer100M2: 0,
    daysPer100M2: 1.4,
    expectedLifeYears: [7, 11],
    waterResistance: 4,
    freezeThawResistance: 4,
    trafficCapacity: 4,
    reasons: [
      "Treats the cause — the unsupported edge — rather than the crumbling that follows from it",
      "Re-establishes the drainage path, without which the same failure returns",
    ],
    risks: ["Ineffective unless the run-off that caused the scour is actually redirected"],
  },
  {
    id: "subgrade-rehab",
    method: "Deep Rehabilitation with Stabilised Subgrade",
    shortLabel: "Deep rehabilitation",
    scale: "reconstruction",
    description:
      "Excavate to formation, stabilise or replace the frost-susceptible or saturated subgrade, and rebuild the pavement in full.",
    reachesLayer: "subgrade",
    treats: ["settlement", "frostHeave", "washout"],
    ratePerM2: 4600,
    mobilisationLakh: 6.5,
    minContinuousAreaM2: 0,
    co2PerM2: 78.0,
    recycledPct: 38,
    plasticPer100M2: 0,
    daysPer100M2: 3.2,
    expectedLifeYears: [15, 22],
    waterResistance: 5,
    freezeThawResistance: 5,
    trafficCapacity: 5,
    reasons: [
      "The only option that reaches a failure originating in the formation",
      "Longest service life in the catalogue, so lowest whole-life cost where it is warranted",
    ],
    risks: [
      "Highest cost and embodied carbon — unjustifiable unless the failure is genuinely structural",
      "Extended lane closure, which on a single-carriageway strategic route is an operational cost of its own",
    ],
  },
  {
    id: "cold-recycle",
    method: "Full-Depth Cold Recycling",
    shortLabel: "Cold in-place recycling",
    scale: "reconstruction",
    description:
      "Pulverise the existing pavement in place, stabilise with bitumen emulsion and cement, and re-lay as the new base.",
    reachesLayer: "subbase",
    treats: ["crocodileCracking", "rutting", "potholeCluster", "edgeBreak"],
    ratePerM2: 2950,
    mobilisationLakh: 5.2,
    minContinuousAreaM2: 200,
    co2PerM2: 33.0,
    recycledPct: 88,
    plasticPer100M2: 0,
    daysPer100M2: 2.1,
    expectedLifeYears: [12, 18],
    waterResistance: 4,
    freezeThawResistance: 4,
    trafficCapacity: 5,
    reasons: [
      "Reuses almost the whole existing pavement in place — no haulage out, little material in",
      "Rebuilds structural capacity at well under reconstruction cost",
    ],
    risks: [
      "Needs a continuous run to be economic; uneconomic on an isolated patch",
      "Cannot correct a failure that starts below the sub-base",
    ],
  },
];

export interface TreatmentQuote {
  def: TreatmentDef;
  /** Carriageway area treated, m² — the defect plus a working margin. */
  areaM2: number;
  costLakh: number;
  co2Tons: number;
  /** CO2e against the conventional hot-mix equivalent for the same job. */
  co2AvoidedTons: number;
  plasticWasteTons: number;
  durationDays: number;
  /** 0-100. How well this treatment fits this failure. */
  suitabilityScore: number;
  /** True when the treatment cannot reach the layer the failure starts in. */
  underReaches: boolean;
  recommended: boolean;
}

const LAYER_DEPTH: Record<LayerKey, number> = {
  surface: 0,
  binder: 1,
  base: 2,
  subbase: 3,
  subgrade: 4,
};

/**
 * Embodied carbon of the conventional equivalent, kg CO2e per m², by scale.
 *
 * Reconstruction is benchmarked against a full rebuild with imported granular
 * material rather than against an asphalt patch, which is why in-situ
 * stabilisation and cold recycling can show a saving at that scale at all.
 */
const CONVENTIONAL_BASELINE_CO2: Record<TreatmentScale, number> = {
  spot: 41,
  patch: 41,
  section: 41,
  reconstruction: 95,
};

/**
 * Working area is larger than the defect.
 *
 * You cannot saw-cut exactly along a pothole's edge and reinstate against
 * broken material, so every treatment squares the defect up and takes a
 * margin into sound pavement. Larger for the deeper treatments, which need
 * batter on the excavation.
 */
function workingArea(diagnosis: DefectDiagnosis, def: TreatmentDef): number {
  const margin = def.scale === "reconstruction" ? 1.45 : def.scale === "patch" ? 1.3 : 1.15;
  return Math.round(diagnosis.areaM2 * margin * 10) / 10;
}

function quote(defect: CorridorDefect, diagnosis: DefectDiagnosis, def: TreatmentDef): TreatmentQuote {
  const areaM2 = workingArea(diagnosis, def);
  const costLakh = Math.round((def.mobilisationLakh + (areaM2 * def.ratePerM2) / 100_000) * 100) / 100;
  const co2Tons = Math.round((areaM2 * def.co2PerM2) / 1000 * 1000) / 1000;

  // The baseline is the conventional answer *at the same scale*. Measuring a
  // subgrade rebuild against a surface patch would report avoided carbon for
  // choosing a bigger job, or a negative saving for doing the only thing that
  // reaches the failure — both compare against work nobody was going to do.
  const baselineRate = CONVENTIONAL_BASELINE_CO2[def.scale];
  const co2AvoidedTons = Math.round(((areaM2 * (baselineRate - def.co2PerM2)) / 1000) * 1000) / 1000;

  const plasticWasteTons = Math.round((areaM2 / 100) * def.plasticPer100M2 * 1000) / 1000;
  // Duration scales sublinearly: setup and cure dominate a small job.
  // A patch or a dig-out cannot realistically be mobilised, excavated,
  // reinstated and reopened inside half a day however small it is, so the
  // floor is set by the scale rather than by the area.
  const floorDays = def.scale === "reconstruction" ? 2 : def.scale === "patch" ? 1 : 0.5;
  const durationDays = Math.max(
    floorDays,
    Math.round(def.daysPer100M2 * Math.pow(areaM2 / 100, 0.75) * 2) / 2,
  );

  const originDepth = LAYER_DEPTH[ORIGIN_LAYER_KEY[defect.kind]];
  const reachDepth = LAYER_DEPTH[def.reachesLayer];
  const underReaches = reachDepth < originDepth;

  return {
    def,
    areaM2,
    costLakh,
    co2Tons,
    co2AvoidedTons,
    plasticWasteTons,
    durationDays,
    suitabilityScore: 0,
    underReaches,
    recommended: false,
  };
}

export interface TreatmentWeights {
  /** Whole-life durability. */
  durability: number;
  /** Capital cost now. */
  cost: number;
  /** Embodied carbon and material reuse. */
  sustainability: number;
  /** Speed of reopening the road. */
  speed: number;
}

export const DEFAULT_WEIGHTS: TreatmentWeights = {
  durability: 35,
  cost: 25,
  sustainability: 25,
  speed: 15,
};

/**
 * Fixed scoring bands, spanning the catalogue rather than whatever two options
 * happen to be eligible.
 *
 * Normalising against the pool's own range made every comparison relative: a
 * 10% cost difference between two patch options and a 37% carbon difference
 * both mapped onto the full 0-1 range, so trivial cost gaps outvoted large
 * environmental ones. Fixed bands keep a 10% difference worth 10%.
 */
const COST_BAND: [number, number] = [300, 5000]; // effective Rs/m2
const CO2_BAND: [number, number] = [4, 80]; // kg CO2e/m2
const SPEED_BAND: [number, number] = [0.4, 3.2]; // working days per 100 m2

/**
 * Score a treatment against this failure.
 *
 * A treatment that cannot reach the failing layer is not merely a weaker
 * option, it is the wrong answer — it scores low enough that it never
 * outranks something that does reach, whatever it saves on cost or carbon.
 */
function score(
  q: TreatmentQuote,
  defect: CorridorDefect,
  diagnosis: DefectDiagnosis,
  regime: CorridorRegime,
  weights: TreatmentWeights,
): number {
  const def = q.def;
  const norm = (v: number, lo: number, hi: number) =>
    Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

  const life = (def.expectedLifeYears[0] + def.expectedLifeYears[1]) / 2;
  const durability = Math.min(1, life / 20) * 0.6 + (def.trafficCapacity / 5) * 0.4;
  // Effective rate, not total cost: the same job on a bigger defect should not
  // score worse for being bigger.
  const effectiveRate = (q.costLakh * 100_000) / Math.max(1, q.areaM2);
  const cost = 1 - norm(effectiveRate, COST_BAND[0], COST_BAND[1]);
  const sustainability =
    (1 - norm(def.co2PerM2, CO2_BAND[0], CO2_BAND[1])) * 0.6 + (def.recycledPct / 100) * 0.4;
  const speed = 1 - norm(def.daysPer100M2, SPEED_BAND[0], SPEED_BAND[1]);

  const total = weights.durability + weights.cost + weights.sustainability + weights.speed;
  let s =
    ((durability * weights.durability +
      cost * weights.cost +
      sustainability * weights.sustainability +
      speed * weights.speed) /
      total) *
    100;

  // Climate fit: freeze-thaw matters in the pass, water resistance in the
  // forest, traffic capacity on the plains.
  if (regime.id === "mountain") s += (def.freezeThawResistance - 3) * 3.5;
  if (regime.id === "forest" || regime.id === "hilly") s += (def.waterResistance - 3) * 3;
  if (regime.id === "plains") s += (def.trafficCapacity - 3) * 2.5;
  if (regime.id === "desert") s += (def.waterResistance - 3) * 1.2 + (def.recycledPct / 100) * 3;

  // A treatment that does not address this mechanism at all is filtered out
  // upstream; one that does gets credit for being the designed answer.
  if (def.treats.includes(defect.kind)) s += 6;

  // Severity pulls toward durability: a critical defect is not the place to
  // save money on a treatment that will need redoing next season.
  if (defect.severity === "critical") s += (Math.min(1, life / 20) - 0.5) * 16;

  // Under-reaching is disqualifying, not a trade-off.
  if (q.underReaches) s -= 45;

  // Below the plant's minimum continuous run the method is not practicable at
  // all. Ramped rather than stepped, so two near-identical defects either side
  // of the threshold do not score 20 points apart.
  if (def.minContinuousAreaM2 > 0 && q.areaM2 < def.minContinuousAreaM2) {
    const shortfall = 1 - q.areaM2 / def.minContinuousAreaM2;
    s -= 50 * shortfall;
  }

  // A spot seal does not answer a failure in the structure, nor one that has
  // already reached critical — by then the crack has spalled and branched, and
  // sealing it buys a season at most.
  if (def.scale === "spot" && diagnosis.structural) s -= 25;
  if (def.scale === "spot" && defect.severity === "critical") s -= 22;

  return Math.max(3, Math.min(99, Math.round(s)));
}

export interface TreatmentMatch {
  options: TreatmentQuote[];
  /** The top-scoring option that reaches the failing layer. */
  recommended: TreatmentQuote;
}

/**
 * Rank the treatments that actually address this failure.
 */
export function matchTreatments(
  defect: CorridorDefect,
  diagnosis: DefectDiagnosis,
  regime: CorridorRegime,
  weights: TreatmentWeights = DEFAULT_WEIGHTS,
): TreatmentMatch {
  const originDepth = LAYER_DEPTH[ORIGIN_LAYER_KEY[defect.kind]];
  const eligible = TREATMENTS.filter((t) => t.treats.includes(defect.kind));
  // Nothing in the catalogue names this mechanism: fall back to every
  // treatment that at least reaches the failing layer, rather than
  // recommending nothing.
  const pool = eligible.length
    ? [...eligible]
    : TREATMENTS.filter((t) => LAYER_DEPTH[t.reachesLayer] >= originDepth);

  /**
   * Show the cheaper treatment that does *not* reach, when there is one.
   *
   * A deep-seated failure often has exactly one treatment that reaches it, and
   * a single-card "comparison" neither compares anything nor explains why the
   * expensive answer is the only answer. Carrying the shallow option through,
   * marked as under-reaching, is what makes that case legible — it is the
   * option a planner would otherwise ask about.
   */
  if (pool.length < 3) {
    const nearMisses = TREATMENTS.filter(
      (t) => !pool.includes(t) && LAYER_DEPTH[t.reachesLayer] < originDepth,
    ).sort((a, b) => LAYER_DEPTH[b.reachesLayer] - LAYER_DEPTH[a.reachesLayer] || a.ratePerM2 - b.ratePerM2);
    pool.push(...nearMisses.slice(0, 3 - pool.length));
  }

  const quotes = pool.map((t) => quote(defect, diagnosis, t));
  for (const q of quotes) {
    q.suitabilityScore = score(q, defect, diagnosis, regime, weights);
  }
  quotes.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  const best = quotes.find((q) => !q.underReaches) ?? quotes[0];
  best.recommended = true;

  return { options: quotes, recommended: best };
}

export function getTreatment(id: string): TreatmentDef | undefined {
  return TREATMENTS.find((t) => t.id === id);
}

export function isStructuralFailure(kind: RoadFailureKind): boolean {
  return isStructural(kind);
}
