export type TerrainType = "plains" | "hilly" | "mountain" | "desert" | "forest" | "urban";

export type DefectType = "pothole" | "crack" | "rutting" | "edge" | "water" | "deformation";
export type Severity = "low" | "moderate" | "high" | "critical";

export interface TerrainStats {
  elevationM: number;
  slopeDeg: number;
  terrainLabel: string;
  soil: string;
  rainfallRisk: "LOW" | "MODERATE" | "HIGH";
  drainage: "POOR" | "MODERATE" | "GOOD";
  landslideRisk: "LOW" | "MODERATE" | "HIGH";
  roadExposure: "LOW" | "MODERATE" | "SEVERE";
}

export interface RiskPrediction {
  potholeExpansion: "LOW" | "MEDIUM" | "HIGH";
  crackPropagation: "LOW" | "MEDIUM" | "HIGH";
  shoulderFailure: "LOW" | "MEDIUM" | "HIGH";
  drainageFailure: "LOW" | "MEDIUM" | "HIGH";
  overall: "LOW" | "MEDIUM" | "HIGH";
  trend: number[];
}

export interface HealthBreakdown {
  surfaceIntegrity: number;
  structuralStability: number;
  drainage: number;
  shoulderIntegrity: number;
  trafficLoad: number;
  climateStress: number;
}

export interface RoadDefect {
  id: string;
  type: DefectType;
  severity: Severity;
  t: number; // position along road path, 0-1
  offset: number; // lateral offset from centerline, -1..1 (fraction of half-width)
  depthMm?: number;
  diameterMm?: number;
  rutDepthMm?: number;
  confidencePct: number;
  segment: string;
  detectedIso: string;
  predictedGrowthPct: number;
  risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

export interface TerrainConfig {
  id: TerrainType;
  label: string;
  code: string;
  heightScale: number;
  noiseScale: number;
  roughness: number;
  seed: number;
  baseColor: [number, number, number];
  midColor: [number, number, number];
  highColor: [number, number, number];
  hasSnowCap: boolean;
  hasSand: boolean;
  hasWater: boolean;
  waterLevel: number;
  treeDensity: number;
  treeType: "conifer" | "broadleaf" | "palm" | "none";
  rockDensity: number;
  buildingDensity: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  roadCurviness: number;
  roadWidth: number;
  stats: TerrainStats;
  risk: RiskPrediction;
  health: number;
  healthBreakdown: HealthBreakdown;
  surveyAreaKm2: number;
  roadLengthKm: number;
  defectCounts: { critical: number; moderate: number; low: number; total: number };
  segment: { id: string; lengthKm: number; avgHealth: number; repairCostLakh: number; maintenanceWindow: string };
}
