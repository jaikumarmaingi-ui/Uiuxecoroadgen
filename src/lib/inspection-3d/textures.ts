import * as THREE from "three";

/**
 * Procedural PBR texture generation for the 3D field-inspection scene.
 *
 * Everything here is synthesised on a canvas at runtime rather than loaded as
 * image assets: the scene ships no binary textures, works offline, and the
 * surfaces stay tweakable from code. Each generator returns a matched
 * albedo / normal / roughness set so materials respond to light like real
 * asphalt and rock instead of reading as flat-shaded plastic.
 *
 * All noise is *tileable* (lattice indices wrap at the octave period), so the
 * maps repeat across a road hundreds of metres long without a visible seam.
 */

function hash2(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1274126177);
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function smootherstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** Value noise on a wrapping lattice — `period` cells across the unit square. */
function valueNoiseTiled(x: number, y: number, period: number, seed: number): number {
  const fx = x * period;
  const fy = y * period;
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const sx = smootherstep(fx - ix);
  const sy = smootherstep(fy - iy);
  const wrap = (v: number) => ((v % period) + period) % period;
  const x0 = wrap(ix);
  const x1 = wrap(ix + 1);
  const y0 = wrap(iy);
  const y1 = wrap(iy + 1);
  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x1, y0, seed);
  const n01 = hash2(x0, y1, seed);
  const n11 = hash2(x1, y1, seed);
  const a = n00 + (n10 - n00) * sx;
  const b = n01 + (n11 - n01) * sx;
  return a + (b - a) * sy;
}

/** Fractal value noise; `basePeriod` must be an integer so every octave wraps. */
function fbmTiled(x: number, y: number, basePeriod: number, octaves: number, seed: number): number {
  let amp = 0.5;
  let sum = 0;
  let norm = 0;
  let period = basePeriod;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoiseTiled(x, y, period, seed + o * 101);
    norm += amp;
    amp *= 0.5;
    period *= 2;
  }
  return sum / norm;
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export interface SurfaceMaps {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

interface SurfaceSpec {
  size: number;
  /** Micro-relief in 0..1 — drives the normal map and shades the albedo. */
  height: (x: number, y: number) => number;
  /** Albedo in 0..255 per channel, given the local height. */
  color: (x: number, y: number, h: number) => [number, number, number];
  /** 0 = mirror, 1 = fully diffuse. */
  roughness: (x: number, y: number, h: number) => number;
  /**
   * Height-to-normal gain. This is a real slope, not a look knob: one texel
   * covers a few millimetres of surface, so relief of a few millimetres means
   * a gain of ~2-4. Push it to tens and every texel ends up facing sideways,
   * which under a low sun shreds the lighting into mottled camouflage.
   */
  normalStrength: number;
  anisotropy?: number;
}

function canvasFrom(data: ImageData): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = data.width;
  c.height = data.height;
  c.getContext("2d")!.putImageData(data, 0, 0);
  return c;
}

function buildSurface(spec: SurfaceSpec): SurfaceMaps {
  const { size, normalStrength } = spec;
  const ctx = document.createElement("canvas").getContext("2d")!;
  const albedo = ctx.createImageData(size, size);
  const normal = ctx.createImageData(size, size);
  const rough = ctx.createImageData(size, size);

  // Height first: the normal map is a derivative of it, so it needs the whole
  // field (including wrapped neighbours) before any per-pixel work.
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      heights[y * size + x] = spec.height(x / size, y / size);
    }
  }

  const at = (x: number, y: number) => heights[((y + size) % size) * size + ((x + size) % size)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const h = heights[i];
      const u = x / size;
      const v = y / size;

      const [r, g, b] = spec.color(u, v, h);
      // Shade the albedo slightly by relief so cavities read dark even under
      // flat lighting — the cheap half of ambient occlusion.
      const ao = 0.82 + h * 0.28;
      albedo.data[i * 4] = clamp01((r / 255) * ao) * 255;
      albedo.data[i * 4 + 1] = clamp01((g / 255) * ao) * 255;
      albedo.data[i * 4 + 2] = clamp01((b / 255) * ao) * 255;
      albedo.data[i * 4 + 3] = 255;

      // Sobel-lite central difference -> tangent-space normal.
      const dx = (at(x + 1, y) - at(x - 1, y)) * normalStrength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * normalStrength;
      const len = Math.hypot(dx, dy, 1);
      normal.data[i * 4] = ((-dx / len) * 0.5 + 0.5) * 255;
      normal.data[i * 4 + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      normal.data[i * 4 + 2] = (1 / len) * 0.5 * 255 + 127.5;
      normal.data[i * 4 + 3] = 255;

      const rr = clamp01(spec.roughness(u, v, h)) * 255;
      rough.data[i * 4] = rr;
      rough.data[i * 4 + 1] = rr;
      rough.data[i * 4 + 2] = rr;
      rough.data[i * 4 + 3] = 255;
    }
  }

  const mk = (data: ImageData, srgb: boolean) => {
    const t = new THREE.CanvasTexture(canvasFrom(data));
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = spec.anisotropy ?? 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  return { map: mk(albedo, true), normalMap: mk(normal, false), roughnessMap: mk(rough, false) };
}

