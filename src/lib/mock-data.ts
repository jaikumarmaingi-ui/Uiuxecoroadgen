import type {
  AlertItem,
  Coordinate,
  InspectionRecord,
  ReportType,
  RepairOption,
  RiskLevel,
  RoadSegment,
} from "./types";

/**
 * DEMO DATA NOTICE
 * All values in this file are illustrative sample data generated for the
 * EcoRoadGen 1.0 prototype. They are not sourced from real government,
 * defence, or infrastructure records. Coordinates are stylized/normalized
 * for a mock GIS canvas, not true geographic positions.
 */
export const DEMO_DATA_NOTICE =
  "Demo data — illustrative values for prototype purposes only. Not sourced from operational defence infrastructure records.";

// ---------------------------------------------------------------------------
// Waypoints for the stylized mock-GIS canvas (viewBox 0 0 1000 680)
// ---------------------------------------------------------------------------
const PLACES = {
  srinagar: { lat: 480, lng: 130 },
  sonamarg: { lat: 430, lng: 250 },
  zojila: { lat: 395, lng: 320 },
  drass: { lat: 355, lng: 400 },
  kargil: { lat: 330, lng: 480 },
  mulbekh: { lat: 310, lng: 560 },
  lamayuru: { lat: 280, lng: 630 },
  nimmu: { lat: 245, lng: 700 },
  leh: { lat: 220, lng: 770 },
  karu: { lat: 245, lng: 810 },
  changla: { lat: 220, lng: 860 },
  pangong: { lat: 205, lng: 930 },
  khardungla: { lat: 175, lng: 800 },
  khalsar: { lat: 145, lng: 830 },
  dbo: { lat: 90, lng: 870 },
  manali: { lat: 610, lng: 300 },
  rohtang: { lat: 565, lng: 290 },
  keylong: { lat: 520, lng: 340 },
  darcha: { lat: 490, lng: 380 },
  sarchu: { lat: 470, lng: 450 },
  pang: { lat: 430, lng: 550 },
  taglangla: { lat: 380, lng: 660 },
  upshi: { lat: 300, lng: 720 },
  nyoma: { lat: 240, lng: 960 },
  chushul: { lat: 225, lng: 1000 },
} as const;

function pt(p: keyof typeof PLACES): Coordinate {
  const v = PLACES[p];
  return { lat: v.lat, lng: v.lng };
}

function path(...pts: (keyof typeof PLACES)[]): Coordinate[] {
  return pts.map(pt);
}

// ---------------------------------------------------------------------------
// Repair option catalogue (base specs — suitability recalculated per weights)
// ---------------------------------------------------------------------------
export const REPAIR_CATALOGUE: Omit<RepairOption, "id" | "roadSegmentId" | "suitabilityScore">[] = [
  {
    method: "Conventional Hot-Mix Asphalt",
    shortLabel: "Hot-Mix Asphalt",
    description:
      "Standard dense-graded hot-mix asphalt overlay, plant-produced and laid at high temperature.",
    expectedLifeYearsMin: 5,
    expectedLifeYearsMax: 7,
    estimatedCostLakhPerKm: 42,
    climateSuitability: "Moderate",
    environmentalImpact: "Medium",
    maintenanceFrequency: "Medium",
    carbonReductionTons: 0,
    recycledMaterialPct: 8,
    plasticWasteUtilizedTons: 0,
    constructionTimeDays: 18,
    waterResistanceStars: 3,
    freezeThawResistanceStars: 2,
    trafficLoadCapacityStars: 4,
    reasons: [
      "Proven construction method with wide contractor familiarity",
      "High initial traffic load capacity",
      "Fast local material availability in accessible regions",
    ],
    riskConsiderations: [
      "High plant temperature requirement is difficult to sustain at high altitude",
      "Prone to thermal cracking under repeated freeze-thaw cycling",
    ],
    aiConfidencePct: 78,
  },
  {
    method: "Cold-Mix Recycled Asphalt",
    shortLabel: "Cold-Mix Recycled",
    description:
      "Emulsion-bound cold-mix asphalt incorporating reclaimed pavement material, cured at ambient temperature.",
    expectedLifeYearsMin: 4,
    expectedLifeYearsMax: 6,
    estimatedCostLakhPerKm: 29,
    climateSuitability: "Very High",
    environmentalImpact: "Low",
    maintenanceFrequency: "Low",
    carbonReductionTons: 96,
    recycledMaterialPct: 45,
    plasticWasteUtilizedTons: 6.2,
    constructionTimeDays: 9,
    waterResistanceStars: 4,
    freezeThawResistanceStars: 5,
    trafficLoadCapacityStars: 3,
    reasons: [
      "No high-temperature plant required — deployable in sub-zero conditions",
      "Reuses reclaimed pavement material, reducing haul distance",
      "Strong freeze-thaw resistance validated for high-altitude corridors",
      "Rapid deployment suited to short repair windows before winter closure",
    ],
    riskConsiderations: [
      "Slightly lower traffic load capacity than hot-mix under heavy convoy axle loads",
      "Cure time is weather-dependent and should be monitored post-application",
    ],
    aiConfidencePct: 89,
  },
  {
    method: "Recycled Asphalt + Plastic Waste Additive",
    shortLabel: "Recycled + Plastic Waste",
    description:
      "Cold-mix recycled asphalt modified with shredded plastic waste additive for improved binding and durability.",
    expectedLifeYearsMin: 5,
    expectedLifeYearsMax: 8,
    estimatedCostLakhPerKm: 31,
    climateSuitability: "Very High",
    environmentalImpact: "Very Low",
    maintenanceFrequency: "Low",
    carbonReductionTons: 126,
    recycledMaterialPct: 61,
    plasticWasteUtilizedTons: 18.4,
    constructionTimeDays: 10,
    waterResistanceStars: 4,
    freezeThawResistanceStars: 5,
    trafficLoadCapacityStars: 4,
    reasons: [
      "Strong cold-climate suitability validated across border-road trials",
      "Reduced construction temperature requirement versus hot-mix",
      "Reduced material transportation via local reclaimed-pavement reuse",
      "Reuses existing pavement material and diverts plastic waste from landfill",
      "Lower carbon footprint than any conventional alternative",
      "Suitable for rapid intervention ahead of seasonal closure",
      "Reduced maintenance requirement over 5–8 year service life",
    ],
    riskConsiderations: [
      "Performance should be monitored during extreme freeze-thaw periods",
      "Plastic additive sourcing depends on regional recycling supply chain",
    ],
    aiConfidencePct: 91,
  },
  {
    method: "Deep Rehabilitation",
    shortLabel: "Deep Rehabilitation",
    description:
      "Full-depth reconstruction of pavement structure including subgrade stabilization and new drainage works.",
    expectedLifeYearsMin: 10,
    expectedLifeYearsMax: 15,
    estimatedCostLakhPerKm: 96,
    climateSuitability: "High",
    environmentalImpact: "High",
    maintenanceFrequency: "Very Low",
    carbonReductionTons: -40,
    recycledMaterialPct: 18,
    plasticWasteUtilizedTons: 2.1,
    constructionTimeDays: 45,
    waterResistanceStars: 5,
    freezeThawResistanceStars: 4,
    trafficLoadCapacityStars: 5,
    reasons: [
      "Longest service life of all available interventions",
      "Addresses subgrade and drainage root causes, not just surface distress",
      "Highest traffic load capacity — suited to sustained heavy convoy routes",
    ],
    riskConsiderations: [
      "Highest embodied carbon and material transport footprint",
      "Extended construction window may require traffic diversion or convoy scheduling",
      "Higher upfront capital requirement",
    ],
    aiConfidencePct: 84,
  },
];

