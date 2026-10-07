import City from '@civ-clone/core-city/City';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { UncalmedReason } from './City/disorder';
export interface TargetBoard {
  citiesToLiberate: Tile[];
  enemyCitiesToAttack: Tile[];
  enemyUnitsToAttack: Tile[];
  goodSitesForCities: Tile[];
  landTilesToExplore: Tile[];
  seaTilesToExplore: Tile[];
  undefendedCities: Tile[];
}
export interface PowerCache {
  turn: number | null;
  byPlayer: Map<Player, number>;
}
export interface Memory {
  lastUnitMoves: Map<Unit, Tile[]>;
  power: PowerCache;
  surveyedTurn: number | null;
  targets: TargetBoard;
  uncalmedCities: Map<City, UncalmedReason>;
  unitPathData: Map<Unit, Path>;
  unitTargetData: Map<Unit, Tile>;
}
export declare const claimedTiles: (memory: Memory) => Set<Tile>;
export declare const forgetUnit: (memory: Memory, unit: Unit) => void;
export declare const forgetDestroyedUnits: (memory: Memory) => void;
export declare const createMemory: () => Memory;
export default Memory;
