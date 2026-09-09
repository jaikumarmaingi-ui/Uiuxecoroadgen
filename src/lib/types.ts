export type RiskLevel = "healthy" | "good" | "moderate" | "high-risk" | "critical";

export type RoadClass = "National Highway" | "Border Road" | "Strategic Link" | "Feeder Road";

export type SurfaceCondition = "Good" | "Fair" | "Poor" | "Severe";

export type RepairStage =
  | "Detected"
  | "Assessment"
  | "Recommended"
  | "Approved"
  | "Scheduled"
  | "Under Repair"
  | "Completed"
  | "Monitoring";

export type DataConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface FeatureContribution {
  factor: string;
  weight: number; // percentage contribution, sums ~100 across a segment
}

export interface DeteriorationPoint {
  label: string; // "Now", "30d", "60d", "90d"
  health: number;
}

export interface RoadSegment {
  id: string;
  roadName: string;
  routeNumber: string;
  region: string;
  segmentLabel: string; // "KM 210–230"
  startKm: number;
  endKm: number;
  lengthKm: number;
  path: Coordinate[]; // polyline for the mock map (normalized 0-1000 viewbox coords)
  altitudeM: number;
  temperatureC: number;
  healthScore: number; // 0-100
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  strategicImportance: number; // 0-100
  trafficLoad: number; // 0-100
  militaryConvoyFrequency: "Low" | "Moderate" | "High" | "Very High";
  freezeThawCycles: number; // annual count
  rainfallMm: number;
  drainageScore: number; // 0-100, higher is better
  surfaceCondition: SurfaceCondition;
  structuralCondition: SurfaceCondition;
  lastInspectionIso: string;
  predictedDeterioration: DeteriorationPoint[];
  probabilityOfFailurePct: number;
  predictionConfidencePct: number;
  dataConfidence: DataConfidence;
  featureContributions: FeatureContribution[];
  aiExplanation: string;
  recommendedRepairId: string;
  repairStage: RepairStage;
  priorityScore: number; // 0-100
  priorityRank?: number;
  timeToInterventionDays: number;
  landmarks: { type: LandmarkType; label: string; at: number }[]; // 'at' = fraction along path
  distress: {
    cracking: number;
    potholes: number;
    rutting: number;
    ravelling: number;
    edgeDeterioration: number;
    depression: number;
  };
  structural: {
    pavementStrength: number;
    deflection: number;
    loadResponse: number;
    subgradeCondition: number;
  };
  history: { dateIso: string; event: string; healthAfter: number }[];
}

export type LandmarkType =
  | "checkpoint"
  | "bridge"
  | "culvert"
  | "tunnel"
  | "weather-station"
  | "inspection-point"
  | "repair-site";

export type ClimateSuitability = "Low" | "Moderate" | "High" | "Very High";
export type ImpactLevel = "Very Low" | "Low" | "Medium" | "High" | "Very High";

export interface RepairOption {
  id: string;
  roadSegmentId: string;
  method: string;
  shortLabel: string;
  description: string;
  expectedLifeYearsMin: number;
  expectedLifeYearsMax: number;
  estimatedCostLakhPerKm: number;
  climateSuitability: ClimateSuitability;
  environmentalImpact: ImpactLevel;
  maintenanceFrequency: ImpactLevel;
  carbonReductionTons: number;
  recycledMaterialPct: number;
  plasticWasteUtilizedTons: number;
  constructionTimeDays: number;
  waterResistanceStars: number; // 1-5
  freezeThawResistanceStars: number;
  trafficLoadCapacityStars: number;
  suitabilityScore: number; // 0-100, recalculated by weights
  reasons: string[];
  riskConsiderations: string[];
  aiConfidencePct: number;
}

export interface AlertItem {
  id: string;
  category:
    | "Critical Deterioration"
    | "Weather Risk"
    | "Road Closure"
    | "Inspection Overdue"
    | "Repair Overdue"
    | "Sensor Failure"
    | "Prediction Anomaly"
    | "High-Risk Segment"
    | "Budget Threshold";
  severity: "critical" | "warning" | "info";
  roadSegmentId?: string;
  title: string;
  detail: string;
  recommendedAction: string;
  timestampIso: string;
  read: boolean;
}

export interface InspectionRecord {
  id: string;
  roadSegmentId: string;
  engineerName: string;
  timestampIso: string;
  gps: Coordinate;
  temperatureC: number;
  weather: string;
  surfaceCondition: SurfaceCondition;
  drainageCondition: "Good" | "Fair" | "Poor";
  cracks: boolean;
  potholes: boolean;
  rutting: boolean;
  shoulderCondition: "Good" | "Fair" | "Poor";
  notes: string;
  photoLabel?: string;
}

export interface ReportType {
  id: string;
  name: string;
  description: string;
  audience: string;
}
