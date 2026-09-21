import * as THREE from "three";
import { fbm, ridgedNoise } from "@/lib/road-sense/noise";
import {
  CORRIDOR_REGIMES,
  type CorridorRegime,
  type CorridorTerrain,
  type ProfileStop,
  type RGB,
} from "./regimes";

/**
 * Terrain for the 3D field-inspection corridor.
 *
 * The road is a straight bench along the Z axis (the drive/walk physics in
 * `inspection-scene` depends on that), so the terrain is modelled the way a
 * real highway is built: a flat graded bench, a cut face rising on one side, a
 * fill embankment falling on the other, and whatever the regime puts beyond
 * them. Height is a lateral profile plus noise, which keeps the corridor
 * perfectly drivable while everything around it reads as landscape.
 *
 * Everything that varies between landscapes lives in `regimes.ts`; this module
 * only knows how to turn a regime into geometry.
 */

export const TERRAIN_WIDTH = 460;
/** Corridor extent along Z. Generous, because the drive is a long one. */
export const TERRAIN_Z_START = 220;
export const TERRAIN_Z_END = -1480;
export const TERRAIN_SEGMENTS_Z = 640;

/** Half-width of the flat graded bench. Covers road + shoulders. */
export const BENCH_HALF = 8.2;

const SEED = 1207;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Piecewise profile with smoothstep blending between control points. */
function profileEval(stops: readonly ProfileStop[], d: number): number {
  if (d <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [d0, h0] = stops[i];
    const [d1, h1] = stops[i + 1];
    if (d <= d1) return h0 + (h1 - h0) * smoothstep(d0, d1, d);
  }
  return stops[stops.length - 1][1];
}

/** Terrain height at a world-space point. Exactly 0 across the road bench. */
export function corridorHeight(regime: CorridorRegime, x: number, z: number): number {
  const lat = Math.abs(x);
  let h = profileEval(x < 0 ? regime.cutProfile : regime.fillProfile, lat);

  // Relief only starts past the graded bench, and grows with distance so the
  // roadside stays calm while the skyline gets dramatic.
  const nearAmp = smoothstep(BENCH_HALF + 1.5, 45, lat) * regime.nearAmp;
  const farAmp = smoothstep(55, 190, lat) * regime.farAmp;
  const s = regime.detailScale;

  if (nearAmp > 0.01) {
    // Two scales: gullies and spurs down the cut face, then a finer break-up
    // so the slope has silhouette instead of reading as a smooth dune.
    const detail = fbm(x * 0.03 * s, z * 0.03 * s, SEED, 4);
    const rough = fbm(x * 0.11 * s, z * 0.11 * s, SEED + 5, 3);
    h += detail * nearAmp + rough * nearAmp * 0.28;
  }
  if (farAmp > 0.01) {
    // Ridged noise gives sharp arêtes and cirques instead of rolling blobs.
    const ridge = ridgedNoise(x * 0.0085 * s, z * 0.0085 * s, SEED + 3);
    const rolling = fbm(x * 0.006 * s, z * 0.006 * s, SEED + 11, 3);
    h += (ridge * 0.72 + (rolling * 0.5 + 0.5) * 0.28 - 0.34) * farAmp;
  }

  // A range closing the far end of the corridor. It rises everywhere, but more
  // slowly on the corridor line, so the road runs into distant ground rather
  // than into a blown-out patch of sky at the vanishing point.
  const ahead = smoothstep(1180, 1420, -z) * (0.3 + 0.7 * smoothstep(14, 62, lat));
  if (ahead > 0.01) {
    const ridge = ridgedNoise(x * 0.009 * s, z * 0.009 * s, SEED + 23);
    h += ahead * (regime.aheadHeight + ridge * regime.aheadHeight * 1.7);
  }

  return h;
}

/**
 * A rectangular opening cut through both the carriageway and the terrain, so
 * the trial pit at a flagged defect is a real hole rather than a dark decal
 * painted on an unbroken surface.
 */
export interface PitCut {
  x: number;
  z: number;
  /** Half the side length of the (square) opening. */
  half: number;
}

function dedupe(values: number[]): number[] {
  values.sort((a, b) => a - b);
  const out: number[] = [];
  for (const v of values) {
    if (out.length === 0 || v - out[out.length - 1] > 1e-4) out.push(v);
  }
  return out;
}

/**
 * Grid lines for one axis: an even division, with the cut boundaries inserted
 * as exact extra lines.
 *
 * Snapping the hole to whatever the nearest even grid line happens to be would
 * leave its edges up to a cell out of place — metres, on the terrain. Adding
 * the boundaries as their own stations makes the opening land exactly where
 * the pit is, at any grid resolution.
 */
