// Civ1: how a city is kept out of civil disorder, after v474.05's AI (`CityWorker.cs` `F0_1d12_0045_ProcessCityState`
//  in OpenCivOne): a city that falls into disorder builds a Temple, a Marketplace, a Cathedral or a Colosseum, the
//  first it can, and spends up to an eighth of the treasury on it.
import {
  Cathedral,
  Colosseum,
  Marketplace,
  Temple,
} from '@civ-clone/civ1-city-improvement/CityImprovements';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import { DisorderPolicy } from '../City/disorder';
import { King } from '@civ-clone/civ1-difficulty/Difficulties';
import { civilDisorder } from '@civ-clone/civ1-city-happiness/lib/cityStatus';
import { contentCitizens } from '@civ-clone/civ1-difficulty/level';

// The citizens a computer player's city is born content with: 3, whatever the level (`civ1-difficulty`), so the level,
//  which this policy can't see, makes no difference. It only ever plays computer players.
const bornContent = contentCitizens(King.level(), false);

export const civ1DisorderPolicy: DisorderPolicy = {
  calmingImprovements: [
    Temple,
    Marketplace,
    Cathedral,
    Colosseum,
  ] as IBuildable[],
  purchaseShare: 1 / 8,
  // Every citizen of a computer player's city beyond those born content is born unhappy (`civ1-city-happiness`'s
  //  `PopulationUnhappiness`).
  unhappinessOnGrowth: (dependencies, city) =>
    dependencies.cityGrowthRegistry.getByCity(city).size() + 1 > bornContent
      ? 1
      : 0,
  // `civ1-city-happiness` records the disorder it finds at the player's turn start until order is restored.
  wasInDisorder: (dependencies, city) =>
    civilDisorder(city, dependencies.pendingEffectRegistry) !== null,
};

export default civ1DisorderPolicy;
