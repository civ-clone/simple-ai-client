// Generic: how many defenders a city wants, judged the same way by city production and by the units deciding whether to
//  stay and fortify there. When the two disagreed, cities built a defender, it walked off, and they built another.
import { MartialLaw, Unhappiness } from '@civ-clone/library-city/Yields';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import { Fortifiable } from '@civ-clone/library-unit/Types';
import Knowledge from '../Knowledge';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

// The ruleset's part of martial law, units in a city keeping its unhappy citizens content (civ-clone/web-renderer#216).
//  `Civ1/martialLaw` has Civ1's.
export interface MartialLawPolicy {
  // How many units in `city` martial law can use at most under its player's government: 0 where there's none.
  limit(dependencies: Dependencies, city: City): number;
}

// How many units in `city` martial law would use: the ones the ruleset's rules use now, and one more for each citizen
//  still unhappy, up to the policy's limit. Making Entertainers doesn't change it, so it's the same whether or not the
//  city has made them yet. A citizen a unit keeps content leaves its tile worked, where an Entertainer gives it up.
export const martialLawUnitsWanted = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City
): number => {
  const limit = knowledge.martialLaw.limit(dependencies, city);

  if (limit <= 0) {
    return 0;
  }

  const yields: Yield[] = city.yields(),
    inUse = yields.filter(
      (cityYield: Yield): boolean => cityYield instanceof MartialLaw
    ).length,
    unhappy = Math.max(0, reduceYield(yields, Unhappiness));

  return Math.min(limit, inUse + unhappy);
};

// One defender, and one more for each five sizes over five, or as many units as martial law would use if that's more:
//  a defender keeps order as well as any unit.
export const defendersWanted = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City
): number =>
  Math.max(
    Math.ceil(dependencies.cityGrowthRegistry.getByCity(city).size() / 5),
    martialLawUnitsWanted(dependencies, knowledge, city)
  );

// A unit that could defend a city: not, say, Settlers or a ship.
export const isDefender = (unit: Unit): boolean =>
  unit instanceof Fortifiable && unit.defence().value() > 0;

// The units on the city's tile that could defend it, fortified or not.
export const defendersIn = (dependencies: Dependencies, city: City): Unit[] =>
  dependencies.unitRegistry.getByTile(city.tile()).filter(isDefender);
