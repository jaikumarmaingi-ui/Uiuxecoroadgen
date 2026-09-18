// Data contract for <EcoRoadGenMotion />. This is the ONLY channel the
// component reads road-health facts through — every number, badge and
// highlighted card in the animation is derived from this object, never
// hard-coded. Swap the object for a live API response and the animation
// updates automatically (see mock-data.ts for the demo instance).

export type FreezeThawRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SlopeRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RecommendedRepair = "PATCH_REPAIR" | "MILLING_OVERLAY" | "SUSTAINABLE_REHABILITATION";

export interface RoadHealthData {
  route: string;
  section: string;
  km: string;

  pavementHealth: number; // 0-100
  potholeCount: number;
  ruttingMm: number;
  crackingPercent: number; // 0-100
  moisturePercent: number; // 0-100

  freezeThawRisk: FreezeThawRisk;
  slopeRisk: SlopeRisk;

  failureProbability: number; // 0-100
  predictedFailureMonths: number;

  recommendedRepair: RecommendedRepair;
  roadHealthAfterRepair: number; // 0-100

  /**
   * Optional slope-stability figures for the landslide-risk phase. When the
   * API doesn't yet supply these, the component derives a placeholder from
   * `slopeRisk` (see deriveLandslideRisk in EcoRoadGenMotion.tsx) — clearly
   * a fallback, not a model output.
   */
  slopeInstabilityProbability?: number; // 0-100
  roadAccessCompromised?: boolean;
  landslideRecommendations?: string[];
}

export interface RepairOption {
  id: RecommendedRepair;
  label: string;
  costLabel: string;
  lifeExtensionYears: number;
  carbonImpactLabel: string;
}

export type EnvironmentCondition = "NORMAL" | "MONSOON" | "SNOW" | "FREEZE_THAW" | "LANDSLIDE";

export type MotionPhase =
  | "CORRIDOR"
  | "DRIVE"
  | "INSPECT"
  | "DRONE"
  | "XRAY"
  | "ANALYSIS"
  | "PREDICT"
  | "REPAIR"
  | "RESULT"
  | "ENVIRONMENT"
  | "LANDSLIDE"
  | "FINAL";

export interface EcoRoadGenMotionProps {
  /** The only required prop — every visualized value comes from here. */
  data: RoadHealthData;
  /** Real corridor photography/video-still. Falls back to a drawn placeholder terrain if omitted. */
  backgroundImage?: string;
  /** Override the default cost/life/carbon reference catalog shown on the three repair cards. */
  repairOptions?: RepairOption[];
  /** Runs the cinematic phase sequence on a loop. Manual controls always work regardless. Default: true. */
  autoPlay?: boolean;
  className?: string;
}
