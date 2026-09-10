import { fbm, ridgedNoise } from "./noise";
import type { TerrainConfig, TerrainType } from "./types";

export const TERRAIN_SIZE = 220; // world units, plane spans -SIZE/2..SIZE/2

const SEEDS: Record<TerrainType, number> = {
  plains: 101,
  hilly: 202,
  mountain: 303,
  desert: 404,
  forest: 505,
  urban: 606,
};

export const TERRAIN_CONFIGS: Record<TerrainType, TerrainConfig> = {
  plains: {
    id: "plains",
    label: "Plains",
    code: "01",
    heightScale: 3.2,
    noiseScale: 0.02,
    roughness: 0.15,
    seed: SEEDS.plains,
    baseColor: [0.16, 0.32, 0.13],
    midColor: [0.28, 0.42, 0.17],
    highColor: [0.38, 0.46, 0.22],
    hasSnowCap: false,
    hasSand: false,
    hasWater: true,
    waterLevel: -0.4,
    treeDensity: 0.12,
    treeType: "broadleaf",
    rockDensity: 0.02,
    buildingDensity: 0,
    fogColor: "#0a1410",
    fogNear: 90,
    fogFar: 260,
    roadCurviness: 0.35,
    roadWidth: 3.4,
    stats: {
      elevationM: 214,
      slopeDeg: 1.8,
      terrainLabel: "Flat Agricultural Plains",
      soil: "Alluvial / Loamy",
      rainfallRisk: "MODERATE",
      drainage: "MODERATE",
      landslideRisk: "LOW",
      roadExposure: "LOW",
    },
    risk: {
      potholeExpansion: "MEDIUM",
      crackPropagation: "LOW",
      shoulderFailure: "LOW",
      drainageFailure: "MEDIUM",
      overall: "LOW",
      trend: [82, 80, 79, 77, 76, 74, 73],
    },
    health: 78,
    healthBreakdown: { surfaceIntegrity: 81, structuralStability: 84, drainage: 62, shoulderIntegrity: 79, trafficLoad: 71, climateStress: 75 },
    surveyAreaKm2: 24.1,
    roadLengthKm: 38.2,
    defectCounts: { critical: 6, moderate: 44, low: 96, total: 146 },
    segment: { id: "R-041", lengthKm: 3.1, avgHealth: 78, repairCostLakh: 9.6, maintenanceWindow: "30–45 DAYS" },
  },
  hilly: {
    id: "hilly",
    label: "Hilly",
    code: "02",
    heightScale: 11,
    noiseScale: 0.028,
    roughness: 0.35,
    seed: SEEDS.hilly,
    baseColor: [0.14, 0.3, 0.16],
    midColor: [0.24, 0.38, 0.19],
    highColor: [0.42, 0.4, 0.28],
    hasSnowCap: false,
    hasSand: false,
    hasWater: true,
    waterLevel: -1.5,
    treeDensity: 0.4,
    treeType: "broadleaf",
    rockDensity: 0.12,
    buildingDensity: 0,
    fogColor: "#0a1512",
    fogNear: 70,
    fogFar: 230,
    roadCurviness: 0.75,
    roadWidth: 3.2,
    stats: {
      elevationM: 682,
      slopeDeg: 9.6,
      terrainLabel: "Rolling Hills",
      soil: "Lateritic / Clay",
      rainfallRisk: "HIGH",
      drainage: "MODERATE",
      landslideRisk: "MODERATE",
      roadExposure: "MODERATE",
    },
    risk: {
      potholeExpansion: "MEDIUM",
      crackPropagation: "MEDIUM",
      shoulderFailure: "HIGH",
      drainageFailure: "MEDIUM",
      overall: "MEDIUM",
      trend: [75, 74, 71, 70, 67, 65, 63],
    },
    health: 69,
    healthBreakdown: { surfaceIntegrity: 70, structuralStability: 68, drainage: 58, shoulderIntegrity: 55, trafficLoad: 66, climateStress: 60 },
    surveyAreaKm2: 31.4,
    roadLengthKm: 44.8,
    defectCounts: { critical: 14, moderate: 68, low: 121, total: 203 },
    segment: { id: "R-087", lengthKm: 2.7, avgHealth: 69, repairCostLakh: 14.2, maintenanceWindow: "21–30 DAYS" },
  },
  mountain: {
    id: "mountain",
    label: "Mountain",
    code: "03",
    heightScale: 30,
    noiseScale: 0.0115,
    roughness: 0.3,
    seed: SEEDS.mountain,
    baseColor: [0.22, 0.24, 0.2],
    midColor: [0.32, 0.29, 0.24],
    highColor: [0.82, 0.84, 0.88],
    hasSnowCap: true,
    hasSand: false,
    hasWater: false,
    waterLevel: -6,
    treeDensity: 0.22,
    treeType: "conifer",
    rockDensity: 0.4,
    buildingDensity: 0,
    fogColor: "#0a0e14",
    fogNear: 60,
    fogFar: 260,
    roadCurviness: 1.35,
    roadWidth: 2.8,
    stats: {
      elevationM: 1284,
      slopeDeg: 17.4,
      terrainLabel: "Mountainous",
      soil: "Rocky / Loamy",
      rainfallRisk: "HIGH",
      drainage: "MODERATE",
      landslideRisk: "HIGH",
      roadExposure: "SEVERE",
    },
    risk: {
      potholeExpansion: "HIGH",
      crackPropagation: "MEDIUM",
      shoulderFailure: "HIGH",
      drainageFailure: "LOW",
      overall: "HIGH",
      trend: [71, 68, 64, 60, 55, 49, 44],
    },
    health: 71,
    healthBreakdown: { surfaceIntegrity: 76, structuralStability: 69, drainage: 81, shoulderIntegrity: 63, trafficLoad: 74, climateStress: 68 },
    surveyAreaKm2: 18.7,
    roadLengthKm: 42.6,
    defectCounts: { critical: 24, moderate: 91, low: 172, total: 287 },
    segment: { id: "R-128", lengthKm: 2.4, avgHealth: 68, repairCostLakh: 18.4, maintenanceWindow: "14–21 DAYS" },
  },
  desert: {
    id: "desert",
    label: "Desert",
    code: "04",
    heightScale: 6.5,
    noiseScale: 0.016,
    roughness: 0.2,
    seed: SEEDS.desert,
    baseColor: [0.52, 0.42, 0.26],
    midColor: [0.62, 0.5, 0.31],
    highColor: [0.74, 0.62, 0.4],
    hasSnowCap: false,
    hasSand: true,
    hasWater: false,
    waterLevel: -10,
    treeDensity: 0.02,
    treeType: "palm",
    rockDensity: 0.15,
    buildingDensity: 0,
    fogColor: "#1a130c",
    fogNear: 90,
    fogFar: 280,
    roadCurviness: 0.2,
    roadWidth: 3.6,
    stats: {
      elevationM: 398,
      slopeDeg: 3.1,
      terrainLabel: "Arid Desert",
      soil: "Sandy / Rocky",
      rainfallRisk: "LOW",
      drainage: "POOR",
      landslideRisk: "LOW",
      roadExposure: "SEVERE",
    },
    risk: {
      potholeExpansion: "MEDIUM",
      crackPropagation: "HIGH",
      shoulderFailure: "MEDIUM",
      drainageFailure: "LOW",
      overall: "MEDIUM",
      trend: [80, 78, 77, 74, 73, 71, 69],
    },
    health: 73,
    healthBreakdown: { surfaceIntegrity: 68, structuralStability: 75, drainage: 88, shoulderIntegrity: 61, trafficLoad: 58, climateStress: 52 },
    surveyAreaKm2: 42.9,
    roadLengthKm: 51.3,
    defectCounts: { critical: 11, moderate: 57, low: 134, total: 202 },
    segment: { id: "R-205", lengthKm: 4.2, avgHealth: 73, repairCostLakh: 11.8, maintenanceWindow: "30–45 DAYS" },
  },
  forest: {
    id: "forest",
    label: "Forest",
    code: "05",
    heightScale: 8.5,
    noiseScale: 0.03,
    roughness: 0.3,
    seed: SEEDS.forest,
    baseColor: [0.08, 0.22, 0.1],
    midColor: [0.13, 0.3, 0.14],
    highColor: [0.22, 0.34, 0.18],
    hasSnowCap: false,
    hasSand: false,
    hasWater: true,
    waterLevel: -0.8,
    treeDensity: 0.85,
    treeType: "conifer",
    rockDensity: 0.06,
    buildingDensity: 0,
    fogColor: "#060f08",
    fogNear: 45,
    fogFar: 190,
    roadCurviness: 0.95,
    roadWidth: 2.6,
    stats: {
      elevationM: 512,
      slopeDeg: 6.2,
      terrainLabel: "Dense Forest",
      soil: "Moist Humus / Clay",
      rainfallRisk: "HIGH",
      drainage: "POOR",
      landslideRisk: "MODERATE",
      roadExposure: "MODERATE",
    },
    risk: {
      potholeExpansion: "MEDIUM",
      crackPropagation: "MEDIUM",
      shoulderFailure: "MEDIUM",
      drainageFailure: "HIGH",
      overall: "MEDIUM",
      trend: [77, 75, 73, 70, 68, 65, 62],
    },
    health: 66,
    healthBreakdown: { surfaceIntegrity: 64, structuralStability: 70, drainage: 48, shoulderIntegrity: 58, trafficLoad: 69, climateStress: 55 },
    surveyAreaKm2: 27.6,
    roadLengthKm: 33.9,
    defectCounts: { critical: 9, moderate: 52, low: 108, total: 169 },
    segment: { id: "R-162", lengthKm: 2.1, avgHealth: 66, repairCostLakh: 13.1, maintenanceWindow: "21–30 DAYS" },
  },
  urban: {
    id: "urban",
    label: "Urban / Peri-Urban",
    code: "06",
    heightScale: 1.6,
    noiseScale: 0.02,
    roughness: 0.08,
    seed: SEEDS.urban,
    baseColor: [0.2, 0.21, 0.23],
    midColor: [0.26, 0.27, 0.29],
    highColor: [0.34, 0.34, 0.36],
    hasSnowCap: false,
    hasSand: false,
    hasWater: false,
    waterLevel: -5,
    treeDensity: 0.08,
    treeType: "broadleaf",
    rockDensity: 0,
    buildingDensity: 0.5,
    fogColor: "#0c0d10",
    fogNear: 85,
    fogFar: 240,
    roadCurviness: 0.15,
    roadWidth: 4.2,
    stats: {
      elevationM: 176,
      slopeDeg: 0.9,
      terrainLabel: "Peri-Urban Developed",
      soil: "Compacted / Filled",
      rainfallRisk: "MODERATE",
      drainage: "POOR",
      landslideRisk: "LOW",
      roadExposure: "MODERATE",
    },
    risk: {
      potholeExpansion: "HIGH",
      crackPropagation: "MEDIUM",
      shoulderFailure: "LOW",
      drainageFailure: "HIGH",
      overall: "MEDIUM",
      trend: [70, 69, 68, 65, 64, 62, 60],
    },
    health: 64,
    healthBreakdown: { surfaceIntegrity: 60, structuralStability: 66, drainage: 41, shoulderIntegrity: 70, trafficLoad: 88, climateStress: 58 },
    surveyAreaKm2: 12.3,
    roadLengthKm: 21.4,
    defectCounts: { critical: 8, moderate: 61, low: 143, total: 212 },
    segment: { id: "R-309", lengthKm: 1.8, avgHealth: 64, repairCostLakh: 16.7, maintenanceWindow: "7–14 DAYS" },
  },
};

