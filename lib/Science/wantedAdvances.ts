// Generic: the advances a leader wants before its player stops researching for good, by its personality
//  (civ-clone/web-renderer#155).
//
// v474.05's AI sets science to 0 the moment it has Robotics, whoever it is. Here each leader carries on until it has
//  the advances its traits say it cares about: the ruleset's `WantedAdvancesPolicy` (Civ1's is `Civ1/wantedAdvances`).
//  Until then, research picks a wanted advance whenever one is available (`chooseResearch`).
import Advance from '@civ-clone/core-science/Advance';
import Dependencies from '../Dependencies';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import Trait from '@civ-clone/core-civilization/Trait';
import { leaderTraits } from '../traits';

// The ruleset's part.
export interface WantedAdvancesPolicy {
  // Wanted by every leader: science can stop only once the player has all of these.
  always: (typeof Advance)[];
  // What each trait adds, by the trait's class.
  byTrait: [typeof Trait, (typeof Advance)[]][];
}

// Every advance `player`'s leader wants, each once: `always`, then what each of its traits adds.
export const wantedAdvances = (
  dependencies: Dependencies,
  player: Player,
  policy: WantedAdvancesPolicy
): (typeof Advance)[] => {
  const traits = leaderTraits(dependencies, player);

  return [
    ...new Set([
      ...policy.always,
      ...policy.byTrait.flatMap(
        ([TraitType, advances]: [typeof Trait, (typeof Advance)[]]) =>
          traits.some((trait: Trait): boolean => trait instanceof TraitType)
            ? advances
            : []
      ),
    ]),
  ];
};

// Whether `player` has stopped researching for good: it has every advance its leader wants. A player with no research
//  never has.
export const scienceStopped = (
  dependencies: Dependencies,
  player: Player,
  policy: WantedAdvancesPolicy
): boolean => {
  let playerResearch: PlayerResearch;

  try {
    playerResearch = dependencies.playerResearchRegistry.getByPlayer(player);
  } catch (e) {
    return false;
  }

  return wantedAdvances(dependencies, player, policy).every(
    (AdvanceType: typeof Advance): boolean =>
      playerResearch.completed(AdvanceType)
  );
};

export default wantedAdvances;
