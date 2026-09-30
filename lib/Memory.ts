// Generic: one player's working memory, the targets found each turn and what each of its units is doing.
import Path from '@civ-clone/core-world-path/Path';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

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
  unitPathData: Map<Unit, Path>;
  unitTargetData: Map<Unit, Tile>;
}

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
  unitPathData: new Map(),
  unitTargetData: new Map(),
});

export default Memory;
