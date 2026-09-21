import * as THREE from "three";
import { fbm, ridgedNoise } from "@/lib/road-sense/noise";

/**
 * Terrain for the 3D field-inspection corridor.
 *
 * The road is a straight bench along the Z axis (the drive/walk physics in
 * `inspection-scene` depends on that), so the terrain is modelled the way a
 * real mountain highway is built: a flat graded bench, a cut face rising on
 * one side, a fill embankment dropping into a gorge on the other, and the
 * range beyond. Height is a lateral profile plus noise, which keeps the
 * corridor perfectly drivable while everything around it reads as landscape.
 */

export const TERRAIN_WIDTH = 460;
export const TERRAIN_LENGTH = 620;
export const TERRAIN_SEGMENTS_X = 210;
export const TERRAIN_SEGMENTS_Z = 250;

/** Half-width of the flat graded bench, in metres. Covers road + shoulders. */
export const BENCH_HALF = 8.2;

const SEED = 1207;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

type Stop = readonly [distance: number, height: number];

/** Piecewise profile with smoothstep blending between control points. */
function profileEval(stops: readonly Stop[], d: number): number {
  if (d <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [d0, h0] = stops[i];
    const [d1, h1] = stops[i + 1];
    if (d <= d1) return h0 + (h1 - h0) * smoothstep(d0, d1, d);
  }
  return stops[stops.length - 1][1];
}

// Cut face: bench, steep rock cut, then the flank of the mountain above it.
const CLIFF_PROFILE: readonly Stop[] = [
  [BENCH_HALF, 0],
  [BENCH_HALF + 3, 3.2],
  [26, 20],
  [60, 44],
  [120, 86],
  [210, 128],
];

// Fill side: shoulder, embankment into the gorge, then the far wall of it.
const GORGE_PROFILE: readonly Stop[] = [
  [BENCH_HALF, 0],
  [BENCH_HALF + 4, -6.5],
  [30, -26],
  [52, -33],
  [88, -6],
  [140, 52],
  [230, 112],
];

/** Terrain height at a world-space point. Exactly 0 across the road bench. */
export function corridorHeight(x: number, z: number): number {
  const lat = Math.abs(x);
  const profile = x < 0 ? CLIFF_PROFILE : GORGE_PROFILE;
  let h = profileEval(profile, lat);

  // Relief only starts past the graded bench, and grows with distance so the
  // roadside stays calm while the skyline gets dramatic.
  const nearAmp = smoothstep(BENCH_HALF + 1.5, 45, lat) * 11;
  const farAmp = smoothstep(55, 190, lat) * 34;

  if (nearAmp > 0.01) {
    // Two scales: gullies and spurs down the cut face, then a finer break-up
    // so the slope has silhouette instead of reading as a smooth dune.
    const detail = fbm(x * 0.03, z * 0.03, SEED, 4);
    const rough = fbm(x * 0.11, z * 0.11, SEED + 5, 3);
    h += detail * nearAmp + rough * nearAmp * 0.28;
  }
  if (farAmp > 0.01) {
    // Ridged noise gives sharp arêtes and cirques instead of rolling blobs.
    const ridge = ridgedNoise(x * 0.0085, z * 0.0085, SEED + 3);
    const rolling = fbm(x * 0.006, z * 0.006, SEED + 11, 3);
    h += (ridge * 0.72 + (rolling * 0.5 + 0.5) * 0.28 - 0.34) * farAmp;
  }

  // A range closing the head of the valley. It rises everywhere, but more
  // slowly on the corridor line, so the road runs into distant rock rather
  // than into a blown-out patch of sky at the vanishing point.
  const ahead = smoothstep(250, 400, -z) * (0.3 + 0.7 * smoothstep(14, 62, lat));
  if (ahead > 0.01) {
    const ridge = ridgedNoise(x * 0.009, z * 0.009, SEED + 23);
    h += ahead * (40 + ridge * 68);
  }

  return h;
}

export interface TerrainBuild {
  geometry: THREE.BufferGeometry;
  minY: number;
  maxY: number;
}

// Kept deliberately cool and dark: a warm 2.5-intensity sun plus filmic tone
// mapping lifts these a long way, and warm mid-tones come out as sand dune.
const ROCK_DARK: [number, number, number] = [0.19, 0.19, 0.2];
const ROCK_LIGHT: [number, number, number] = [0.4, 0.39, 0.39];
const SOIL: [number, number, number] = [0.26, 0.23, 0.19];
const SCREE: [number, number, number] = [0.34, 0.33, 0.32];
const SNOW: [number, number, number] = [0.82, 0.85, 0.9];

function mix3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/**
 * Builds the terrain mesh with vertex colours and baked ambient occlusion.
 *
 * The AO term compares each vertex against the average of a wide neighbourhood:
 * points sitting below their surroundings (gullies, the toe of the cut face)
 * darken, ridges stay bright. It costs one extra pass over the heightfield and
 * does most of the work a screen-space AO pass would, for free, at every angle.
 */
