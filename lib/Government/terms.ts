// Generic: what the player's government does, as the rule set numbers it (base-government-terms' `GovernmentTerms`),
//  for the policies that otherwise use Civ1's numbers. Each reader answers `undefined` where the rule set gives no such
//  term (Civ1 registers none), so its caller keeps its own.
import {
  Terms,
  currentGovernment,
  governmentTerm,
} from '@civ-clone/base-government-terms/lib/terms';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Government from '@civ-clone/core-government/Government';
import Player from '@civ-clone/core-player/Player';

// The class of `player`'s government now, or `null` with none (or no record of one).
export const governmentOf = (
  dependencies: Dependencies,
  player: Player
): typeof Government | null => {
  try {
    return currentGovernment(
      dependencies.playerGovernmentRegistry.getByPlayer(player)
    );
  } catch (e) {
    return null;
  }
};

// The term `key` of the government `player` has now, or `undefined`.
export const playerGovernmentTerm = <K extends keyof Terms>(
  dependencies: Dependencies,
  player: Player,
  key: K
): Terms[K] | undefined => {
  const GovernmentType = governmentOf(dependencies, player);

  return GovernmentType === null
    ? undefined
    : governmentTerm(dependencies.ruleRegistry, GovernmentType, key);
};

// The term `key` of the government `city`'s player has now, or `undefined`.
export const cityGovernmentTerm = <K extends keyof Terms>(
  dependencies: Dependencies,
  city: City,
  key: K
): Terms[K] | undefined =>
  playerGovernmentTerm(dependencies, city.player(), key);
