import type { WeatherCondition } from "./types";

export const WEATHER_ORDER: WeatherCondition[] = ["normal", "monsoon", "snow", "freeze-thaw", "landslide"];

export const WEATHER_LABELS: Record<WeatherCondition, string> = {
  normal: "Normal",
  monsoon: "Monsoon",
  snow: "Snow",
  "freeze-thaw": "Freeze-Thaw",
  landslide: "Landslide",
};

export const WEATHER_NOTES: Record<WeatherCondition, string> = {
  normal: "Baseline conditions",
  monsoon: "Water flow ↑ · moisture ↑ · drainage risk ↑",
  snow: "Snow accumulation · reduced visibility · freeze-thaw risk ↑",
  "freeze-thaw": "Cyclical expansion · accelerated crack propagation",
  landslide: "Slope instability · debris · road access risk",
};

/** How each condition scales the water plane and fog, applied on top of the terrain's own base values. */
export const WEATHER_ENVIRONMENT: Record<WeatherCondition, { waterLevelDelta: number; fogNearMul: number; fogFarMul: number; tint: string | null }> = {
  normal: { waterLevelDelta: 0, fogNearMul: 1, fogFarMul: 1, tint: null },
  monsoon: { waterLevelDelta: 1.4, fogNearMul: 0.75, fogFarMul: 0.8, tint: "#0c1a22" },
  snow: { waterLevelDelta: 0, fogNearMul: 0.55, fogFarMul: 0.6, tint: "#dce8ef" },
  "freeze-thaw": { waterLevelDelta: 0.2, fogNearMul: 0.9, fogFarMul: 0.95, tint: null },
  landslide: { waterLevelDelta: 0, fogNearMul: 0.7, fogFarMul: 0.75, tint: "#241a14" },
};
