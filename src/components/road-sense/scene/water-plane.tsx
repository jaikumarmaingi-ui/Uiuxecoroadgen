"use client";

import { TERRAIN_SIZE } from "@/lib/road-sense/terrain-config";
import { WEATHER_ENVIRONMENT } from "@/lib/road-sense/weather";
import type { TerrainConfig, WeatherCondition } from "@/lib/road-sense/types";

export function WaterPlane({ config, weather = "normal" }: { config: TerrainConfig; weather?: WeatherCondition }) {
  const { waterLevelDelta } = WEATHER_ENVIRONMENT[weather];
  // Monsoon pools water even on terrains that don't otherwise carry a water body.
  if (!config.hasWater && weather !== "monsoon") return null;
  const opacity = weather === "monsoon" ? 0.88 : 0.78;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, config.waterLevel + waterLevelDelta, 0]}>
      <planeGeometry args={[TERRAIN_SIZE, TERRAIN_SIZE, 1, 1]} />
      <meshStandardMaterial color="#173a4d" transparent opacity={opacity} roughness={0.12} metalness={0.35} />
    </mesh>
  );
}
