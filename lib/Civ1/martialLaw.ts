// Civ1: martial law, as `civ1-city-happiness` has it (its `martialLaw.ts`, v474.05's): under Anarchy, Communism,
//  Despotism or Monarchy, each unit in a city that can attack keeps one of its unhappy citizens content, up to three,
//  once the city's improvements and Wonders have calmed what they can. The governments and the cap are the engine's
//  own; which units it uses, and how many citizens are unhappy, are asked of its rules (`City/defence`).
import {
  martialLawGovernments,
  martialLawUnitLimit,
} from '@civ-clone/civ1-city-happiness/martialLaw';
import { MartialLawPolicy } from '../City/defence';

export const civ1MartialLawPolicy: MartialLawPolicy = {
  limit: (dependencies, city) =>
    dependencies.playerGovernmentRegistry
      .getByPlayer(city.player())
      .is(...martialLawGovernments)
      ? martialLawUnitLimit
      : 0,
};

export default civ1MartialLawPolicy;
