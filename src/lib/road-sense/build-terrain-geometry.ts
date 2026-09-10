import * as THREE from "three";
import { heightAt, TERRAIN_SIZE } from "./terrain-config";
import type { TerrainConfig } from "./types";

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function buildTerrainGeometry(config: TerrainConfig, segments = 110) {
  const half = TERRAIN_SIZE / 2;
  const verts = segments + 1;
  const positions = new Float32Array(verts * verts * 3);
  const colors = new Float32Array(verts * verts * 3);
  const heights = new Float32Array(verts * verts);

  let minH = Infinity;
  let maxH = -Infinity;

  for (let j = 0; j < verts; j++) {
    for (let i = 0; i < verts; i++) {
      const x = -half + (i / segments) * TERRAIN_SIZE;
      const z = -half + (j / segments) * TERRAIN_SIZE;
      const h = heightAt(config, x, z);
      heights[j * verts + i] = h;
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
      const idx = (j * verts + i) * 3;
      positions[idx] = x;
      positions[idx + 1] = h;
      positions[idx + 2] = z;
    }
  }

  const range = Math.max(0.001, maxH - minH);
  const cellSize = TERRAIN_SIZE / segments;

  for (let j = 0; j < verts; j++) {
    for (let i = 0; i < verts; i++) {
      const idx = j * verts + i;
      const h = heights[idx];
      const hL = heights[j * verts + Math.max(0, i - 1)];
      const hR = heights[j * verts + Math.min(segments, i + 1)];
      const hD = heights[Math.max(0, j - 1) * verts + i];
      const hU = heights[Math.min(segments, j + 1) * verts + i];
      const slope = (Math.abs(hR - hL) + Math.abs(hU - hD)) / (2 * cellSize);
      const norm = Math.min(1, Math.max(0, (h - minH) / range));

      let color: [number, number, number];
      if (norm < 0.45) {
        color = lerp3(config.baseColor, config.midColor, norm / 0.45);
      } else {
        color = lerp3(config.midColor, config.highColor, (norm - 0.45) / 0.55);
      }

      // rock/scree tint on steep slopes
      const rockAmount = Math.min(1, slope * 1.6);
      const rock: [number, number, number] = [0.34, 0.32, 0.3];
      color = lerp3(color, rock, rockAmount * 0.6);

      // snow cap for high, low-slope peaks
      if (config.hasSnowCap && norm > 0.8 && slope < 0.85) {
        const snowAmount = Math.min(1, (norm - 0.8) / 0.2);
        color = lerp3(color, [0.9, 0.92, 0.96], snowAmount * 0.75);
      }

      // sand desaturation for desert
      if (config.hasSand) {
        color = lerp3(color, [0.68, 0.56, 0.36], 0.35);
      }

      // darken/waterlog near waterline
      if (config.hasWater && h < config.waterLevel + 0.6) {
        const wet = Math.min(1, (config.waterLevel + 0.6 - h) / 1.2);
        color = lerp3(color, [0.12, 0.14, 0.1], wet * 0.5);
      }

      const cidx = idx * 3;
      colors[cidx] = color[0];
      colors[cidx + 1] = color[1];
      colors[cidx + 2] = color[2];
    }
  }

  const indices: number[] = [];
  for (let j = 0; j < segments; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * verts + i;
      const b = j * verts + i + 1;
      const c = (j + 1) * verts + i;
      const d = (j + 1) * verts + i + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return { geometry, minH, maxH };
}
