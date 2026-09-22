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

/** How far out from the bench edge the talus apron reaches, in world units. */
const TALUS_REACH = 17;

/**
 * Bedding planes in the exposed rock.
 *
 * Strata are near-horizontal but rarely level: the plane is tilted slightly
 * across and along the corridor so the bands cut the cut face at an angle
 * rather than ringing it like contour lines, which is what gives a rock cut
 * its direction. Returns a signed value in roughly [-1, 1], sharpened so the
 * resistant beds read as distinct courses rather than a sine wash.
 */
function beddingWave(x: number, z: number): number {
  const plane = x * 0.09 + z * 0.035;
  const w = Math.sin((plane * 0.5 + 1) * 1.7 + Math.sin(plane * 0.21) * 1.4);
  // Push toward the extremes so beds have edges.
  return Math.sign(w) * Math.pow(Math.abs(w), 0.55);
}

/**
 * The talus apron banked against the toe of the cut face.
 *
 * Debris does not form an even berm along the corridor — it is funnelled down
 * gullies and piles into cones that coalesce at their feet, so the apron is
 * modulated along Z and thickest where a gully feeds it. The wedge rises fast
 * out of the drainage line at the bench edge and tapers out upslope, which is
 * the profile a pile at the angle of repose makes against a steeper face.
 */
function talusApron(regime: CorridorRegime, lat: number, z: number): number {
  if (regime.talus <= 0.001) return 0;
  const d = lat - BENCH_HALF;
  if (d <= 0 || d >= TALUS_REACH) return 0;
  const u = d / TALUS_REACH;
  const wedge = smoothstep(0, 0.16, u) * (1 - smoothstep(0.3, 1, u));
  // Cone spacing along the corridor; sharpened so the lobes are distinct.
  const feed = fbm(z * 0.021, 41.7, SEED + 61, 2) * 0.5 + 0.5;
  const cones = 0.3 + 0.7 * Math.pow(feed, 1.7);
  return wedge * cones * regime.talus;
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

  // A range closing the far end of the corridor, in two parts.
  //
  // It used to rise everywhere at a 30% floor, including straight along the
  // corridor line. That was tuned when the drivable stretch was short; at
  // 1.55 km the road now reaches into it, and the last 175 m of carriageway
  // ran *inside* the hillside — the centreline is 22 m underground at the end
  // of the road. Fog hid it from the start line, and the eight flagged
  // failures all sit before it, so the inspection flow never met it; drive
  // past the last failure, as the chainage strip invites, and you drive into
  // a mountain.
  //
  // So the flanks close the view from beyond the bench, where they can rise
  // as steeply as they like, and the centre closes only past the end of the
  // road, which keeps the vanishing point full of ground without ever putting
  // ground on top of the carriageway.
  const aheadFlanks = smoothstep(1180, 1420, -z) * smoothstep(BENCH_HALF + 2, 62, lat);
  const roadEnd = -ROAD_END_Z;
  const aheadCentre = smoothstep(roadEnd, roadEnd + 62, -z) * 0.6;
  const ahead = Math.min(1, aheadFlanks + aheadCentre);
  if (ahead > 0.01) {
    const ridge = ridgedNoise(x * 0.009 * s, z * 0.009 * s, SEED + 23);
    h += ahead * (regime.aheadHeight + ridge * regime.aheadHeight * 1.7);
  }

  // Both of the following belong to the cut face, which is the negative-X
  // side. The fill side is an embankment falling away to the valley: it is
  // placed material with nothing above it to shed, so banking debris against
  // it or cutting strata into it would describe a slope that is not there.
  const isCutSide = x < 0;

  // Resistant beds stand proud of the softer courses between them. Only on
  // ground steep enough to be an exposed face — bedding does not emboss the
  // graded bench or the valley floor — and it fades out with distance, where
  // the stations are too coarse to resolve it and it would only alias.
  if (isCutSide && regime.bedding > 0.001) {
    const exposure = smoothstep(BENCH_HALF + 2, BENCH_HALF + 9, lat) * (1 - smoothstep(60, 130, lat));
    if (exposure > 0.01) {
      h += beddingWave(x, z) * 0.34 * regime.bedding * exposure;
    }
  }

  // Debris shed off the cut face, piled at its foot.
  if (isCutSide) h += talusApron(regime, lat, z);

  return h;
}

