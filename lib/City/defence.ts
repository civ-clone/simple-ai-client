// Generic: how many defenders a city wants, judged the same way by city production and by the units deciding whether to
//  stay and fortify there. When the two disagreed, cities built a defender, it walked off, and they built another.
import {
  CityImprovementContent,
  MartialLaw,
  Unhappiness,
} from '@civ-clone/library-city/Yields';
import City from '@civ-clone/core-city/City';
import Cost from '@civ-clone/core-city/Rules/Cost';
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

// More unhappy citizens than any city has, for `improvementContent`.
const CROWD = 100;

// How many unhappy citizens the yields of `YieldType` keep content: `MartialLaw`, say.
const contentFrom = (yields: Yield[], YieldType: Function): number =>
  yields
    .filter((cityYield: Yield): boolean => cityYield instanceof YieldType)
    .reduce(
      (total: number, cityYield: Yield): number =>
        total + Math.abs(cityYield.value()),
      0
    );

// How many unhappy citizens `city`'s improvements can make content, by the ruleset's own `Cost` rules, run as
//  `City#yields` runs them but over nothing but a crowd of unhappy citizens. An improvement only says what it can do
//  when it has someone to calm: in a city where martial law (or anything that comes before it) has calmed everyone,
//  it says nothing.
const improvementContent = (dependencies: Dependencies, city: City): number => {
  const yields: Yield[] = [new Unhappiness(CROWD)];

  dependencies.ruleRegistry.get(Cost).forEach((rule: Cost): void => {
    if (!rule.validate(city, yields)) {
      return;
    }

    const costs = rule.process(city, yields);

    if (costs) {
      yields.push(...(costs instanceof Yield ? [costs] : costs));
    }
  });

  return contentFrom(yields, CityImprovementContent);
};

// How many units in `city` martial law would use: one for each citizen unhappy before martial law or the city's
//  improvements calm them, less those the improvements can calm, up to the policy's limit. Those counts are the
//  ruleset's rules' own, so they're the same whether or not the city has made Entertainers yet, and whichever of martial
//  law and the improvements its rules apply first. A citizen a unit keeps content leaves its tile worked, where an
//  Entertainer gives it up.
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
    unhappy =
      reduceYield(yields, Unhappiness) +
      contentFrom(yields, MartialLaw) +
      contentFrom(yields, CityImprovementContent);

  return Math.min(
    limit,
    Math.max(0, unhappy - improvementContent(dependencies, city))
  );
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