// ---------------------------------------------------------------------------
// Road segments
// ---------------------------------------------------------------------------
type SegDraft = Omit<
  RoadSegment,
  | "featureContributions"
  | "aiExplanation"
  | "recommendedRepairId"
  | "priorityScore"
  | "distress"
  | "structural"
  | "history"
  | "landmarks"
> & { landmarks?: RoadSegment["landmarks"] };

function buildDeterioration(health: number, riskLevel: RiskLevel): RoadSegment["predictedDeterioration"] {
  const decay =
    riskLevel === "critical" ? [0, 11, 18, 24] : riskLevel === "high-risk" ? [0, 8, 14, 19] : riskLevel === "moderate" ? [0, 4, 7, 10] : riskLevel === "good" ? [0, 2, 3, 5] : [0, 1, 1, 2];
  return [
    { label: "Now", health },
    { label: "30d", health: Math.max(5, health - decay[1]) },
    { label: "60d", health: Math.max(5, health - decay[2]) },
    { label: "90d", health: Math.max(5, health - decay[3]) },
  ];
}

function contributionsFor(seg: {
  freezeThawCycles: number;
  temperatureC: number;
  trafficLoad: number;
  distressCracking: number;
  drainageScore: number;
  riskLevel: RiskLevel;
}): RoadSegment["featureContributions"] {
  const base =
    seg.riskLevel === "critical" || seg.riskLevel === "high-risk"
      ? [
          { factor: "Freeze-Thaw Exposure", weight: 32 },
          { factor: "Temperature", weight: 24 },
          { factor: "Heavy Axle Loading", weight: 18 },
          { factor: "Surface Cracking", weight: 14 },
          { factor: "Drainage Condition", weight: 8 },
          { factor: "Historical Deterioration", weight: 4 },
        ]
      : seg.riskLevel === "moderate"
        ? [
            { factor: "Traffic Load", weight: 27 },
            { factor: "Surface Cracking", weight: 22 },
            { factor: "Drainage Condition", weight: 19 },
            { factor: "Freeze-Thaw Exposure", weight: 16 },
            { factor: "Temperature", weight: 10 },
            { factor: "Historical Deterioration", weight: 6 },
          ]
        : [
            { factor: "Traffic Load", weight: 30 },
            { factor: "Historical Deterioration", weight: 24 },
            { factor: "Drainage Condition", weight: 20 },
            { factor: "Surface Cracking", weight: 14 },
            { factor: "Temperature", weight: 8 },
            { factor: "Freeze-Thaw Exposure", weight: 4 },
          ];
  return base;
}

