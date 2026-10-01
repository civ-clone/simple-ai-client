// Civ1: martial law, as `civ1-city-happiness`'s `Cost` rule has it: under Anarchy, Communism, Despotism or Monarchy
//  each unit in a city keeps one of its unhappy citizens content, up to four. The rule keeps both in its own closure, so
//  they're repeated here; how many units it uses, and how many citizens are unhappy, are asked of the rule itself.
import {
  Anarchy,
  Communism,
  Despotism,
  Monarchy,
} from '@civ-clone/civ1-government/Governments';
import { MartialLawPolicy } from '../City/defence';

export const civ1MartialLawPolicy: MartialLawPolicy = {
  limit: (dependencies, city) =>
    dependencies.playerGovernmentRegistry
      .getByPlayer(city.player())
      .is(Anarchy, Communism, Despotism, Monarchy)
      ? 4
      : 0,
};

export default civ1MartialLawPolicy;
