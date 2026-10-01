// Generic: what a unit with nothing to do does, in place of walking back and forth for ever (civ-clone/web-renderer#230).
//  In order:
//  1. a unit that could defend a city goes to the nearest of the player's cities it can reach that still wants a unit
//     in it, to defend it or for martial law to use, counting the units already on their way there;
//  2. failing that, it's disbanded, if the ruleset's policy finds it costs more than it's worth;
//  3. otherwise it waits in the player's city it's in, ready for a mission when one comes up;
//  4. or heads for the nearest of the player's cities it can reach, a ship for the sea beside one and then into it;
//  5. or, with none it can reach, stays where it is, fortified if it can be.
import { defendersIn, defendersWanted, isDefender } from '../City/defence';
import { martialLawUnitsIn, martialLawUnitsWanted } from '../City/defence';
import { ActionLookup } from '../actionLookup';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import { Land } from '@civ-clone/library-unit/Types';
import Memory from '../Memory';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import moveUnit from './moveUnit';
import { noOrders } from './orders';
import reachableTiles from './reachable';

// The ruleset's part: when a unit is worth keeping. `Civ1/standDown` has Civ1's.
export interface StandDownPolicy {
  // Whether `unit`, with nothing to do and no city wanting it, should be disbanded rather than kept.
  disband(dependencies: Dependencies, unit: Unit): boolean;
}

// How many of the cities nearest a unit it looks for a path to, nearest first, before giving up on the rest.
const CITIES_TRIED = 3;

// How many more units `city` wants in it: defenders, or units for martial law to use, whichever it's shorter of.
export const unitsWanted = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City
): number =>
  Math.max(
    0,
    defendersWanted(dependencies, city) -
      defendersIn(dependencies, city).length,
    martialLawUnitsWanted(dependencies, knowledge, city) -
      martialLawUnitsIn(city).length
  );

// How many of the player's units that could defend a city are on their way to `tile`: a ship going into port, say,
//  doesn't make up for a defender the city is short of.
const defendersHeadingFor = (memory: Memory, tile: Tile): number =>
  [...memory.unitPathData.entries()].filter(
    ([unit, path]: [Unit, Path]): boolean =>
      path.end() === tile && isDefender(unit)
  ).length;

// The player's cities other than the one the unit is in, that it could reach, nearest first.
const citiesInReach = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): City[] => {
  const reachable = reachableTiles(unit),
    inReach = (city: City): boolean =>
      reachable === null ||
      (unit instanceof Land
        ? reachable.has(city.tile())
        : city
            .tile()
            .getNeighbours()
            .some((tile: Tile): boolean => reachable.has(tile)));

  return dependencies.cityRegistry
    .getByPlayer(player)
    .filter(
      (city: City): boolean => city.tile() !== unit.tile() && inReach(city)
    )
    .sort(
      (a: City, b: City): number =>
        a.tile().distanceFrom(unit.tile()) - b.tile().distanceFrom(unit.tile())
    );
};

// A path for `unit` into `city`: straight there by land, or for a ship to the sea beside it and then in.
const pathInto = (
  dependencies: Dependencies,
  unit: Unit,
  city: City
): Path | null => {
  if (unit instanceof Land) {
    return (
      Path.for(
        unit,
        unit.tile(),
        city.tile(),
        dependencies.pathFinderRegistry
      ) ?? null
    );
  }

  const reachable = reachableTiles(unit),
    [beside] = city
      .tile()
      .getNeighbours()
      .filter(
        (tile: Tile): boolean =>
          tile.isWater() && (reachable === null || reachable.has(tile))
      )
      .sort(
        (a: Tile, b: Tile): number =>
          a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile())
      );

  if (!beside) {
    return null;
  }

  if (beside === unit.tile()) {
    const path = new Path();

    path.push(city.tile());

    return path;
  }

  const path = Path.for(
    unit,
    unit.tile(),
    beside,
    dependencies.pathFinderRegistry
  );

  if (!path) {
    return null;
  }

  path.push(city.tile());

  return path;
};

// The first of `cities` that `wanted` accepts and the unit has a path into, with the path.
const firstPath = (
  dependencies: Dependencies,
  unit: Unit,
  cities: City[],
  wanted: (city: City) => boolean
): Path | null => {
  let tried = 0;

  for (const city of cities) {
    if (tried >= CITIES_TRIED) {
      break;
    }

    if (!wanted(city)) {
      continue;
    }

    tried++;

    const path = pathInto(dependencies, unit, city);

    if (path) {
      return path;
    }
  }

  return null;
};

const stay = (
  dependencies: Dependencies,
  unit: Unit,
  { fortify }: ActionLookup
): void => {
  if (fortify) {
    unit.action(fortify);

    return;
  }

  noOrders(dependencies, unit);
};

export const standDown = async (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  policy: StandDownPolicy,
  unit: Unit,
  actions: ActionLookup
): Promise<void> => {
  // Along `path`, and no further: arrived with moves to spare, it waits there for `Garrison` or this to decide next
  //  turn, rather than take a step towards anything it passes.
  const go = async (path: Path): Promise<void> => {
    memory.unitPathData.set(unit, path);

    await moveUnit(dependencies, player, memory, knowledge, unit, {
      stopAtPathEnd: true,
      wander: false,
    });

    if (unit.active() && unit.moves().value() >= 0.1) {
      noOrders(dependencies, unit);
    }
  };

  // Worked out only if there's a city to look for.
  let cities: City[] | undefined;

  const reachableCities = (): City[] =>
    (cities ??= citiesInReach(dependencies, player, unit));

  if (isDefender(unit) && unit instanceof Land) {
    const path = firstPath(
      dependencies,
      unit,
      reachableCities(),
      (city: City): boolean =>
        unitsWanted(dependencies, knowledge, city) >
        defendersHeadingFor(memory, city.tile())
    );

    if (path) {
      await go(path);

      return;
    }
  }

  if (actions.disband && policy.disband(dependencies, unit)) {
    unit.action(actions.disband);

    return;
  }

  // Not fortified: the city has the defenders it wants, so this one waits, ready for a mission when one comes up. A
  //  fortified unit stays fortified for good.
  if (dependencies.cityRegistry.getByTile(unit.tile())?.player() === player) {
    noOrders(dependencies, unit);

    return;
  }

  const path = firstPath(dependencies, unit, reachableCities(), () => true);

  if (path) {
    await go(path);

    return;
  }

  stay(dependencies, unit, actions);
};

export default standDown;
