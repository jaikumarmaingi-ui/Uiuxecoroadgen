import { createNoise2D, type NoiseFunction2D } from "simplex-noise";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noiseCache = new Map<number, NoiseFunction2D>();
function noiseFor(seed: number) {
  let n = noiseCache.get(seed);
  if (!n) {
    n = createNoise2D(mulberry32(seed));
    noiseCache.set(seed, n);
  }
  return n;
}

/** Fractal Brownian Motion height sample, roughly in range [-1, 1]. */
export function fbm(x: number, z: number, seed: number, octaves = 4, lacunarity = 2.1, gain = 0.5) {
  const n = noiseFor(seed);
  let amp = 0.55;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * n(x * freq, z * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

export function ridgedNoise(x: number, z: number, seed: number) {
  const v = fbm(x, z, seed, 5, 2.15, 0.5);
  const ridge = 1 - Math.abs(v);
  return ridge * ridge;
}