function explanationFor(name: string, seg: { riskLevel: RiskLevel; freezeThawCycles: number }): string {
  if (seg.riskLevel === "critical")
    return `Repeated freeze-thaw cycles (${seg.freezeThawCycles} annually) combined with low surface temperature and existing cracking significantly increase the probability of rapid surface deterioration on ${name}. Structural indicators suggest subgrade stress is compounding surface distress.`;
  if (seg.riskLevel === "high-risk")
    return `Freeze-thaw cycling and surface cracking are the dominant drivers of predicted deterioration on ${name}. Drainage stress and heavy axle loading from convoy traffic are accelerating the decline.`;
  if (seg.riskLevel === "moderate")
    return `${name} shows early-stage surface distress correlated with traffic loading and seasonal drainage stress. Deterioration is predicted to progress gradually without intervention.`;
  return `${name} shows stable structural and surface indicators. Deterioration is predicted to progress slowly, driven primarily by routine traffic loading.`;
}

function distressFor(riskLevel: RiskLevel) {
  const scale = { critical: 1, "high-risk": 0.8, moderate: 0.5, good: 0.25, healthy: 0.1 }[riskLevel];
  return {
    cracking: Math.round(30 + scale * 65),
    potholes: Math.round(10 + scale * 70),
    rutting: Math.round(15 + scale * 55),
    ravelling: Math.round(12 + scale * 50),
    edgeDeterioration: Math.round(18 + scale * 45),
    depression: Math.round(8 + scale * 40),
  };
}

function structuralFor(riskLevel: RiskLevel) {
  const scale = { critical: 1, "high-risk": 0.8, moderate: 0.5, good: 0.25, healthy: 0.1 }[riskLevel];
  return {
    pavementStrength: Math.round(95 - scale * 60),
    deflection: Math.round(15 + scale * 60),
    loadResponse: Math.round(90 - scale * 55),
    subgradeCondition: Math.round(92 - scale * 58),
  };
}

