export type LayerKey =
  | "roads"
  | "defects"
  | "elevation"
  | "drainage"
  | "bridges"
  | "vegetation"
  | "soil"
  | "water"
  | "riskZones"
  | "droneCoverage"
  | "trafficLoad";

export const LAYER_LABELS: Record<LayerKey, string> = {
  roads: "Roads",
  defects: "Road Defects",
  elevation: "Elevation",
  drainage: "Drainage",
  bridges: "Bridges",
  vegetation: "Vegetation",
  soil: "Soil",
  water: "Water",
  riskZones: "AI Risk Zones",
  droneCoverage: "Drone Coverage",
  trafficLoad: "Traffic Load",
};

export const LAYER_ORDER: LayerKey[] = [
  "roads",
  "defects",
  "elevation",
  "drainage",
  "bridges",
  "vegetation",
  "soil",
  "water",
  "riskZones",
  "droneCoverage",
  "trafficLoad",
];

export const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  roads: true,
  defects: true,
  elevation: false,
  drainage: false,
  bridges: false,
  vegetation: true,
  soil: true,
  water: true,
  riskZones: false,
  droneCoverage: false,
  trafficLoad: false,
};
