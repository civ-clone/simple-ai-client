// Martial law. Where the rule set numbers its governments' martial law (base-government-terms' `GovernmentTerms`, as
//  Civ2's do: 2 citizens a unit under Communism), the most units it uses and the citizens each keeps content are
//  those. Otherwise Civ1's, as `civ1-city-happiness` has it (its `martialLaw.ts`, v474.05's): under Anarchy, Communism,
//  Despotism or Monarchy, each unit in a city that can attack keeps one of its unhappy citizens content, up to three,
//  once the city's improvements and Wonders have calmed what they can. Which units it uses, and how many citizens are
//  unhappy, are asked of its rules (`City/defence`).
import {
  martialLawGovernments,
  martialLawUnitLimit,
} from '@civ-clone/civ1-city-happiness/martialLaw';
import { Attack } from '@civ-clone/core-unit/Yields';
import { MartialLawPolicyWithPerUnit } from '../City/defence';
import baseYieldOf from '../Unit/unitType';
import { cityGovernmentTerm } from '../Government/terms';

export const civ1MartialLawPolicy: MartialLawPolicyWithPerUnit = {
  limit: (dependencies, city) => {
    const terms = cityGovernmentTerm(dependencies, city, 'martialLaw');

    if (terms !== undefined) {
      return terms.maximumUnits;
    }

    return dependencies.playerGovernmentRegistry
      .getByPlayer(city.player())
      .is(...martialLawGovernments)
      ? martialLawUnitLimit
      : 0;
  },
  perUnit: (dependencies, city) =>
    cityGovernmentTerm(dependencies, city, 'martialLaw')?.perUnit ?? 1,
  // As `civ1-city-happiness`'s `keepsMartialLaw` judges a unit: any whose attack isn't 0. Civ2's
  //  (base-government-martial-law's `hasAttack`) is the same.
  wouldUse: (dependencies, UnitType) =>
    baseYieldOf(dependencies, UnitType, Attack) > 0,
};

export default civ1MartialLawPolicy;