const draftSegments: SegDraft[] = [
  {
    id: "nh3-srn-son-01",
    roadName: "Srinagar–Leh",
    routeNumber: "NH-3",
    region: "Kashmir Valley",
    segmentLabel: "KM 0–28",
    startKm: 0,
    endKm: 28,
    lengthKm: 28,
    path: path("srinagar", "sonamarg"),
    altitudeM: 2740,
    temperatureC: 6,
    healthScore: 84,
    riskScore: 18,
    riskLevel: "healthy",
    strategicImportance: 88,
    trafficLoad: 72,
    militaryConvoyFrequency: "High",
    freezeThawCycles: 40,
    rainfallMm: 720,
    drainageScore: 78,
    surfaceCondition: "Good",
    structuralCondition: "Good",
    lastInspectionIso: daysAgoIso(6),
    probabilityOfFailurePct: 9,
    predictionConfidencePct: 92,
    dataConfidence: "HIGH",
    repairStage: "Monitoring",
    timeToInterventionDays: 210,
    predictedDeterioration: [],
  },
  {
    id: "nh3-zoji-drass-02",
    roadName: "Srinagar–Leh",
    routeNumber: "NH-3",
    region: "Zoji La Corridor",
    segmentLabel: "KM 78–104",
    startKm: 78,
    endKm: 104,
    lengthKm: 26,
    path: path("zojila", "drass"),
    altitudeM: 3528,
    temperatureC: -9,
    healthScore: 38,
    riskScore: 79,
    riskLevel: "high-risk",
    strategicImportance: 95,
    trafficLoad: 68,
    militaryConvoyFrequency: "Very High",
    freezeThawCycles: 142,
    rainfallMm: 310,
    drainageScore: 41,
    surfaceCondition: "Poor",
    structuralCondition: "Poor",
    lastInspectionIso: daysAgoIso(3),
    probabilityOfFailurePct: 68,
    predictionConfidencePct: 87,
    dataConfidence: "HIGH",
    repairStage: "Recommended",
    timeToInterventionDays: 18,
    predictedDeterioration: [],
  },
  {
    id: "nh3-srn-leh-210",
    roadName: "Srinagar–Leh",
    routeNumber: "NH-3",
    region: "Kargil Sector",
    segmentLabel: "KM 210–230",
    startKm: 210,
    endKm: 230,
    lengthKm: 20,
    path: path("kargil", "mulbekh"),
    altitudeM: 3412,
    temperatureC: -11,
    healthScore: 42,
    riskScore: 87,
    riskLevel: "critical",
    strategicImportance: 98,
    trafficLoad: 76,
    militaryConvoyFrequency: "Very High",
    freezeThawCycles: 156,
    rainfallMm: 260,
    drainageScore: 34,
    surfaceCondition: "Severe",
    structuralCondition: "Poor",
    lastInspectionIso: daysAgoIso(4),
    probabilityOfFailurePct: 72,
    predictionConfidencePct: 89,
    dataConfidence: "HIGH",
    repairStage: "Recommended",
    timeToInterventionDays: 12,
    predictedDeterioration: [],
  },
  {
    id: "nh3-mul-lam-03",
    roadName: "Srinagar–Leh",
    routeNumber: "NH-3",
    region: "Ladakh Plateau",
    segmentLabel: "KM 240–268",
    startKm: 240,
    endKm: 268,
    lengthKm: 28,
    path: path("mulbekh", "lamayuru"),
    altitudeM: 3390,
    temperatureC: -7,
    healthScore: 61,
    riskScore: 52,
    riskLevel: "moderate",
    strategicImportance: 90,
    trafficLoad: 64,
    militaryConvoyFrequency: "High",
    freezeThawCycles: 118,
    rainfallMm: 190,
    drainageScore: 58,
    surfaceCondition: "Fair",
    structuralCondition: "Fair",
    lastInspectionIso: daysAgoIso(11),
    probabilityOfFailurePct: 41,
    predictionConfidencePct: 82,
    dataConfidence: "MEDIUM",
    repairStage: "Assessment",
    timeToInterventionDays: 46,
    predictedDeterioration: [],
  },
  {
    id: "nh3-lam-leh-04",
    roadName: "Srinagar–Leh",
    routeNumber: "NH-3",
    region: "Indus Valley",
    segmentLabel: "KM 268–300",
    startKm: 268,
    endKm: 300,
    lengthKm: 32,
    path: path("lamayuru", "nimmu", "leh"),
    altitudeM: 3260,
    temperatureC: -3,
    healthScore: 74,
    riskScore: 33,
    riskLevel: "good",
    strategicImportance: 92,
    trafficLoad: 70,
    militaryConvoyFrequency: "High",
    freezeThawCycles: 96,
    rainfallMm: 110,
    drainageScore: 66,
    surfaceCondition: "Good",
    structuralCondition: "Fair",
    lastInspectionIso: daysAgoIso(9),
    probabilityOfFailurePct: 24,
    predictionConfidencePct: 90,
    dataConfidence: "HIGH",
    repairStage: "Monitoring",
    timeToInterventionDays: 130,
    predictedDeterioration: [],
  },
  {
    id: "leh-nimmu-basgo-05",
    roadName: "Leh–Kargil",
    routeNumber: "NH-1D",
    region: "Indus Valley",
    segmentLabel: "KM 0–24",
    startKm: 0,
    endKm: 24,
    lengthKm: 24,
    path: path("leh", "nimmu"),
    altitudeM: 3120,
    temperatureC: -1,
    healthScore: 80,
    riskScore: 22,
    riskLevel: "healthy",
    strategicImportance: 80,
    trafficLoad: 58,
    militaryConvoyFrequency: "Moderate",
    freezeThawCycles: 84,
    rainfallMm: 95,
    drainageScore: 74,
    surfaceCondition: "Good",
    structuralCondition: "Good",
    lastInspectionIso: daysAgoIso(14),
    probabilityOfFailurePct: 14,
    predictionConfidencePct: 88,
    dataConfidence: "HIGH",
    repairStage: "Monitoring",
    timeToInterventionDays: 240,
    predictedDeterioration: [],
  },
  {
    id: "manali-rohtang-06",
    roadName: "Manali–Leh",
    routeNumber: "NH-3A",
    region: "Lahaul Corridor",
    segmentLabel: "KM 0–22",
    startKm: 0,
    endKm: 22,
    lengthKm: 22,
    path: path("manali", "rohtang"),
    altitudeM: 3978,
    temperatureC: -6,
    healthScore: 55,
    riskScore: 61,
    riskLevel: "moderate",
    strategicImportance: 82,
    trafficLoad: 55,
    militaryConvoyFrequency: "Moderate",
    freezeThawCycles: 134,
    rainfallMm: 880,
    drainageScore: 44,
    surfaceCondition: "Fair",
    structuralCondition: "Poor",
    lastInspectionIso: daysAgoIso(8),
    probabilityOfFailurePct: 48,
    predictionConfidencePct: 79,
    dataConfidence: "MEDIUM",
    repairStage: "Assessment",
    timeToInterventionDays: 34,
    predictedDeterioration: [],
  },
  {
    id: "manali-keylong-07",
    roadName: "Manali–Leh",
    routeNumber: "NH-3A",
    region: "Lahaul Corridor",
    segmentLabel: "KM 22–68",
    startKm: 22,
    endKm: 68,
    lengthKm: 46,
    path: path("rohtang", "keylong", "darcha"),
    altitudeM: 3340,
    temperatureC: -4,
    healthScore: 66,
    riskScore: 47,
    riskLevel: "moderate",
    strategicImportance: 78,
    trafficLoad: 52,
    militaryConvoyFrequency: "Moderate",
    freezeThawCycles: 102,
    rainfallMm: 340,
    drainageScore: 55,
    surfaceCondition: "Fair",
    structuralCondition: "Fair",
    lastInspectionIso: daysAgoIso(16),
    probabilityOfFailurePct: 36,
    predictionConfidencePct: 81,
    dataConfidence: "MEDIUM",
    repairStage: "Detected",
    timeToInterventionDays: 58,
    predictedDeterioration: [],
  },
  {
    id: "manali-sarchu-08",
    roadName: "Manali–Leh",
    routeNumber: "NH-3A",
    region: "Sarchu Plateau",
    segmentLabel: "KM 68–140",
    startKm: 68,
    endKm: 140,
    lengthKm: 72,
    path: path("darcha", "sarchu", "pang"),
    altitudeM: 4290,
    temperatureC: -14,
    healthScore: 29,
    riskScore: 91,
    riskLevel: "critical",
    strategicImportance: 86,
    trafficLoad: 47,
    militaryConvoyFrequency: "High",
    freezeThawCycles: 178,
    rainfallMm: 120,
    drainageScore: 22,
    surfaceCondition: "Severe",
    structuralCondition: "Severe",
    lastInspectionIso: daysAgoIso(2),
    probabilityOfFailurePct: 81,
    predictionConfidencePct: 91,
    dataConfidence: "HIGH",
    repairStage: "Approved",
    timeToInterventionDays: 6,
    predictedDeterioration: [],
  },
  {
    id: "manali-taglangla-09",
    roadName: "Manali–Leh",
    routeNumber: "NH-3A",
    region: "Taglang La",
    segmentLabel: "KM 140–210",
    startKm: 140,
    endKm: 210,
    lengthKm: 70,
    path: path("pang", "taglangla", "upshi"),
    altitudeM: 5100,
    temperatureC: -18,
    healthScore: 33,
    riskScore: 85,
    riskLevel: "high-risk",
    strategicImportance: 83,
    trafficLoad: 44,
    militaryConvoyFrequency: "Moderate",
    freezeThawCycles: 190,
    rainfallMm: 80,
    drainageScore: 28,
    surfaceCondition: "Severe",
    structuralCondition: "Poor",
    lastInspectionIso: daysAgoIso(5),
    probabilityOfFailurePct: 69,
    predictionConfidencePct: 84,
    dataConfidence: "MEDIUM",
    repairStage: "Recommended",
    timeToInterventionDays: 15,
    predictedDeterioration: [],
  },
  {
    id: "leh-karu-changla-10",
    roadName: "Leh–Pangong",
    routeNumber: "BRO-71",
    region: "Chang La Sector",
    segmentLabel: "KM 0–48",
    startKm: 0,
    endKm: 48,
    lengthKm: 48,
    path: path("leh", "karu", "changla"),
    altitudeM: 5360,
    temperatureC: -16,
    healthScore: 47,
    riskScore: 70,
    riskLevel: "high-risk",
    strategicImportance: 96,
    trafficLoad: 38,
    militaryConvoyFrequency: "High",
    freezeThawCycles: 172,
    rainfallMm: 60,
    drainageScore: 36,
    surfaceCondition: "Poor",
    structuralCondition: "Poor",
    lastInspectionIso: daysAgoIso(7),
    probabilityOfFailurePct: 58,
    predictionConfidencePct: 80,
    dataConfidence: "MEDIUM",
    repairStage: "Assessment",
    timeToInterventionDays: 22,
    predictedDeterioration: [],
  },
  {
    id: "leh-pangong-11",
    roadName: "Leh–Pangong",
    routeNumber: "BRO-71",
    region: "Pangong Sector",
    segmentLabel: "KM 48–92",
    startKm: 48,
    endKm: 92,
    lengthKm: 44,
    path: path("changla", "pangong"),
    altitudeM: 4350,
    temperatureC: -9,
    healthScore: 63,
    riskScore: 44,
    riskLevel: "moderate",
    strategicImportance: 94,
    trafficLoad: 34,
    militaryConvoyFrequency: "High",
    freezeThawCycles: 128,
    rainfallMm: 55,
    drainageScore: 52,
    surfaceCondition: "Fair",
    structuralCondition: "Fair",
    lastInspectionIso: daysAgoIso(19),
    probabilityOfFailurePct: 33,
    predictionConfidencePct: 76,
    dataConfidence: "MEDIUM",
    repairStage: "Detected",
    timeToInterventionDays: 64,
    predictedDeterioration: [],
  },
  {
    id: "leh-khardungla-12",
    roadName: "Leh–DBO",
    routeNumber: "BRO-52",
    region: "Khardung La Sector",
    segmentLabel: "KM 0–39",
    startKm: 0,
    endKm: 39,
    lengthKm: 39,
    path: path("leh", "khardungla"),
    altitudeM: 5359,
    temperatureC: -19,
    healthScore: 40,
    riskScore: 82,
    riskLevel: "critical",
    strategicImportance: 99,
    trafficLoad: 41,
    militaryConvoyFrequency: "Very High",
    freezeThawCycles: 201,
    rainfallMm: 45,
    drainageScore: 25,
    surfaceCondition: "Severe",
    structuralCondition: "Poor",
    lastInspectionIso: daysAgoIso(1),
    probabilityOfFailurePct: 76,
    predictionConfidencePct: 90,
    dataConfidence: "HIGH",
    repairStage: "Scheduled",
    timeToInterventionDays: 4,
    predictedDeterioration: [],
  },
  {
    id: "leh-khalsar-dbo-13",
    roadName: "Leh–DBO",
    routeNumber: "BRO-52",
    region: "Nubra Valley",
    segmentLabel: "KM 39–110",
    startKm: 39,
    endKm: 110,
    lengthKm: 71,
    path: path("khardungla", "khalsar", "dbo"),
    altitudeM: 4980,
    temperatureC: -13,
    healthScore: 52,
    riskScore: 63,
    riskLevel: "moderate",
    strategicImportance: 97,
    trafficLoad: 30,
    militaryConvoyFrequency: "High",
    freezeThawCycles: 165,
    rainfallMm: 40,
    drainageScore: 39,
    surfaceCondition: "Poor",
    structuralCondition: "Fair",
    lastInspectionIso: daysAgoIso(13),
    probabilityOfFailurePct: 47,
    predictionConfidencePct: 77,
    dataConfidence: "MEDIUM",
    repairStage: "Under Repair",
    timeToInterventionDays: 28,
    predictedDeterioration: [],
  },
  {
    id: "leh-nyoma-chushul-14",
    roadName: "Leh–Chushul",
    routeNumber: "BRO-88",
    region: "Nyoma Sector",
    segmentLabel: "KM 0–95",
    startKm: 0,
    endKm: 95,
    lengthKm: 95,
    path: path("upshi", "nyoma", "chushul"),
    altitudeM: 4620,
    temperatureC: -12,
    healthScore: 58,
    riskScore: 55,
    riskLevel: "moderate",
    strategicImportance: 93,
    trafficLoad: 27,
    militaryConvoyFrequency: "High",
    freezeThawCycles: 148,
    rainfallMm: 35,
    drainageScore: 47,
    surfaceCondition: "Fair",
    structuralCondition: "Fair",
    lastInspectionIso: daysAgoIso(21),
    probabilityOfFailurePct: 38,
    predictionConfidencePct: 71,
    dataConfidence: "LOW",
    repairStage: "Detected",
    timeToInterventionDays: 70,
    predictedDeterioration: [],
  },
  {
    id: "nh3-srinagar-sonamarg-alt-15",
    roadName: "Srinagar–Sonamarg",
    routeNumber: "NH-3",
    region: "Kashmir Valley",
    segmentLabel: "KM 60–78",
    startKm: 60,
    endKm: 78,
    lengthKm: 18,
    path: path("sonamarg", "zojila"),
    altitudeM: 3050,
    temperatureC: 1,
    healthScore: 70,
    riskScore: 39,
    riskLevel: "good",
    strategicImportance: 84,
    trafficLoad: 66,
    militaryConvoyFrequency: "High",
    freezeThawCycles: 88,
    rainfallMm: 540,
    drainageScore: 62,
    surfaceCondition: "Fair",
    structuralCondition: "Good",
    lastInspectionIso: daysAgoIso(10),
    probabilityOfFailurePct: 27,
    predictionConfidencePct: 85,
    dataConfidence: "HIGH",
    repairStage: "Monitoring",
    timeToInterventionDays: 96,
    predictedDeterioration: [],
  },
];

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function historyFor(id: string, health: number): RoadSegment["history"] {
  return [
    { dateIso: daysAgoIso(210), event: "Baseline survey completed", healthAfter: Math.min(95, health + 30) },
    { dateIso: daysAgoIso(150), event: "Routine monsoon inspection", healthAfter: Math.min(90, health + 22) },
    { dateIso: daysAgoIso(95), event: "Minor pothole patching", healthAfter: Math.min(88, health + 16) },
    { dateIso: daysAgoIso(40), event: "AI risk flag raised — freeze-thaw exposure", healthAfter: Math.min(80, health + 8) },
    { dateIso: daysAgoIso(10), event: "Field inspection — distress confirmed", healthAfter: health },
  ];
}

