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
import { civilDisorder } from '@civ-clone/civ1-city-happiness/lib/cityStatus';

export const civ1DisorderPolicy: DisorderPolicy = {
  calmingImprovements: [
    Temple,
    Marketplace,
    Cathedral,
    Colosseum,
  ] as IBuildable[],
  purchaseShare: 1 / 8,
  // A city's sixth citizen and every one after it is born unhappy (`civ1-city-happiness`'s `PopulationUnhappiness`,
  //  one for each citizen over five).
  unhappinessOnGrowth: (dependencies, city) =>
    dependencies.cityGrowthRegistry.getByCity(city).size() + 1 > 5 ? 1 : 0,
  // `civ1-city-happiness` records the disorder it finds at the player's turn start until order is restored.
  wasInDisorder: (dependencies, city) =>
    civilDisorder(city, dependencies.pendingEffectRegistry) !== null,
};

export default civ1DisorderPolicy;