function gridStations(min: number, max: number, divisions: number, cuts: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i <= divisions; i++) out.push(min + ((max - min) * i) / divisions);
  for (const c of cuts) if (c > min && c < max) out.push(c);
  return dedupe(out);
}

/**
 * Lateral stations, graded by distance from the corridor.
 *
 * The corridor is now well over a kilometre long, so a uniform lateral grid
 * fine enough for the roadside would put the mesh into six figures of vertices
 * for ground the driver only ever sees as a distant skyline. Spacing the
 * stations out with distance keeps detail where the eye is and costs a
 * fraction of the vertices; the slope and colour passes already work from real
 * coordinate deltas, so non-uniform spacing needs no special handling there.
 */
function lateralStations(halfWidth: number, cuts: number[]): number[] {
  const bands: [from: number, to: number, step: number][] = [
    [0, 26, 2],
    [26, 60, 4],
    [60, 120, 9],
    [120, halfWidth, 18],
  ];
  const out: number[] = [0];
  for (const [from, to, step] of bands) {
    for (let d = from + step; d <= to + 1e-6; d += step) {
      out.push(d, -d);
    }
  }
  out.push(halfWidth, -halfWidth);
  for (const c of cuts) if (Math.abs(c) < halfWidth) out.push(c);
  return dedupe(out);
}

function cutsFor(pit: PitCut | undefined, axis: "x" | "z"): number[] {
  if (!pit) return [];
  const c = axis === "x" ? pit.x : pit.z;
  return [c - pit.half, c + pit.half];
}

/** True when the centre of a cell falls inside the opening. */
function cellInPit(pit: PitCut | undefined, x0: number, x1: number, z0: number, z1: number): boolean {
  if (!pit) return false;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  return Math.abs(cx - pit.x) < pit.half && Math.abs(cz - pit.z) < pit.half;
}

export interface TerrainBuild {
  geometry: THREE.BufferGeometry;
  minY: number;
  maxY: number;
}

