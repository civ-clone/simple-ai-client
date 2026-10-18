import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export type Role = 'explorer' | 'founder' | 'escort';
export interface Passenger {
  target: Tile;
  role: Role;
  port: City;
  since: number | null;
}
interface OverseasState {
  passengers: Map<Unit, Passenger>;
  origins: Map<Unit, Set<Tile>>;
}
export declare const overseasStateFor: (memory: Memory) => OverseasState;
export declare const ESCORT_WAIT = 3;
export declare const canFerryFrom: (
  dependencies: Dependencies,
  player: Player,
  port: City
) => boolean;
export declare const planPassenger: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  role: Role,
  candidates: Tile[]
) => Passenger | null;
export declare const dropPassenger: (memory: Memory, unit: Unit) => void;
export declare const travel: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  unit: Unit,
  passenger: Passenger
) => boolean;
export declare const waitingAt: (
  memory: Memory,
  port: City
) => [Unit, Passenger][];
export declare const isFounder: (unit: Unit) => boolean;
export declare const isPassenger: (memory: Memory, unit: Unit) => boolean;
export declare const originOf: (memory: Memory, unit: Unit) => Set<Tile> | null;
export declare const candidatesFor: (
  memory: Memory,
  unit: Unit,
  role: Role
) => Tile[];
export declare const planEscort: (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
) => Passenger | null;
export declare const canFerryFromLandmassOf: (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
) => boolean;
export {};
