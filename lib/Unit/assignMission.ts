// Generic: gives a unit with no target a path to the first mission it qualifies for, taking that target off the board.
import { Fortifiable, Land, Naval } from '@civ-clone/library-unit/Types';
import Dependencies from '../Dependencies';
import Memory from '../Memory';
import Path from '@civ-clone/core-world-path/Path';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// Returns whether `unit` qualifies. One that does takes the nearest target, and no later mission is tried even when
//  there's no path to it.
export type Mission = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
) => boolean;

const nearest =
  (unit: Unit) =>
  (a: Tile, b: Tile): number =>
    a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile());

// `ranked` is sometimes `list` itself, sorted in place, and sometimes a sorted copy of part of it.
const pursue = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit,
  list: Tile[],
  [targetTile]: Tile[]
): void => {
  // Nothing to head for, or already there: a search would find nothing worth following.
  if (!targetTile || targetTile === unit.tile()) {
    return;
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
  }
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

  pursue(
    dependencies,
    memory,
    unit,
    undefendedCities,
    undefendedCities.sort(nearest(unit))
  );

  return true;
};

export const liberateCity: Mission = (dependencies, memory, unit) => {
  const { citiesToLiberate } = memory.targets;

  if (!(unit.attack().value() > 0 && citiesToLiberate.length > 0)) {
    return false;
  }

  pursue(
    dependencies,
    memory,
    unit,
    citiesToLiberate,
    citiesToLiberate
      .filter((tile: Tile): boolean => unit instanceof Land && tile.isLand())
      .sort(nearest(unit))
  );

  return true;
};

export const attackEnemyUnits: Mission = (dependencies, memory, unit) => {
  const { enemyUnitsToAttack } = memory.targets;

  if (!(unit.attack().value() > 0 && enemyUnitsToAttack.length > 0)) {
    return false;
  }

  const reachable = enemyUnitsToAttack.filter(
    (tile: Tile): boolean =>
      (unit instanceof Land && tile.isLand()) ||
      (unit instanceof Naval && tile.isWater())
  );

  // Enemy units only on terrain this unit can't cross leave it free for the missions after this one, such as a ship
  //  exploring by sea.
  if (reachable.length === 0) {
    return false;
  }

  pursue(
    dependencies,
    memory,
    unit,
    enemyUnitsToAttack,
    reachable.sort(nearest(unit))
  );

  return true;
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

  pursue(
    dependencies,
    memory,
    unit,
    enemyCitiesToAttack,
    enemyCitiesToAttack.sort(nearest(unit))
  );

  return true;
};

export const exploreLand: Mission = (dependencies, memory, unit) => {
  const { landTilesToExplore } = memory.targets;

  if (!(unit instanceof Land && landTilesToExplore.length > 0)) {
    return false;
  }

  pursue(
    dependencies,
    memory,
    unit,
    landTilesToExplore,
    landTilesToExplore.sort(nearest(unit))
  );

  return true;
};

export const exploreSea: Mission = (dependencies, memory, unit) => {
  const { seaTilesToExplore } = memory.targets;

  if (!(unit instanceof Naval && seaTilesToExplore.length > 0)) {
    return false;
  }

  pursue(
    dependencies,
    memory,
    unit,
    seaTilesToExplore,
    seaTilesToExplore.sort(nearest(unit))
  );

  return true;
};

// In priority order. Hunting enemy units comes after exploring land: ahead of it (as it was written, when the list was
//  always empty), units chase enemies instead of exploring, and the AI explores and researches measurably less.
export const missions: Mission[] = [
  defendUndefendedCity,
  liberateCity,
  attackEnemyCity,
  exploreLand,
  attackEnemyUnits,
  exploreSea,
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
