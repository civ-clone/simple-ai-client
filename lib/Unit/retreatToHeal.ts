// Generic: a damaged unit rests to heal, where the ruleset deals damage (a unit has some: only a `CombatResolver`, a
//  Spy's sabotage and the like deal it, so no Civ1 unit ever comes here). Healing happens at the start of a turn for a
//  unit that didn't move in the last one, faster in a city, and fully in one with the facility for the unit's kind
//  (base-unit-healing, as Civ2 wires it): Barracks, Port Facility or Airport.
import { Air, Land, Naval } from '@civ-clone/library-unit/Types';
import Airbase from '@civ-clone/base-tile-improvement-airbase/Airbase';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Fortress from '@civ-clone/base-tile-improvement-fortress/Fortress';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import PortFacility from '@civ-clone/base-city-improvement-portfacility/PortFacility';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';
import { fuelFor } from './fuel';
import { travelToPathEnd } from './moveUnit';

// A unit with less than this share of its hit points left goes to heal.
export const RETREAT_BELOW = 1 / 2;

// How much nearer a city without the healing facility has to be to be chosen over one with it, in squares.
export const FACILITY_PREFERENCE = 3;

// The furthest a damaged unit goes to heal in a city, in squares: further away, it rests where it is.
export const RETREAT_RANGE = 8;

// The most cities a damaged unit looks for a way to, nearest first.
const PATHS_TRIED = 3;

// The facility that heals a unit of `unit`'s kind fully in a city.
export const healingFacilityFor = (unit: Unit): typeof CityImprovement | null =>
  unit instanceof Land
    ? Barracks
    : unit instanceof Naval
    ? PortFacility
    : unit instanceof Air
    ? Airport
    : null;

const cityHas = (
  dependencies: Dependencies,
  city: City,
  Improvement: typeof CityImprovement
): boolean =>
  dependencies.cityImprovementRegistry
    .getByCity(city)
    .some(
      (improvement: CityImprovement): boolean =>
        improvement instanceof Improvement
    );

// Whether `unit` rests where it is to heal: in one of its player's cities, on a Fortress, or, an aircraft, on an
//  Airbase.
export const restsHere = (dependencies: Dependencies, unit: Unit): boolean =>
  dependencies.cityRegistry.getByTile(unit.tile())?.player() ===
    unit.player() ||
  dependencies.tileImprovementRegistry
    .getByTile(unit.tile())
    .some(
      (improvement: TileImprovement): boolean =>
        improvement instanceof Fortress ||
        (unit instanceof Air && improvement instanceof Airbase)
    );

// Whether `unit` is damaged enough to go and heal: below `RETREAT_BELOW` of its hit points. Asks for its hit points only
//  once it has some damage, so an undamaged unit costs nothing.
export const needsHealing = (unit: Unit): boolean => {
  if (unit.damage() <= 0) {
    return false;
  }

  const [remaining, maximum] = unit.hitPoints();

  return remaining < maximum * RETREAT_BELOW;
};

// Whether `unit` heals this turn rather than doing anything else: a damaged unit in one of its player's cities or on a
//  Fortress (an aircraft also on an Airbase) stays until it's whole; one elsewhere goes once it's below
//  `RETREAT_BELOW`. An aircraft with fuel heals where it lands, as its fuel brings it back, and a land unit at sea is a
//  passenger, so neither turns back here; an aircraft with none (Civ2's Helicopter, which loses hit points outside a
//  city or airbase) does.
export const healsThisTurn = (
  dependencies: Dependencies,
  unit: Unit
): boolean =>
  unit.damage() > 0 &&
  !(unit instanceof Land && unit.tile().isWater()) &&
  (restsHere(dependencies, unit) ||
    (fuelFor(dependencies, unit) === null && needsHealing(unit)));

// The player's cities `unit` could heal in, best first: the nearest, counting one with the facility for its kind
//  `FACILITY_PREFERENCE` squares nearer, up to `RETREAT_RANGE` away. A ship only looks at coastal cities.
export const healingCities = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
): City[] => {
  const Facility = healingFacilityFor(unit),
    distance = (city: City): number =>
      unit.tile().distanceFrom(city.tile()) -
      (Facility !== null && cityHas(dependencies, city, Facility)
        ? FACILITY_PREFERENCE
        : 0);

  return dependencies.cityRegistry
    .getByPlayer(player)
    .filter(
      (city: City): boolean =>
        unit.tile().distanceFrom(city.tile()) <= RETREAT_RANGE &&
        (!(unit instanceof Naval) || city.tile().isCoast())
    )
    .sort((a: City, b: City): number => distance(a) - distance(b));
};

// A damaged unit's turn: in one of its player's cities or on a Fortress it stands where it is (no orders, so it doesn't
//  count as having moved and heals next turn); elsewhere it heads for the best city it has a way to
//  (`healingCities`), and stands where it is if there's none. It never leaves a city, so it can't strip a city of its
//  last defender to heal. Returns whether it handled the unit.
export const retreatToHeal = async (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit
): Promise<boolean> => {
  if (!healsThisTurn(dependencies, unit)) {
    return false;
  }

  if (restsHere(dependencies, unit)) {
    memory.unitPathData.delete(unit);
    noOrders(dependencies, unit);

    return true;
  }

  const goingTo = memory.unitPathData.get(unit)?.end() ?? null,
    cities = healingCities(dependencies, player, unit);

  if (
    goingTo === null ||
    !cities.some((city: City): boolean => city.tile() === goingTo)
  ) {
    memory.unitPathData.delete(unit);

    for (const city of cities.slice(0, PATHS_TRIED)) {
      const path = Path.for(
        unit,
        unit.tile(),
        city.tile(),
        dependencies.pathFinderRegistry
      );

      if (path) {
        memory.unitPathData.set(unit, path);

        break;
      }
    }
  }

  if (memory.unitPathData.has(unit)) {
    await travelToPathEnd(dependencies, player, memory, knowledge, unit);
  }

  if (unit.active() && !unit.destroyed()) {
    noOrders(dependencies, unit);
  }

  return true;
};

export default retreatToHeal;
