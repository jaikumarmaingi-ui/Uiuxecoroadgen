"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import type { Vector3 } from "three";
import { TERRAIN_SIZE, heightAt } from "@/lib/road-sense/terrain-config";
import type { TerrainConfig, WeatherCondition } from "@/lib/road-sense/types";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const RAIN_COUNT = 220;
const SNOW_COUNT = 180;
const TOP_Y = 55;
const BOTTOM_Y = -4;
const HALF = TERRAIN_SIZE / 2;

export function WeatherEffects({
  config,
  weather,
  reducedMotion = false,
}: {
  config: TerrainConfig;
  weather: WeatherCondition;
  reducedMotion?: boolean;
}) {
  const rainRefs = useRef<{ position: Vector3 }[]>([]);
  const snowRefs = useRef<{ position: Vector3 }[]>([]);

  const rainSeeds = useMemo(() => {
    const rand = seededRandom(11);
    return Array.from({ length: RAIN_COUNT }, () => ({
      x: (rand() - 0.5) * HALF * 2,
      z: (rand() - 0.5) * HALF * 2,
      y: TOP_Y * rand(),
      speed: 34 + rand() * 14,
    }));
  }, []);

  const snowSeeds = useMemo(() => {
    const rand = seededRandom(23);
    return Array.from({ length: SNOW_COUNT }, () => ({
      x: (rand() - 0.5) * HALF * 2,
      z: (rand() - 0.5) * HALF * 2,
      y: TOP_Y * rand(),
      speed: 3 + rand() * 3,
      drift: (rand() - 0.5) * 1.2,
    }));
  }, []);

  const debris = useMemo(() => {
    if (weather !== "landslide") return [];
    const rand = seededRandom(77);
    const cx = -HALF * 0.35;
    const cz = HALF * 0.15;
    return Array.from({ length: 26 }, () => {
      const x = cx + (rand() - 0.5) * 26;
      const z = cz + (rand() - 0.5) * 20;
      const y = heightAt(config, x, z) + 0.3;
      return { x, y, z, scale: 0.35 + rand() * 0.65, rot: rand() * Math.PI };
    });
  }, [weather, config]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (weather === "monsoon") {
      for (let i = 0; i < rainRefs.current.length; i++) {
        const o = rainRefs.current[i];
        if (!o) continue;
        o.position.y -= rainSeeds[i].speed * delta;
        if (o.position.y < BOTTOM_Y) o.position.y = TOP_Y;
      }
    }
    if (weather === "snow") {
      for (let i = 0; i < snowRefs.current.length; i++) {
        const o = snowRefs.current[i];
        if (!o) continue;
        const s = snowSeeds[i];
        o.position.y -= s.speed * delta;
        o.position.x += Math.sin(o.position.y * 0.3 + i) * s.drift * delta;
        if (o.position.y < BOTTOM_Y) o.position.y = TOP_Y;
      }
    }
  });

  if (weather === "normal" || weather === "freeze-thaw") return null;

  return (
    <group>
      {weather === "monsoon" && (
        <Instances limit={RAIN_COUNT} frustumCulled={false}>
          <cylinderGeometry args={[0.012, 0.012, 0.7, 3]} />
          <meshBasicMaterial color="#9fd0e0" transparent opacity={0.45} />
          {rainSeeds.map((s, i) => (
            <Instance
              key={i}
              ref={(el) => {
                if (el) rainRefs.current[i] = el as { position: Vector3 };
              }}
              position={[s.x, s.y, s.z]}
            />
          ))}
        </Instances>
      )}

      {weather === "snow" && (
        <Instances limit={SNOW_COUNT} frustumCulled={false}>
          <sphereGeometry args={[0.09, 5, 4]} />
          <meshBasicMaterial color="#f4fbff" transparent opacity={0.85} />
          {snowSeeds.map((s, i) => (
            <Instance
              key={i}
              ref={(el) => {
                if (el) snowRefs.current[i] = el as { position: Vector3 };
              }}
              position={[s.x, s.y, s.z]}
            />
          ))}
        </Instances>
      )}

      {weather === "landslide" && debris.length > 0 && (
        <Instances limit={debris.length} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#4a3a2e" roughness={0.95} />
          {debris.map((d, i) => (
            <Instance key={i} position={[d.x, d.y, d.z]} scale={d.scale} rotation={[d.rot, d.rot * 0.6, 0]} />
          ))}
        </Instances>
      )}
    </group>
  );
}
