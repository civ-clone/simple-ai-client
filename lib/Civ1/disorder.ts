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
import {
  DisorderPolicy,
  noteDisorderAtTurnStart,
  wasInDisorderAtTurnStart,
} from '../City/disorder';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { King } from '@civ-clone/civ1-difficulty/Difficulties';
import {
  CIVIL_DISORDER,
  capturedDisorder,
  civilDisorder,
} from '@civ-clone/civ1-city-happiness/lib/cityStatus';
import { contentCitizens } from '@civ-clone/civ1-difficulty/level';
import rulesBornContent from '@civ-clone/base-city-happiness/lib/bornContent';
import { cityGovernmentTerm } from '../Government/terms';

// The citizens a computer player's city is born content with: 3, whatever the level (`civ1-difficulty`), so the level,
//  which this policy can't see, makes no difference. It only ever plays computer players.
const bornContent = contentCitizens(King.level(), false);

// Whether `civ1-city-happiness` keeps its record of disorder in this game: its rules register the handler. Worked out
//  once a turn: it's asked for each city, and `handlers()` builds its list afresh each time.
const recordsCache: WeakMap<object, [number, boolean]> = new WeakMap();

export const recordsCivilDisorder = (dependencies: Dependencies): boolean => {
  const registry = dependencies.pendingEffectRegistry,
    turn = dependencies.turn.value(),
    cached = recordsCache.get(registry);

  if (cached && cached[0] === turn) {
    return cached[1];
  }

  const records = registry.handlers().includes(CIVIL_DISORDER);

  recordsCache.set(registry, [turn, records]);

  return records;
};

export const civ1DisorderPolicy: DisorderPolicy = {
  calmingImprovements: [
    Temple,
    Marketplace,
    Cathedral,
    Colosseum,
  ] as IBuildable[],
  purchaseShare: 1 / 8,
  // Every citizen of a city beyond those born content is born unhappy (`civ1-city-happiness`'s `PopulationUnhappiness`):
  //  as many as the rule set's `BornContent` rules say (base-city-happiness; Civ2's count a person's level and empire),
  //  or else Civ1's for a computer player.
  //  Under a government with no unhappy citizens (base-government-terms' `noUnhappiness`, Civ2's Fundamentalism), none.
  unhappinessOnGrowth: (dependencies, city) =>
    cityGovernmentTerm(dependencies, city, 'noUnhappiness') !== true &&
    dependencies.cityGrowthRegistry.getByCity(city).size() + 1 >
      (rulesBornContent(city, dependencies.ruleRegistry) ?? bornContent)
      ? 1
      : 0,
  // `civ1-city-happiness` records the disorder it finds at the player's turn start until order is restored. In a game
  //  without that record (Civ2 keeps its own, under its own name), what the ruleset's `CivilDisorder` rules found at the
  //  start of the player's turn (`turnStart`), so a city calmed since still counts. Not a city whose disorder is only
  //  its capture's (`beyondCalming`): it was captured this turn.
  wasInDisorder: (dependencies, city) =>
    recordsCivilDisorder(dependencies)
      ? civilDisorder(city, dependencies.pendingEffectRegistry) !== null &&
        !capturedDisorder(city, dependencies.pendingEffectRegistry)
      : wasInDisorderAtTurnStart(dependencies, city),
  // A city the human captures below a Republic is in disorder, whatever its citizens think, until its next turn's
  //  production is lost to it (`civ1-city-happiness`'s `capturedDisorder`), and the Automate AI plays the human's
  //  turns: Entertainers, a Temple or luxuries can't end it, so none are spent on it (civ-clone/web-renderer#1014).
  beyondCalming: (dependencies, city) =>
    capturedDisorder(city, dependencies.pendingEffectRegistry),
  turnStart: (dependencies, player) => {
    if (!recordsCivilDisorder(dependencies)) {
      noteDisorderAtTurnStart(dependencies, player);
    }
  },
};

export default civ1DisorderPolicy;
