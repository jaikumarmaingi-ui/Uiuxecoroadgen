import { ROAD_START_Z, ROAD_WIDTH_M } from "@/lib/inspection-3d/terrain";
import type { CorridorDefect } from "@/lib/inspection-3d/corridor-defects";

export type FlowState =
  | "intro"
  | "driving"
  | "approaching"
  | "parked"
  | "onfoot"
  | "inspecting"
  | "exploded"
  | "analyzing"
  | "results";

export interface VehicleState {
  x: number;
  z: number;
  heading: number;
  speed: number;
}

export interface CharacterState {
  x: number;
  z: number;
  heading: number;
}

export interface WorldRefState {
  vehicle: VehicleState;
  character: CharacterState;
  parked: boolean;
}

/** Where the vehicle starts, a little way down the corridor from its head. */
export const START_Z = ROAD_START_Z - 24;
/** How far out a flagged defect starts prompting the driver. */
export const APPROACH_RANGE = 34;
export const ROAD_HALF_DRIVABLE = ROAD_WIDTH_M / 2 - 0.75;

/** Half the side of the square trial-pit opening. */
export const PIT_HALF = 1.38;

/** Where the vehicle pulls up relative to the defect it is inspecting. */
export const PARK_OFFSET_Z = 7;
export const PARK_HEADING = 0.08;

export function createInitialWorld(): WorldRefState {
  return {
    vehicle: { x: 0, z: START_Z, heading: 0, speed: 0 },
    character: { x: 0, z: START_Z, heading: 0 },
    parked: false,
  };
}

/**
 * Where the vehicle parks for a given defect.
 *
 * Opposite side of the centreline from the failure, so the vehicle is not
 * standing on the thing being inspected, and short of it so the engineer walks
 * the last few metres.
 */
export function parkSpotFor(defect: CorridorDefect) {
  const side = defect.x >= 0 ? -1 : 1;
  return {
    x: side * (ROAD_WIDTH_M / 2 - 1.5),
    z: defect.z + PARK_OFFSET_Z,
  };
}

/** Bounds the inspector may walk within, around the defect under inspection. */
export function walkBoundsFor(defect: CorridorDefect) {
  return {
    minX: -7,
    maxX: 7,
    minZ: defect.z - 11,
    maxZ: defect.z + 13,
  };
}
