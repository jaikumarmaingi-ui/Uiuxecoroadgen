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

// World layout (meters). Vehicle drives from START_Z toward negative Z and
// stops short of the flagged defect at DEFECT_Z.
export const START_Z = 34;
export const DEFECT_Z = -14;
export const APPROACH_RANGE = 16;
export const PARK_X = 1.4;
export const PARK_Z = DEFECT_Z + 7;
export const PARK_HEADING = 0.08;
export const ROAD_WIDTH = 6;
export const ROAD_HALF_DRIVABLE = ROAD_WIDTH / 2 - 0.7;
export const PIT_POSITION: [number, number, number] = [-4.4, 0, DEFECT_Z];

export function createInitialWorld(): WorldRefState {
  return {
    vehicle: { x: 0, z: START_Z, heading: 0, speed: 0 },
    character: { x: 0, z: PARK_Z, heading: 0 },
    parked: false,
  };
}