export function buildCorridorTerrain(): TerrainBuild {
  const sx = TERRAIN_SEGMENTS_X;
  const sz = TERRAIN_SEGMENTS_Z;
  const vx = sx + 1;
  const vz = sz + 1;
  const count = vx * vz;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const heights = new Float32Array(count);

  const cellX = TERRAIN_WIDTH / sx;
  const cellZ = TERRAIN_LENGTH / sz;
  // Centre the mesh a long way down-corridor so there is landscape ahead of
  // the driver rather than a visible edge.
  const originZ = -TERRAIN_LENGTH / 2 + 140;

  let minY = Infinity;
  let maxY = -Infinity;

  for (let j = 0; j < vz; j++) {
    for (let i = 0; i < vx; i++) {
      const idx = j * vx + i;
      const x = -TERRAIN_WIDTH / 2 + i * cellX;
      const z = originZ + j * cellZ;
      const h = corridorHeight(x, z);
      heights[idx] = h;
      if (h < minY) minY = h;
      if (h > maxY) maxY = h;
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = h;
      positions[idx * 3 + 2] = z;
      // Metre-scale UVs so the detail normal tiles at a believable size.
      uvs[idx * 2] = x / 12;
      uvs[idx * 2 + 1] = z / 12;
    }
  }

  const sampleH = (i: number, j: number) =>
    heights[Math.min(vz - 1, Math.max(0, j)) * vx + Math.min(vx - 1, Math.max(0, i))];

  for (let j = 0; j < vz; j++) {
    for (let i = 0; i < vx; i++) {
      const idx = j * vx + i;
      const h = heights[idx];
      const x = positions[idx * 3];

      const hL = sampleH(i - 1, j);
      const hR = sampleH(i + 1, j);
      const hD = sampleH(i, j - 1);
      const hU = sampleH(i, j + 1);
      // Gradient magnitude. Averaging the two axes (rather than taking the
      // hypotenuse) halves the reading on a slope that only falls one way,
      // which leaves steep rock faces classified as gentle soil.
      const slope = Math.hypot((hR - hL) / (2 * cellX), (hU - hD) / (2 * cellZ));

      // Wide-radius openness term -> baked ambient occlusion.
      let around = 0;
      let taps = 0;
      for (let r = 2; r <= 8; r += 3) {
        around += sampleH(i - r, j) + sampleH(i + r, j) + sampleH(i, j - r) + sampleH(i, j + r);
        taps += 4;
      }
      around /= taps;
      const openness = Math.max(-1, Math.min(1, (h - around) / 12));
      const ao = 0.72 + (openness * 0.5 + 0.5) * 0.4;

      // Rock on steep ground, soil and scree where it can settle.
      let color = mix3(SOIL, SCREE, smoothstep(0.1, 0.5, slope));
      color = mix3(color, mix3(ROCK_DARK, ROCK_LIGHT, Math.min(1, slope * 0.9)), smoothstep(0.28, 1.0, slope));

      // Snowline, only where snow could actually lie.
      const snow = smoothstep(58, 96, h) * (1 - smoothstep(0.9, 1.9, slope));
      color = mix3(color, SNOW, snow * 0.92);

      // The gorge floor is in permanent shade and holds moisture.
      if (h < -14) color = mix3(color, [0.12, 0.13, 0.13], smoothstep(-14, -32, h) * 0.55);

      // Break up flat gradient banding.
      const jitter = fbm(x * 0.3, positions[idx * 3 + 2] * 0.3, SEED + 9, 2) * 0.035;

      colors[idx * 3] = Math.max(0, Math.min(1, (color[0] + jitter) * ao));
      colors[idx * 3 + 1] = Math.max(0, Math.min(1, (color[1] + jitter) * ao));
      colors[idx * 3 + 2] = Math.max(0, Math.min(1, (color[2] + jitter) * ao));
    }
  }

  const indices = new Uint32Array(sx * sz * 6);
  let k = 0;
  for (let j = 0; j < sz; j++) {
    for (let i = 0; i < sx; i++) {
      const a = j * vx + i;
      const b = j * vx + i + 1;
      const c = (j + 1) * vx + i;
      const d = (j + 1) * vx + i + 1;
      indices[k++] = a;
      indices[k++] = c;
      indices[k++] = b;
      indices[k++] = b;
      indices[k++] = c;
      indices[k++] = d;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  return { geometry, minY, maxY };
}

// ------------------------------------------------------------------ road ---

export const ROAD_WIDTH_M = 7.2;
/** Crown height at the centreline — real roads shed water off a camber. */
export const ROAD_CAMBER = 0.075;
export const ROAD_START_Z = 120;
export const ROAD_END_Z = -260;
/** Metres of road covered by one repeat of the carriageway texture. */
export const ROAD_TEXTURE_LENGTH = 18;

/**
 * Carriageway ribbon: a cambered strip with dense enough tessellation along
 * its length that the surface normal map and the camber both read.
 */
export function buildRoadGeometry(): THREE.BufferGeometry {
  const across = 28;
  const along = 260;
  const vx = across + 1;
  const vz = along + 1;
  const count = vx * vz;
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const half = ROAD_WIDTH_M / 2;
  const length = ROAD_START_Z - ROAD_END_Z;

  // z must INCREASE with j, matching the terrain builder: the shared index
  // winding below is only front-facing for that handedness, and getting it
  // backwards makes the whole ribbon face downwards and vanish to backface
  // culling.
  for (let j = 0; j < vz; j++) {
    const z = ROAD_END_Z + (j / along) * length;
    for (let i = 0; i < vx; i++) {
      const idx = j * vx + i;
      const t = i / across;
      const x = -half + t * ROAD_WIDTH_M;
      // Parabolic crown, plus a slight settle in the wheel paths.
      const nx = x / half;
      const camber = ROAD_CAMBER * (1 - nx * nx);
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = 0.05 + camber;
      positions[idx * 3 + 2] = z;
      uvs[idx * 2] = t;
      uvs[idx * 2 + 1] = z / ROAD_TEXTURE_LENGTH;
    }
  }

  const indices = new Uint32Array(across * along * 6);
  let k = 0;
  for (let j = 0; j < along; j++) {
    for (let i = 0; i < across; i++) {
      const a = j * vx + i;
      const b = j * vx + i + 1;
      const c = (j + 1) * vx + i;
      const d = (j + 1) * vx + i + 1;
      indices[k++] = a;
      indices[k++] = c;
      indices[k++] = b;
      indices[k++] = b;
      indices[k++] = c;
      indices[k++] = d;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}