/**
 * Height of the rendered terrain SURFACE at a point, as opposed to the
 * analytic height field.
 *
 * The mesh is a piecewise-linear approximation of `corridorHeight`, and on a
 * convex profile — the knee where a cut face turns up out of the bench — the
 * flat facet between two stations sits *below* the curve it approximates. A
 * boulder placed at the analytic height therefore hangs in the air above the
 * triangle it is supposed to be resting on. Anything sat on the ground has to
 * be sat on the ground that is actually drawn.
 */
export function meshHeightAt(regime: CorridorRegime, x: number, z: number): number {
  const xs = terrainStationsX();
  const zs = terrainStationsZ();
  const i = bracket(xs, x);
  const j = bracket(zs, z);
  const x0 = xs[i];
  const x1 = xs[Math.min(xs.length - 1, i + 1)];
  const z0 = zs[j];
  const z1 = zs[Math.min(zs.length - 1, j + 1)];
  const tx = x1 > x0 ? (x - x0) / (x1 - x0) : 0;
  const tz = z1 > z0 ? (z - z0) / (z1 - z0) : 0;
  const h00 = corridorHeight(regime, x0, z0);
  const h10 = corridorHeight(regime, x1, z0);
  const h01 = corridorHeight(regime, x0, z1);
  const h11 = corridorHeight(regime, x1, z1);
  const a = h00 + (h10 - h00) * tx;
  const b = h01 + (h11 - h01) * tx;
  return a + (b - a) * tz;
}

/** Index of the station at or below `v`. */
function bracket(stations: number[], v: number): number {
  if (v <= stations[0]) return 0;
  if (v >= stations[stations.length - 1]) return stations.length - 2;
  let lo = 0;
  let hi = stations.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (stations[mid] <= v) lo = mid;
    else hi = mid;
  }
  return lo;
}

let cachedXs: number[] | null = null;
let cachedZs: number[] | null = null;
/** The mesh's own station grid, without pit cuts — they do not move the surface. */
function terrainStationsX() {
  if (!cachedXs) cachedXs = lateralStations(TERRAIN_WIDTH / 2, []);
  return cachedXs;
}
function terrainStationsZ() {
  if (!cachedZs) cachedZs = gridStations(TERRAIN_Z_END, TERRAIN_Z_START, TERRAIN_SEGMENTS_Z, []);
  return cachedZs;
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
      let rock = mix3(palette.rockDark, palette.rockLight, Math.min(1, slope * 0.9));

      // Bedding: alternating courses of harder and softer rock. Tinting the
      // beds is what actually sells the strata — the geometric relief alone is
      // a few centimetres and reads as noise without a colour difference to
      // separate one course from the next.
      if (regime.bedding > 0.001 && x < 0) {
        const bed = beddingWave(x, z);
        const bandLo = mix3(palette.rockDark, [0.09, 0.08, 0.075], 0.35);
        const bandHi = mix3(palette.rockLight, [0.74, 0.70, 0.64], 0.3);
        rock = mix3(rock, bed > 0 ? bandHi : bandLo, Math.abs(bed) * 0.4 * regime.bedding);
      }

      color = mix3(color, rock, smoothstep(rockLo, rockHi, slope));

      // The talus apron is loose broken rock, not the face it fell from: it
      // sits at the angle of repose, so the slope test alone would colour it
      // as soil and it would disappear into the bench.
      const talus = x < 0 ? talusApron(regime, -x, z) : 0;
      if (talus > 0.01) {
        const cover = Math.min(1, talus / Math.max(0.35, regime.talus * 0.55));
        const debris = mix3(palette.scree, palette.rockDark, 0.32);
        color = mix3(color, debris, cover * 0.75);
      }

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
