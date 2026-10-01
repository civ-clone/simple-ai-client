// Generic: one player's working memory, the targets found each turn and what each of its units is doing.
import City from '@civ-clone/core-city/City';
import Path from '@civ-clone/core-world-path/Path';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { UncalmedReason } from './City/disorder';

// Refilled by the survey at the start of each turn, which empties each list in place. Mission assignment sorts them in
//  place and takes from them, city production reads them, and `cityLost` adds to them during other players' turns, so
//  the same arrays live as long as the client does.
// TODO: could be `City`/`Unit`s?
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
  // The cities the end of the player's last turn left in civil disorder, and why (`lib/City/disorder`). Refilled then,
  //  so it's empty until the player's first turn ends.
  uncalmedCities: Map<City, UncalmedReason>;
  unitPathData: Map<Unit, Path>;
  unitTargetData: Map<Unit, Tile>;
}

// The tiles some unit of the player's is already heading for: its target, or where its path ends.
export const claimedTiles = (memory: Memory): Set<Tile> =>
  new Set<Tile>([
    ...memory.unitTargetData.values(),
    ...[...memory.unitPathData.values()].map((path: Path): Tile => path.end()),
  ]);

// Drops everything remembered about `unit`.
export const forgetUnit = (memory: Memory, unit: Unit): void => {
  memory.lastUnitMoves.delete(unit);
  memory.unitPathData.delete(unit);
  memory.unitTargetData.delete(unit);
};

// Drops what's remembered about units that have since been destroyed, however that happened (in combat, founding a
//  city, disbanded, lost at sea), so the maps don't grow for ever and a dead unit's path or target claims no tile.
export const forgetDestroyedUnits = (memory: Memory): void =>
  [memory.lastUnitMoves, memory.unitTargetData, memory.unitPathData].forEach(
    (map: Map<Unit, unknown>): void =>
      [...map.keys()]
        .filter((unit: Unit): boolean => unit.destroyed())
        .forEach((unit: Unit): boolean => map.delete(unit))
  );

export const createMemory = (): Memory => ({
  lastUnitMoves: new Map(),
  targets: {
    citiesToLiberate: [],
    enemyCitiesToAttack: [],
    enemyUnitsToAttack: [],
    goodSitesForCities: [],
    landTilesToExplore: [],
    seaTilesToExplore: [],
    undefendedCities: [],
  },
  uncalmedCities: new Map(),
  unitPathData: new Map(),
  unitTargetData: new Map(),
});

export default Memory;