function landmarksFor(seg: SegDraft): RoadSegment["landmarks"] {
  const out: RoadSegment["landmarks"] = [];
  if (seg.riskLevel === "critical" || seg.riskLevel === "high-risk") {
    out.push({ type: "inspection-point", label: "Recent inspection", at: 0.3 });
    out.push({ type: "repair-site", label: "Proposed repair site", at: 0.6 });
  }
  if (seg.altitudeM > 4000) out.push({ type: "weather-station", label: "High-altitude weather station", at: 0.5 });
  if (seg.id.includes("bridge")) out.push({ type: "bridge", label: "Bridge structure", at: 0.5 });
  out.push({ type: "checkpoint", label: `${seg.routeNumber} checkpoint`, at: 0.05 });
  return out;
}

export const ROAD_SEGMENTS: RoadSegment[] = draftSegments.map((seg) => {
  const predictedDeterioration = buildDeterioration(seg.healthScore, seg.riskLevel);
  const featureContributions = contributionsFor({
    freezeThawCycles: seg.freezeThawCycles,
    temperatureC: seg.temperatureC,
    trafficLoad: seg.trafficLoad,
    distressCracking: 0,
    drainageScore: seg.drainageScore,
    riskLevel: seg.riskLevel,
  });
  const aiExplanation = explanationFor(`${seg.roadName} ${seg.segmentLabel}`, seg);
  const priorityScore = Math.round(
    seg.riskScore * 0.35 +
      seg.strategicImportance * 0.3 +
      seg.trafficLoad * 0.15 +
      (100 - seg.timeToInterventionDays > 0 ? Math.min(100, 3000 / Math.max(seg.timeToInterventionDays, 1)) : 0) * 0.2,
  );
  let recommendedRepairId = "cold-mix-recycled";
  if (seg.altitudeM > 4500 || seg.riskLevel === "critical") recommendedRepairId = "recycled-plastic";
  else if (seg.riskLevel === "high-risk") recommendedRepairId = "recycled-plastic";
  else if (seg.riskLevel === "moderate") recommendedRepairId = "cold-mix-recycled";
  else recommendedRepairId = "hot-mix";

  return {
    ...seg,
    predictedDeterioration,
    featureContributions,
    aiExplanation,
    recommendedRepairId,
    priorityScore: Math.min(99, priorityScore),
    distress: distressFor(seg.riskLevel),
    structural: structuralFor(seg.riskLevel),
    history: historyFor(seg.id, seg.healthScore),
    landmarks: landmarksFor(seg),
  };
});

