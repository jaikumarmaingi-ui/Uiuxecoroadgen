import * as THREE from "three";
import type { RoadPoint } from "./terrain-config";
import type { RoadDefect } from "./types";

const SEVERITY_IMPACT: Record<RoadDefect["severity"], number> = { low: 14, moderate: 28, high: 46, critical: 68 };

function healthColorAt(t: number, defects: RoadDefect[]): [number, number, number] {
  let health = 100;
  for (const d of defects) {
    const dist = Math.abs(d.t - t);
    const falloff = Math.exp(-Math.pow(dist / 0.025, 2));
    health -= SEVERITY_IMPACT[d.severity] * falloff;
  }
  health = Math.max(6, Math.min(100, health));

  // green -> yellow -> orange -> red -> deep red
  const stops: [number, [number, number, number]][] = [
    [100, [0.31, 0.88, 0.54]],
    [75, [0.75, 0.85, 0.24]],
    [55, [0.94, 0.68, 0.24]],
    [35, [0.94, 0.32, 0.24]],
    [0, [0.55, 0.09, 0.09]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [h1, c1] = stops[i];
    const [h2, c2] = stops[i + 1];
    if (health <= h1 && health >= h2) {
      const f = (h1 - health) / (h1 - h2);
      return [c1[0] + (c2[0] - c1[0]) * f, c1[1] + (c2[1] - c1[1]) * f, c1[2] + (c2[2] - c1[2]) * f];
    }
  }
  return stops[stops.length - 1][1];
}

export function buildRoadGeometry(path: RoadPoint[], width: number, defects: RoadDefect[]) {
  const n = path.length;
  const positions = new Float32Array(n * 2 * 3);
  const uvs = new Float32Array(n * 2 * 2);
  const colors = new Float32Array(n * 2 * 3);
  const half = width / 2;
  const up = new THREE.Vector3(0, 1, 0);

  let dist = 0;

  for (let i = 0; i < n; i++) {
    const p = path[i];
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(n - 1, i + 1)];
    const tangent = new THREE.Vector3(next.x - prev.x, 0, next.z - prev.z).normalize();
    const perp = new THREE.Vector3().crossVectors(up, tangent).normalize();

    if (i > 0) {
      dist += Math.hypot(p.x - prev.x, p.z - prev.z);
    }

    const t = i / (n - 1);
    const [r, g, b] = healthColorAt(t, defects);

    const leftIdx = i * 2;
    const rightIdx = i * 2 + 1;

    positions[leftIdx * 3] = p.x - perp.x * half;
    positions[leftIdx * 3 + 1] = p.y;
    positions[leftIdx * 3 + 2] = p.z - perp.z * half;

    positions[rightIdx * 3] = p.x + perp.x * half;
    positions[rightIdx * 3 + 1] = p.y;
    positions[rightIdx * 3 + 2] = p.z + perp.z * half;

    uvs[leftIdx * 2] = 0;
    uvs[leftIdx * 2 + 1] = dist / 6;
    uvs[rightIdx * 2] = 1;
    uvs[rightIdx * 2 + 1] = dist / 6;

    colors[leftIdx * 3] = r;
    colors[leftIdx * 3 + 1] = g;
    colors[leftIdx * 3 + 2] = b;
    colors[rightIdx * 3] = r;
    colors[rightIdx * 3 + 1] = g;
    colors[rightIdx * 3 + 2] = b;
  }

  const indices: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/** Position + forward-tangent along the road at fraction t (0..1). */
export function pointOnRoad(path: RoadPoint[], t: number) {
  const n = path.length;
  const f = Math.max(0, Math.min(1, t)) * (n - 1);
  const i = Math.floor(f);
  const frac = f - i;
  const a = path[i];
  const b = path[Math.min(n - 1, i + 1)];
  return {
    x: a.x + (b.x - a.x) * frac,
    y: a.y + (b.y - a.y) * frac,
    z: a.z + (b.z - a.z) * frac,
    dx: b.x - a.x,
    dz: b.z - a.z,
  };
}
