// Generic: gives a unit with no target a path to the first mission it qualifies for, taking that target off the board.
import { Fortifiable, Land, Naval } from '@civ-clone/library-unit/Types';
import Dependencies from '../Dependencies';
import Memory from '../Memory';
import Path from '@civ-clone/core-world-path/Path';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import reachableTiles from './reachable';

// Returns whether `unit` took the mission: it qualifies and has a path to one of the mission's targets, the nearest
//  it can reach. Otherwise the next mission is tried.
export type Mission = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
) => boolean;

const nearest =
  (unit: Unit) =>
  (a: Tile, b: Tile): number =>
    a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile());

// Sets `unit` off for the first target in `ranked` it has a path to, and takes that target off `list`. Returns whether
//  there was one. `ranked` is sometimes `list` itself, sorted in place, and sometimes a sorted copy of part of it.
const pursue = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit,
  list: Tile[],
  ranked: Tile[]
): boolean => {
  // Only worked out if there's a target to check.
  let reachable: Set<Tile> | null | undefined;

  for (const targetTile of ranked) {
    // Already there: a search would find nothing worth following.
    if (targetTile === unit.tile()) {
      continue;
    }

    if (reachable === undefined) {
      reachable = reachableTiles(unit);
    }

    // Out of reach: a search would cover everywhere the unit can go and find nothing.
    if (reachable !== null && !reachable.has(targetTile)) {
      continue;
    }

    const path = Path.for(
      unit,
      unit.tile(),
      targetTile,
      dependencies.pathFinderRegistry
    );

    if (path) {
      list.splice(list.indexOf(targetTile), 1);
      memory.unitPathData.set(unit, path);

      return true;
    }
  }

  return false;
};

export const defendUndefendedCity: Mission = (dependencies, memory, unit) => {
  const { undefendedCities } = memory.targets;

  if (
    !(
      unit instanceof Fortifiable &&
      unit.defence().value() > 0 &&
      undefendedCities.length > 0
    )
  ) {
    return false;
  }

  return pursue(
    dependencies,
    memory,
    unit,
    undefendedCities,
    undefendedCities.sort(nearest(unit))
  );
};

export const liberateCity: Mission = (dependencies, memory, unit) => {
  const { citiesToLiberate } = memory.targets;

  if (!(unit.attack().value() > 0 && citiesToLiberate.length > 0)) {
    return false;
  }

  return pursue(
    dependencies,
    memory,
    unit,
    citiesToLiberate,
    citiesToLiberate
      .filter((tile: Tile): boolean => unit instanceof Land && tile.isLand())
      .sort(nearest(unit))
  );
};

export const attackEnemyUnits: Mission = (dependencies, memory, unit) => {
  const { enemyUnitsToAttack } = memory.targets;

  if (!(unit.attack().value() > 0 && enemyUnitsToAttack.length > 0)) {
    return false;
  }

  // Only enemies on terrain this unit can cross: with none, or none it has a path to, it's free for the missions
  //  after this one, such as a ship exploring by sea.
  return pursue(
    dependencies,
    memory,
    unit,
    enemyUnitsToAttack,
    enemyUnitsToAttack
      .filter(
        (tile: Tile): boolean =>
          (unit instanceof Land && tile.isLand()) ||
          (unit instanceof Naval && tile.isWater())
      )
      .sort(nearest(unit))
  );
};

export const attackEnemyCity: Mission = (dependencies, memory, unit) => {
  const { enemyCitiesToAttack } = memory.targets;

  if (
    !(
      unit instanceof Land &&
      unit.attack().value() > 0 &&
      enemyCitiesToAttack.length > 0
    )
  ) {
    return false;
  }

  return pursue(
    dependencies,
    memory,
    unit,
    enemyCitiesToAttack,
    enemyCitiesToAttack.sort(nearest(unit))
  );
};

export const exploreLand: Mission = (dependencies, memory, unit) => {
  const { landTilesToExplore } = memory.targets;

  if (!(unit instanceof Land && landTilesToExplore.length > 0)) {
    return false;
  }

  return pursue(
    dependencies,
    memory,
    unit,
    landTilesToExplore,
    landTilesToExplore.sort(nearest(unit))
  );
};

export const exploreSea: Mission = (dependencies, memory, unit) => {
  const { seaTilesToExplore } = memory.targets;

  if (!(unit instanceof Naval && seaTilesToExplore.length > 0)) {
    return false;
  }

  return pursue(
    dependencies,
    memory,
    unit,
    seaTilesToExplore,
    seaTilesToExplore.sort(nearest(unit))
  );
};

// In priority order. Hunting enemy units comes after exploring, by land or by sea: ahead of it (as it was written, when
//  the list was always empty), units chase enemies instead of exploring, and the AI explores and researches measurably
//  less, and ships built to explore are sunk hunting other ships.
export const missions: Mission[] = [
  defendUndefendedCity,
  liberateCity,
  attackEnemyCity,
  exploreLand,
  exploreSea,
  attackEnemyUnits,
];

export const assignMission = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
): void => {
  missions.some((mission: Mission): boolean =>
    mission(dependencies, memory, unit)
  );
};

export default assignMission;