// Assign priority ranks (descending score) — used by Prioritization Engine
const rankedIds = [...ROAD_SEGMENTS].sort((a, b) => b.priorityScore - a.priorityScore).map((s) => s.id);
rankedIds.forEach((id, idx) => {
  const seg = ROAD_SEGMENTS.find((s) => s.id === id)!;
  seg.priorityRank = idx + 1;
});

export function getSegment(id: string): RoadSegment | undefined {
  return ROAD_SEGMENTS.find((s) => s.id === id);
}

export function repairOptionsFor(segmentId: string): RepairOption[] {
  const ids = ["hot-mix", "cold-mix-recycled", "recycled-plastic", "deep-rehab"];
  return REPAIR_CATALOGUE.map((base, i) => ({
    ...base,
    id: ids[i],
    roadSegmentId: segmentId,
    suitabilityScore: baseSuitability(base),
  }));
}

function baseSuitability(base: (typeof REPAIR_CATALOGUE)[number]) {
  const climate = { Low: 30, Moderate: 55, High: 78, "Very High": 95 }[base.climateSuitability];
  const impactScore = { "Very Low": 95, Low: 80, Medium: 60, High: 40, "Very High": 20 }[base.environmentalImpact];
  const life = ((base.expectedLifeYearsMin + base.expectedLifeYearsMax) / 2 / 15) * 100;
  const cost = 100 - Math.min(100, base.estimatedCostLakhPerKm);
  return Math.round(climate * 0.35 + impactScore * 0.25 + life * 0.25 + cost * 0.15);
}