function mix3(a: RGB, b: RGB, t: number): RGB {
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
export function buildCorridorTerrain(
  regime: CorridorRegime,
  opts: { pit?: PitCut } = {},
): TerrainBuild {
  const { pit } = opts;
  const { palette } = regime;

  const xs = lateralStations(TERRAIN_WIDTH / 2, cutsFor(pit, "x"));
  const zs = gridStations(TERRAIN_Z_END, TERRAIN_Z_START, TERRAIN_SEGMENTS_Z, cutsFor(pit, "z"));
  const vx = xs.length;
  const vz = zs.length;
  const count = vx * vz;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const heights = new Float32Array(count);

  let minY = Infinity;
  let maxY = -Infinity;

  for (let j = 0; j < vz; j++) {
    for (let i = 0; i < vx; i++) {
      const idx = j * vx + i;
      const x = xs[i];
      const z = zs[j];
      const h = corridorHeight(regime, x, z);
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

  const [snowLo, snowHi] = regime.snowline;
  const [rockLo, rockHi] = regime.rockSlope;

  for (let j = 0; j < vz; j++) {
    for (let i = 0; i < vx; i++) {
      const idx = j * vx + i;
      const h = heights[idx];
      const x = positions[idx * 3];
      const z = positions[idx * 3 + 2];

      const hL = sampleH(i - 1, j);
      const hR = sampleH(i + 1, j);
      const hD = sampleH(i, j - 1);
      const hU = sampleH(i, j + 1);
      // Real spacing: the lateral grid is graded and the pit boundaries are
      // inserted, so neither axis is evenly spaced.
      const dx = xs[Math.min(vx - 1, i + 1)] - xs[Math.max(0, i - 1)] || 1;
      const dz = zs[Math.min(vz - 1, j + 1)] - zs[Math.max(0, j - 1)] || 1;
      // Gradient magnitude. Averaging the two axes (rather than taking the
      // hypotenuse) halves the reading on a slope that only falls one way,
      // which leaves steep rock faces classified as gentle soil.
      const slope = Math.hypot((hR - hL) / dx, (hU - hD) / dz);

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
      let color = mix3(palette.soil, palette.scree, smoothstep(0.1, 0.5, slope));
      color = mix3(
        color,
        mix3(palette.rockDark, palette.rockLight, Math.min(1, slope * 0.9)),
        smoothstep(rockLo, rockHi, slope),
      );

      // Vegetation takes hold on gentle ground, in patches rather than evenly.
      if (palette.verdure) {
        const patch = fbm(x * 0.012, z * 0.012, SEED + 31, 3) * 0.5 + 0.5;
        const gentle = 1 - smoothstep(0.3, 0.95, slope);
        color = mix3(color, palette.verdure, gentle * (0.35 + patch * 0.5));
      }

      // Snowline, only where snow could actually lie.
      if (palette.snow) {
        const snow = smoothstep(snowLo, snowHi, h) * (1 - smoothstep(0.9, 1.9, slope));
        color = mix3(color, palette.snow, snow * 0.92);
      }

      // Low ground holds moisture and sits in shade.
      if (h < -14) color = mix3(color, [0.12, 0.13, 0.13], smoothstep(-14, -32, h) * 0.55);

      // Break up flat gradient banding.
      const jitter = fbm(x * 0.3, z * 0.3, SEED + 9, 2) * 0.035;

      colors[idx * 3] = Math.max(0, Math.min(1, (color[0] + jitter) * ao));
      colors[idx * 3 + 1] = Math.max(0, Math.min(1, (color[1] + jitter) * ao));
      colors[idx * 3 + 2] = Math.max(0, Math.min(1, (color[2] + jitter) * ao));
    }
  }

  const tris: number[] = [];
  for (let j = 0; j < vz - 1; j++) {
    for (let i = 0; i < vx - 1; i++) {
      if (cellInPit(pit, xs[i], xs[i + 1], zs[j], zs[j + 1])) continue;
      const a = j * vx + i;
      const b = j * vx + i + 1;
      const c = (j + 1) * vx + i;
      const d = (j + 1) * vx + i + 1;
      tris.push(a, c, b, b, c, d);
    }
  }
  const indices = Uint32Array.from(tris);

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
export const ROAD_START_Z = 150;
export const ROAD_END_Z = -1400;
/** Metres of road covered by one repeat of the carriageway texture. */
export const ROAD_TEXTURE_LENGTH = 18;

/**
 * Chainage scale.
 *
 * The scene is built at roughly 1 world unit to the metre near the road — the
 * carriageway is 7.2 units wide for a 7.2 m carriageway — so chainage along
 * the corridor can be reported honestly in metres at 1:1. (ROAD//SENSE's
 * terrain is a stylised miniature and cannot; this one can.)
 */
export const CHAINAGE_M_PER_UNIT = 1;

/** Total drivable length, in metres. */
export const ROAD_LENGTH_M = (ROAD_START_Z - ROAD_END_Z) * CHAINAGE_M_PER_UNIT;

/** Height of the cambered carriageway at a given offset from the centreline. */
export function roadSurfaceY(x: number): number {
  const nx = Math.max(-1, Math.min(1, x / (ROAD_WIDTH_M / 2)));
  return 0.05 + ROAD_CAMBER * (1 - nx * nx);
}

/**
 * Carriageway ribbon: a cambered strip with dense enough tessellation along
 * its length that the surface normal map and the camber both read.
 */
export function buildRoadGeometry(opts: { pit?: PitCut } = {}): THREE.BufferGeometry {
  const { pit } = opts;
  const half = ROAD_WIDTH_M / 2;

  const xs = gridStations(-half, half, 28, cutsFor(pit, "x"));
  // One station roughly every 1.5 m: enough for the camber and the normal map
  // without carrying a vertex budget the length no longer justifies.
  const alongDivisions = Math.round((ROAD_START_Z - ROAD_END_Z) / 1.5);
  const zs = gridStations(ROAD_END_Z, ROAD_START_Z, alongDivisions, cutsFor(pit, "z"));
  const vx = xs.length;
  const vz = zs.length;
  const count = vx * vz;
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);

  // z must INCREASE with j, matching the terrain builder: the shared index
  // winding below is only front-facing for that handedness, and getting it
  // backwards makes the whole ribbon face downwards and vanish to backface
  // culling.
  for (let j = 0; j < vz; j++) {
    const z = zs[j];
    for (let i = 0; i < vx; i++) {
      const idx = j * vx + i;
      const x = xs[i];
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = roadSurfaceY(x);
      positions[idx * 3 + 2] = z;
      uvs[idx * 2] = (x + half) / ROAD_WIDTH_M;
      uvs[idx * 2 + 1] = z / ROAD_TEXTURE_LENGTH;
    }
  }

  const tris: number[] = [];
  for (let j = 0; j < vz - 1; j++) {
    for (let i = 0; i < vx - 1; i++) {
      if (cellInPit(pit, xs[i], xs[i + 1], zs[j], zs[j + 1])) continue;
      const a = j * vx + i;
      const b = j * vx + i + 1;
      const c = (j + 1) * vx + i;
      const d = (j + 1) * vx + i + 1;
      tris.push(a, c, b, b, c, d);
    }
  }
  const indices = Uint32Array.from(tris);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}

export { CORRIDOR_REGIMES };
export type { CorridorRegime, CorridorTerrain };
