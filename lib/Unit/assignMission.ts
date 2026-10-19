// Generic: gives a unit with no target a path to the first mission it qualifies for, taking that target off the board.
import { Fortifiable, Land, Naval } from '@civ-clone/library-unit/Types';
import {
  Mission,
  nearest,
  pursue,
} from '@civ-clone/base-strategy-ai/lib/Unit/mission';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import {
  exploreLand,
  exploreSea,
} from '@civ-clone/base-strategy-explore/lib/Unit/explore';
import { isFounder, planInvasion, planPassenger, travel } from './overseas';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

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

// With nothing left to explore on its own landmass, a land unit that can fight goes to explore another, by sea
//  (`lib/Unit/overseas`, civ-clone/web-renderer#211): first to its port, where `TravelOverseas` takes over.
export const goOverseas: Mission = (dependencies, memory, unit) => {
  if (!(unit instanceof Land && unit.attack().value() > 0) || isFounder(unit)) {
    return false;
  }

  const player = unit.player(),
    passenger = planPassenger(
      dependencies,
      player,
      memory,
      unit,
      'explorer',
      memory.targets.landTilesToExplore
    );

  if (!passenger) {
    return false;
  }

  travel(dependencies, player, memory, unit, passenger);

  return true;
};

// With no enemy city it can reach and nothing to explore on its own landmass, an attacker goes for an enemy city
//  overseas it's strong enough to take on (`lib/Unit/overseas`, civ-clone/web-renderer#374): first to its port.
export const invadeOverseas: Mission = (dependencies, memory, unit) => {
  const player = unit.player(),
    passenger = planInvasion(dependencies, player, memory, unit);

  if (!passenger) {
    return false;
  }

  travel(dependencies, player, memory, unit, passenger);

  return true;
};

// In priority order. Hunting enemy units comes after exploring, by land or by sea: ahead of it (as it was written, when
//  the list was always empty), units chase enemies instead of exploring, and the AI explores and researches measurably
//  less, and ships built to explore are sunk hunting other ships.
export type { Mission };
export { exploreLand, exploreSea };

export const missions: Mission[] = [
  defendUndefendedCity,
  liberateCity,
  attackEnemyCity,
  exploreLand,
  invadeOverseas,
  goOverseas,
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
