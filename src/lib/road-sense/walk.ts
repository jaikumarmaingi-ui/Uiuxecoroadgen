import { pointOnRoad } from "./build-road-geometry";
import type { RoadPoint } from "./terrain-config";
import type { RoadDefect } from "./types";

/**
 * On-foot inspection mode.
 *
 * Drive mode rides the centreline on rails and Drone mode flies the corridor;
 * neither lets an engineer stand next to a defect and look at it. Walk mode is
 * the close-range counterpart: free movement in a corridor around the road,
 * with the camera at eye height and a proximity readout for whatever defect is
 * nearest.
 */

/** Eye height above the surface, in world units (roughly metres). */
export const EYE_HEIGHT = 1.68;
/** How far from the centreline the inspector may wander. */
export const WALK_CORRIDOR_HALF = 13;
export const WALK_SPEED = 6.2;
export const WALK_RUN_MULTIPLIER = 2.1;
/** Radians per pixel of pointer drag. */
export const LOOK_SENSITIVITY = 0.0028;
/** Keeps the camera off the poles so the horizon never flips. */
export const MAX_PITCH = 1.15;

export interface WalkState {
  x: number;
  z: number;
  /** Heading in radians. 0 looks down -Z, matching the scene's forward. */
  yaw: number;
  pitch: number;
  /** Smoothed bob phase, so footsteps read without a full gait rig. */
  bob: number;
  moving: boolean;
}

export function createWalkState(): WalkState {
  return { x: 0, z: 0, yaw: 0, pitch: -0.05, bob: 0, moving: false };
}

export interface NearestPath {
  index: number;
  /** Fraction along the path, 0..1. */
  t: number;
  /** Planar distance from the query point to that path point. */
  dist: number;
  point: RoadPoint;
}

/**
 * Nearest point on the road polyline to (x, z).
 *
 * Scans the whole path rather than guessing a window from z: unlike the
 * terrain builder's version, this is called with positions that can sit well
 * off the centreline, where a z-based guess is not reliable. A couple of
 * hundred points per frame is nothing.
 */
export function nearestOnPath(path: RoadPoint[], x: number, z: number): NearestPath {
  let bestIndex = 0;
  let bestDistSq = Infinity;
  for (let i = 0; i < path.length; i++) {
    const dx = path[i].x - x;
    const dz = path[i].z - z;
    const d = dx * dx + dz * dz;
    if (d < bestDistSq) {
      bestDistSq = d;
      bestIndex = i;
    }
  }
  return {
    index: bestIndex,
    t: path.length > 1 ? bestIndex / (path.length - 1) : 0,
    dist: Math.sqrt(bestDistSq),
    point: path[bestIndex],
  };
}

export interface NearestDefect {
  defect: RoadDefect;
  /** Planar distance in WORLD UNITS — for picking the nearest, not display. */
  dist: number;
}

/**
 * How far apart two points on the corridor are, in metres of chainage.
 *
 * The 3D scene is a stylised miniature: the corridor spans 220 world units
 * while representing tens of kilometres, and the road is drawn about three
 * units wide while standing in for a seven-metre carriageway. Those two
 * implied scales do not agree, so a world-unit distance cannot honestly be
 * printed as metres. Distance along the road can: it comes from the fraction
 * along the path and the segment's documented length, which is the same basis
 * the drive HUD already reports chainage on.
 */
export function chainageMetresBetween(tA: number, tB: number, roadLengthKm: number): number {
  return Math.abs(tA - tB) * roadLengthKm * 1000;
}

/** Where the inspector is standing relative to the carriageway. */
export type WalkStance = "carriageway" | "shoulder" | "offCorridor";

export function stanceFor(distFromCentreline: number, roadWidth: number): WalkStance {
  if (distFromCentreline < roadWidth / 2) return "carriageway";
  if (distFromCentreline < roadWidth) return "shoulder";
  return "offCorridor";
}

/**
 * Where a defect sits in the world.
 *
 * Deliberately mirrors `DefectMarker` in `scene/defect-markers.tsx`, lateral
 * 0.85 factor included: if the proximity readout derived the position any
 * other way it would disagree with the marker the inspector is standing next
 * to, which is worse than having no readout.
 */
export function defectWorldPosition(defect: RoadDefect, path: RoadPoint[], roadWidth: number) {
  const p = pointOnRoad(path, defect.t);
  const len = Math.hypot(p.dx, p.dz) || 1;
  // Perpendicular to the tangent, in the ground plane.
  const px = -p.dz / len;
  const pz = p.dx / len;
  const lateral = defect.offset * (roadWidth / 2) * 0.85;
  return { x: p.x + px * lateral, y: p.y, z: p.z + pz * lateral };
}

/**
 * The defect closest to a position, with its distance.
 *
 * Defects are anchored by their fraction along the road plus a lateral offset,
 * so this resolves each one to a world position through the same path the
 * markers are drawn from — otherwise the readout and the marker disagree.
 */
export function nearestDefectTo(
  defects: RoadDefect[],
  path: RoadPoint[],
  roadWidth: number,
  x: number,
  z: number,
): NearestDefect | null {
  if (defects.length === 0 || path.length < 2) return null;
  let best: NearestDefect | null = null;

  for (const defect of defects) {
    const { x: wx, z: wz } = defectWorldPosition(defect, path, roadWidth);
    const dist = Math.hypot(wx - x, wz - z);
    if (!best || dist < best.dist) best = { defect, dist };
  }

  return best;
}