// --------------------------------------------------------------- asphalt ---

/** Bare asphalt for shoulders, patches and the pavement cross-section. */
export function makeAsphaltMaps(size = 512): SurfaceMaps {
  return buildSurface({
    size,
    normalStrength: 3,
    height: (x, y) => {
      const grit = fbmTiled(x, y, 96, 3, 7);
      const aggregate = fbmTiled(x, y, 24, 3, 19);
      const patches = fbmTiled(x, y, 5, 2, 41);
      return clamp01(grit * 0.55 + aggregate * 0.32 + patches * 0.13);
    },
    color: (x, y, h) => {
      const patches = fbmTiled(x, y, 5, 2, 41);
      const base = 34 + h * 26 - (1 - patches) * 10;
      // Exposed aggregate: pale chips of crushed rock in the bitumen.
      const chip = fbmTiled(x, y, 96, 2, 7);
      const chipLift = chip > 0.68 ? (chip - 0.68) * 150 : 0;
      const v = base + chipLift;
      return [v * 1.0, v * 1.01, v * 1.06];
    },
    roughness: (x, y, h) => 0.88 - h * 0.12,
  });
}

// ------------------------------------------------------------ carriageway ---

export interface RoadMapsOptions {
  /** Full textured width in metres (carriageway + painted edge margin). */
  widthM: number;
  /** Length in metres that one texture repeat covers. */
  lengthM: number;
  size?: number;
  /** 0 = fresh overlay, 1 = heavily distressed. Drives cracking and wear. */
  distress?: number;
}

/**
 * The carriageway surface, with lane markings, polished wheel paths and
 * hairline cracking baked in. Painting markings into the texture (rather than
 * floating quads above the road) means they take the road's own lighting,
 * wear and camber, which is most of what makes a CG road look real.
 */
export function makeRoadMaps(opts: RoadMapsOptions): SurfaceMaps {
  const { widthM, lengthM, size = 1024, distress = 0.5 } = opts;
  const halfW = widthM / 2;
  const toMetresX = (u: number) => (u - 0.5) * widthM;

  // Lane centres for a two-lane carriageway, and the wheel paths either side
  // of each — the strips that polish smooth and shed their aggregate first.
  const laneCentre = halfW / 2;
  const wheelPaths = [-laneCentre - 0.8, -laneCentre + 0.8, laneCentre - 0.8, laneCentre + 0.8];
  const wheelPathWeight = (mx: number) => {
    let w = 0;
    for (const p of wheelPaths) w = Math.max(w, 1 - Math.min(1, Math.abs(mx - p) / 0.55));
    return smootherstep(w);
  };

  // Markings: dashed centreline, continuous edge lines just inside the verge.
  const dashPeriod = lengthM / 2; // two dash cycles per repeat
  const centreLine = (mx: number, v: number) => {
    if (Math.abs(mx) > 0.075) return 0;
    const along = (v * lengthM) % dashPeriod;
    const on = along < dashPeriod * 0.42 ? 1 : 0;
    return on;
  };
  const edgeLine = (mx: number) => (Math.abs(Math.abs(mx) - (halfW - 0.42)) < 0.055 ? 1 : 0);

  const crackAt = (x: number, y: number) => {
    // Ridged noise forms connected filaments — a good stand-in for the
    // branching map-cracking that opens up under freeze-thaw. The threshold
    // sits very close to 1 on purpose: cracks are hairlines a few millimetres
    // across, and widening them turns the carriageway into crazy paving.
    const n = fbmTiled(x, y, 18, 4, 77);
    const ridge = 1 - Math.abs(n - 0.5) * 2;
    const edgeBias = 0.6 + (Math.abs(toMetresX(x)) / halfW) * 0.4; // worse at the edges
    const t = (ridge - (1 - 0.014 * distress * edgeBias)) / 0.006;
    return clamp01(t);
  };

  return buildSurface({
    size,
    normalStrength: 3.2,
    anisotropy: 16,
    height: (x, y) => {
      const mx = toMetresX(x);
      const grit = fbmTiled(x, y, 110, 3, 7);
      const aggregate = fbmTiled(x, y, 26, 3, 19);
      let h = grit * 0.58 + aggregate * 0.42;
      // Wheel paths are worn smooth and slightly rutted.
      h = h * (1 - wheelPathWeight(mx) * 0.55) - wheelPathWeight(mx) * 0.06;
      // Paint sits proud of the surface.
      h += Math.max(centreLine(mx, y), edgeLine(mx)) * 0.28;
      // Cracks cut into it.
      h -= crackAt(x, y) * 0.55;
      return clamp01(h);
    },
    color: (x, y, h) => {
      const mx = toMetresX(x);
      const patches = fbmTiled(x, y, 4, 2, 41);
      const chip = fbmTiled(x, y, 110, 2, 7);

      let base = 32 + h * 24 - (1 - patches) * 9;
      if (chip > 0.7) base += (chip - 0.7) * 140;
      // Polished wheel paths go darker and lose their pale aggregate.
      base *= 1 - wheelPathWeight(mx) * 0.22;

      let r = base;
      let g = base * 1.01;
      let b = base * 1.07;

      const paint = Math.max(centreLine(mx, y), edgeLine(mx));
      if (paint > 0) {
        // Paint wears unevenly and picks up road grime.
        const wear = clamp01(0.55 + fbmTiled(x, y, 40, 3, 5) * 0.75 - distress * 0.3);
        r = r + (214 - r) * wear;
        g = g + (216 - g) * wear;
        b = b + (208 - b) * wear;
      }

      const crack = crackAt(x, y);
      if (crack > 0) {
        r += (12 - r) * crack;
        g += (12 - g) * crack;
        b += (14 - b) * crack;
      }
      return [r, g, b];
    },
    roughness: (x, y, h) => {
      const mx = toMetresX(x);
      const paint = Math.max(centreLine(mx, y), edgeLine(mx));
      const polished = wheelPathWeight(mx);
      // Bitumen is rough; polished wheel paths and fresh paint are less so.
      return clamp01(0.92 - h * 0.1 - polished * 0.3 - paint * 0.18);
    },
  });
}

