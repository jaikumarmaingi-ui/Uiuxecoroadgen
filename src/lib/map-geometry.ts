import type { Coordinate, RoadSegment } from "./types";

export function toXY(c: Coordinate) {
  return { x: c.lng, y: c.lat };
}

export function pathToPoints(path: Coordinate[]) {
  return path.map(toXY);
}

export function pointsToSvgPath(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

export function pointAtFraction(path: Coordinate[], fraction: number) {
  const pts = pathToPoints(path);
  if (pts.length === 1) return pts[0];
  const segLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    segLengths.push(d);
    total += d;
  }
  let target = fraction * total;
  for (let i = 0; i < segLengths.length; i++) {
    if (target <= segLengths[i] || i === segLengths.length - 1) {
      const t = segLengths[i] === 0 ? 0 : target / segLengths[i];
      const a = pts[i];
      const b = pts[i + 1];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    target -= segLengths[i];
  }
  return pts[pts.length - 1];
}

export function midpoint(path: Coordinate[]) {
  return pointAtFraction(path, 0.5);
}

export function computeBounds(segments: RoadSegment[], padding = 60) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of segments) {
    for (const c of s.path) {
      minX = Math.min(minX, c.lng);
      maxX = Math.max(maxX, c.lng);
      minY = Math.min(minY, c.lat);
      maxY = Math.max(maxY, c.lat);
    }
  }
  return {
    minX: minX - padding,
    minY: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}
