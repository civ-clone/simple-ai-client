import Path from '@civ-clone/core-world-path/Path';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export interface TargetBoard {
  citiesToLiberate: Tile[];
  enemyCitiesToAttack: Tile[];
  enemyUnitsToAttack: Tile[];
  goodSitesForCities: Tile[];
  landTilesToExplore: Tile[];
  seaTilesToExplore: Tile[];
  undefendedCities: Tile[];
}
export interface Memory {
  lastUnitMoves: Map<Unit, Tile[]>;
  targets: TargetBoard;
  unitPathData: Map<Unit, Path>;
  unitTargetData: Map<Unit, Tile>;
}
export declare const claimedTiles: (memory: Memory) => Set<Tile>;
export declare const forgetUnit: (memory: Memory, unit: Unit) => void;
export declare const forgetDestroyedUnits: (memory: Memory) => void;
export declare const createMemory: () => Memory;
export default Memory;
