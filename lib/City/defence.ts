// Generic: how many defenders a city wants, judged the same way by city production and by the units deciding whether to
//  stay and fortify there. When the two disagreed, cities built a defender, it walked off, and they built another.
import { MartialLaw, Unhappiness } from '@civ-clone/library-city/Yields';
import City from '@civ-clone/core-city/City';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Dependencies from '../Dependencies';
import { Fortifiable } from '@civ-clone/library-unit/Types';
import Knowledge from '../Knowledge';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';

// The ruleset's part of martial law, units in a city keeping its unhappy citizens content (civ-clone/web-renderer#216).
//  `Civ1/martialLaw` has Civ1's.
export interface MartialLawPolicy {
  // How many units in `city` martial law can use at most under its player's government: 0 where there's none.
  limit(dependencies: Dependencies, city: City): number;
}

// More unhappy citizens than any city has, for `calmedWithoutMartialLaw`.
const CROWD = 100;

// The unhappiness in `yields` before anything calms it (`positive`), and how much of it anything but martial law calms
//  (`other`): Temples and the like (`CityImprovementContent`), and Wonders, which give a plain negative `Unhappiness`.
const unhappiness = (yields: Yield[]): { positive: number; other: number } =>
  yields
    .filter((cityYield: Yield): boolean => cityYield instanceof Unhappiness)
    .reduce(
      (totals, cityYield: Yield) => {
        const value = cityYield.value();

        if (value > 0) {
          totals.positive += value;
        } else if (!(cityYield instanceof MartialLaw)) {
          totals.other -= value;
        }

        return totals;
      },
      { positive: 0, other: 0 }
    );

// How many unhappy citizens `city`'s improvements, Wonders and anything else but martial law can make content, by the
//  ruleset's own `Cost` rules, run as `City#yields` runs them but over nothing but a crowd of unhappy citizens. They
//  only say what they can do when they have someone to calm: in a city where martial law, which the engine applies
//  first, has calmed everyone, they say nothing.
const calmedWithoutMartialLaw = (
  dependencies: Dependencies,
  city: City
): number => {
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

  return unhappiness(yields).other;
};

// How many units in `city` martial law would use: one for each citizen unhappy before anything calms them, less those
//  its improvements, Wonders and the rest can calm, up to the policy's limit. Those counts are the ruleset's rules' own,
//  so they're the same whether or not the city has made Entertainers yet, and whatever order the rules apply in. A
//  citizen a unit keeps content leaves its tile worked, where an Entertainer gives it up.
export const martialLawUnitsWanted = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City
): number => {
  const limit = knowledge.martialLaw.limit(dependencies, city);

  if (limit <= 0) {
    return 0;
  }

  return Math.min(
    limit,
    Math.max(
      0,
      unhappiness(city.yields()).positive -
        calmedWithoutMartialLaw(dependencies, city)
    )
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