// ---------------------------------------------------------------- gravel ---

/** Compacted gravel / scree for shoulders and the verge. */
export function makeGravelMaps(size = 512): SurfaceMaps {
  return buildSurface({
    size,
    normalStrength: 4.5,
    height: (x, y) => {
      const stones = fbmTiled(x, y, 40, 2, 13);
      const fine = fbmTiled(x, y, 120, 3, 29);
      const drift = fbmTiled(x, y, 7, 2, 3);
      return clamp01(stones * 0.5 + fine * 0.3 + drift * 0.2);
    },
    color: (x, y, h) => {
      const drift = fbmTiled(x, y, 7, 2, 3);
      const warm = 0.55 + drift * 0.6;
      const v = 40 + h * 58;
      return [v * (0.92 + warm * 0.14), v * (0.9 + warm * 0.08), v * 0.86];
    },
    roughness: (x, y, h) => 0.95 - h * 0.08,
  });
}

// ------------------------------------------------------------------ rock ---

/** Detail normal for the terrain — weathered, bedded mountain rock. */
export function makeRockMaps(size = 512): SurfaceMaps {
  return buildSurface({
    size,
    normalStrength: 3.6,
    height: (x, y) => {
      // Stretching one axis gives the strata a bedding direction.
      const bedding = fbmTiled(x * 0.35, y, 16, 4, 61);
      const fracture = fbmTiled(x, y, 48, 3, 83);
      const grain = fbmTiled(x, y, 140, 2, 97);
      return clamp01(bedding * 0.5 + fracture * 0.32 + grain * 0.18);
    },
    color: (x, y, h) => {
      const v = 56 + h * 48;
      return [v * 1.0, v * 0.98, v * 0.95];
    },
    roughness: (x, y, h) => 0.93 - h * 0.1,
  });
}

/**
 * Detail maps for the terrain mesh.
 *
 * The terrain is shaded by vertex colours, and three multiplies `map` into
 * those, so this albedo is centred near white: it modulates the vertex colour
 * with rock grain instead of replacing it. Without it, big slopes render as
 * unbroken flat-shaded fields whatever the geometry does.
 */
export function makeTerrainDetailMaps(size = 512): SurfaceMaps {
  return buildSurface({
    size,
    normalStrength: 3.6,
    height: (x, y) => {
      const bedding = fbmTiled(x * 0.6, y, 12, 4, 61);
      const fracture = fbmTiled(x, y, 40, 3, 83);
      const grain = fbmTiled(x, y, 120, 2, 97);
      return clamp01(bedding * 0.46 + fracture * 0.34 + grain * 0.2);
    },
    color: (x, y, h) => {
      // 0.62..1.0 of the vertex colour — texture, not tint.
      const v = 158 + h * 97;
      return [v, v * 0.995, v * 0.985];
    },
    roughness: (x, y, h) => 0.95 - h * 0.12,
  });
}

/** Dispose every map in a set — call from the owning component's cleanup. */
export function disposeMaps(maps: SurfaceMaps) {
  maps.map.dispose();
  maps.normalMap.dispose();
  maps.roughnessMap.dispose();
}