export function repairOptionsWeighted(
  segmentId: string,
  weights: { cost: number; durability: number; sustainability: number; coldClimate: number; availability: number },
): RepairOption[] {
  const totalWeight =
    weights.cost + weights.durability + weights.sustainability + weights.coldClimate + weights.availability || 1;
  return repairOptionsFor(segmentId)
    .map((opt) => {
      const climateScore = { Low: 20, Moderate: 50, High: 78, "Very High": 100 }[opt.climateSuitability];
      const sustainabilityScore = { "Very Low": 100, Low: 82, Medium: 58, High: 34, "Very High": 12 }[
        opt.environmentalImpact
      ];
      const durabilityScore = ((opt.expectedLifeYearsMin + opt.expectedLifeYearsMax) / 2 / 15) * 100;
      const costScore = 100 - Math.min(100, opt.estimatedCostLakhPerKm);
      const availabilityScore = opt.constructionTimeDays <= 12 ? 95 : opt.constructionTimeDays <= 25 ? 65 : 35;

      const weighted =
        (costScore * weights.cost +
          durabilityScore * weights.durability +
          sustainabilityScore * weights.sustainability +
          climateScore * weights.coldClimate +
          availabilityScore * weights.availability) /
        totalWeight;

      return { ...opt, suitabilityScore: Math.round(weighted) };
    })
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------
export const ALERTS: AlertItem[] = [
  {
    id: "al-01",
    category: "Critical Deterioration",
    severity: "critical",
    roadSegmentId: "nh3-srn-leh-210",
    title: "NH-3 KM 210–230 — critical deterioration probability",
    detail: "Predicted deterioration probability: 72% within 30 days.",
    recommendedAction: "Inspect within 48 hours",
    timestampIso: daysAgoIso(0.2),
    read: false,
  },
  {
    id: "al-02",
    category: "Weather Risk",
    severity: "warning",
    roadSegmentId: "manali-sarchu-08",
    title: "Sarchu Plateau — severe freeze-thaw forecast",
    detail: "162 additional freeze-thaw cycles projected over the next 14 days.",
    recommendedAction: "Prioritize cold-mix intervention before next freeze event",
    timestampIso: daysAgoIso(0.5),
    read: false,
  },
  {
    id: "al-03",
    category: "Sensor Failure",
    severity: "warning",
    roadSegmentId: "leh-nyoma-chushul-14",
    title: "Nyoma Sector weather station offline",
    detail: "No telemetry received for 26 hours. Prediction confidence downgraded to LOW.",
    recommendedAction: "Dispatch field team to verify sensor status",
    timestampIso: daysAgoIso(1.1),
    read: false,
  },
  {
    id: "al-04",
    category: "Inspection Overdue",
    severity: "info",
    roadSegmentId: "leh-pangong-11",
    title: "Leh–Pangong KM 48–92 inspection overdue",
    detail: "Last field inspection was 19 days ago, exceeding the 14-day cadence for this risk tier.",
    recommendedAction: "Schedule field inspection this week",
    timestampIso: daysAgoIso(1.6),
    read: true,
  },
  {
    id: "al-05",
    category: "High-Risk Segment",
    severity: "critical",
    roadSegmentId: "leh-khardungla-12",
    title: "Khardung La sector escalated to CRITICAL",
    detail: "Health score dropped from 52 to 40 over the last inspection cycle.",
    recommendedAction: "Confirm scheduled repair start date",
    timestampIso: daysAgoIso(2.1),
    read: true,
  },
  {
    id: "al-06",
    category: "Budget Threshold",
    severity: "warning",
    title: "Quarterly repair budget at 82% utilization",
    detail: "₹39.8 Cr of ₹48.5 Cr allocated budget committed against approved repairs.",
    recommendedAction: "Review remaining backlog prioritization",
    timestampIso: daysAgoIso(3),
    read: true,
  },
  {
    id: "al-07",
    category: "Prediction Anomaly",
    severity: "info",
    roadSegmentId: "manali-keylong-07",
    title: "Anomalous deterioration rate detected",
    detail: "Observed deterioration rate is 1.4x the model's expected range for this segment class.",
    recommendedAction: "Flag for AI/data analyst review",
    timestampIso: daysAgoIso(3.4),
    read: true,
  },
  {
    id: "al-08",
    category: "Repair Overdue",
    severity: "warning",
    roadSegmentId: "manali-rohtang-06",
    title: "Rohtang sector repair overdue by 6 days",
    detail: "Scheduled repair window closed without contractor mobilization confirmation.",
    recommendedAction: "Contact contractor and confirm revised timeline",
    timestampIso: daysAgoIso(4),
    read: true,
  },
];

// ---------------------------------------------------------------------------
// Field inspections (sample submitted records)
// ---------------------------------------------------------------------------
export const INSPECTIONS: InspectionRecord[] = [
  {
    id: "insp-01",
    roadSegmentId: "nh3-srn-leh-210",
    engineerName: "Capt. R. Bhandari",
    timestampIso: daysAgoIso(4),
    gps: { lat: 34.56, lng: 76.13 },
    temperatureC: -11,
    weather: "Overcast, light snow",
    surfaceCondition: "Severe",
    drainageCondition: "Poor",
    cracks: true,
    potholes: true,
    rutting: true,
    shoulderCondition: "Poor",
    notes: "Extensive alligator cracking across both lanes near KM 218. Drainage culvert partially blocked.",
    photoLabel: "IMG_KM218_north.jpg",
  },
  {
    id: "insp-02",
    roadSegmentId: "manali-sarchu-08",
    engineerName: "Lt. S. Thapa",
    timestampIso: daysAgoIso(2),
    gps: { lat: 32.99, lng: 77.67 },
    temperatureC: -14,
    weather: "Clear, high wind",
    surfaceCondition: "Severe",
    drainageCondition: "Poor",
    cracks: true,
    potholes: true,
    rutting: true,
    shoulderCondition: "Fair",
    notes: "Deep rutting from convoy traffic. Recommend priority intervention before next freeze cycle.",
    photoLabel: "IMG_SARCHU_east.jpg",
  },
];

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export const REPORT_TYPES: ReportType[] = [
  { id: "exec-health", name: "Executive Road Health Report", description: "Network-wide health, risk and budget summary for leadership.", audience: "Command / Leadership" },
  { id: "segment-eng", name: "Road Segment Engineering Report", description: "Detailed condition, structural and prediction data for a segment.", audience: "Road Engineer" },
  { id: "ai-risk", name: "AI Risk Report", description: "Model predictions, confidence and feature contributions across the network.", audience: "AI / Data Analyst" },
  { id: "repair-rec", name: "Repair Recommendation Report", description: "Recommended interventions, comparison matrix and cost/sustainability impact.", audience: "Maintenance Planner" },
  { id: "sustainability", name: "Sustainability Report", description: "CO₂ avoided, material reuse and waste diversion across completed repairs.", audience: "Command / Sustainability" },
  { id: "monthly-maint", name: "Monthly Maintenance Report", description: "Repair pipeline status, backlog and contractor performance.", audience: "Maintenance Planner" },
  { id: "strategic-infra", name: "Strategic Infrastructure Report", description: "Strategic-importance weighted risk overview for border corridors.", audience: "Command / Leadership" },
];

// ---------------------------------------------------------------------------
// Dashboard KPI demo constants (Section 36 of spec)
// ---------------------------------------------------------------------------
export const DASHBOARD_KPIS = {
  totalRoadLengthKm: 1248,
  overallHealth: 78,
  highRiskSegments: 23,
  criticalSegments: 7,
  co2ReductionPotentialTons: 1260,
  estimatedCostSavingsCr: 48.5,
  repairBacklogKm: 86,
  predictionAccuracyPct: 91.4,
};

export const SPARKLINES = {
  health: [74, 75, 76, 75, 77, 78, 78],
  risk: [19, 20, 21, 22, 23, 24, 23],
  critical: [5, 5, 6, 6, 7, 7, 7],
  co2: [980, 1040, 1090, 1150, 1190, 1230, 1260],
  savings: [38.2, 40.1, 42.5, 44.8, 46.2, 47.6, 48.5],
  backlog: [92, 90, 89, 88, 87, 86, 86],
  accuracy: [88.1, 88.9, 89.6, 90.2, 90.8, 91.1, 91.4],
  length: [1248, 1248, 1248, 1248, 1248, 1248, 1248],
};

export const SYSTEM_STATUS = {
  aiEngine: "online" as const,
  sensorNetwork: "online" as const,
  dataSync: "synced" as const,
  lastSyncIso: daysAgoIso(0.02),
};

export const WEATHER = {
  location: "Leh, Ladakh",
  tempC: -12,
  condition: "Clear, high wind",
};
