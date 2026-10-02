// Civ1: martial law, as `civ1-city-happiness` has it (its `martialLaw.ts`, v474.05's): under Anarchy, Communism,
//  Despotism or Monarchy, each unit in a city that can attack keeps one of its unhappy citizens content, up to three,
//  once the city's improvements and Wonders have calmed what they can. The governments and the cap are the engine's
//  own; which units it uses, and how many citizens are unhappy, are asked of its rules (`City/defence`).
import {
  martialLawGovernments,
  martialLawUnitLimit,
} from '@civ-clone/civ1-city-happiness/martialLaw';
import { Attack } from '@civ-clone/core-unit/Yields';
import { MartialLawPolicy } from '../City/defence';
import baseYieldOf from '../Unit/unitType';

export const civ1MartialLawPolicy: MartialLawPolicy = {
  limit: (dependencies, city) =>
    dependencies.playerGovernmentRegistry
      .getByPlayer(city.player())
      .is(...martialLawGovernments)
      ? martialLawUnitLimit
      : 0,
  // As `civ1-city-happiness`'s `keepsMartialLaw` judges a unit: any whose attack isn't 0.
  wouldUse: (dependencies, UnitType) =>
    baseYieldOf(dependencies, UnitType, Attack) > 0,
};

export default civ1MartialLawPolicy;