export const TERRAIN_ORDER: TerrainType[] = ["plains", "hilly", "mountain", "desert", "forest", "urban"];

/** World-space terrain height at (x, z) for a given terrain config. */
export function heightAt(config: TerrainConfig, x: number, z: number): number {
  const s = config.noiseScale;
  let h: number;
  if (config.id === "mountain") {
    h = ridgedNoise(x * s, z * s, config.seed) * 1.15 - 0.25;
    h += fbm(x * s * 3.5, z * s * 3.5, config.seed + 1, 3) * config.roughness * 0.4;
  } else if (config.id === "desert") {
    h = fbm(x * s * 1.6, z * s * 0.6, config.seed, 3, 2, 0.55);
  } else if (config.id === "urban") {
    h = fbm(x * s, z * s, config.seed, 2) * 0.4;
  } else {
    h = fbm(x * s, z * s, config.seed, 5);
    h += fbm(x * s * 6, z * s * 6, config.seed + 2, 2) * config.roughness * 0.3;
  }
  return h * config.heightScale;
}

export interface RoadPoint {
  x: number;
  z: number;
  y: number;
}

/** Generates a winding road path across the terrain, sampled at fine intervals. */
export function generateRoadPath(config: TerrainConfig, samples = 220): RoadPoint[] {
  const half = TERRAIN_SIZE / 2 - 12;
  const pts: RoadPoint[] = [];
  const amp = 10 + config.roadCurviness * 30;
  const freq1 = 0.9 + config.roadCurviness * 0.4;
  const freq2 = 2.3;
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const z = -half + t * half * 2;
    const x =
      Math.sin(t * Math.PI * freq1 + config.seed * 0.01) * amp +
      Math.sin(t * Math.PI * freq2 + config.seed * 0.02) * amp * 0.28 * config.roadCurviness;
    const y = heightAt(config, x, z) + 0.18;
    pts.push({ x, z, y });
  }
  return pts;
}
