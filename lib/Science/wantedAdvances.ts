// Generic: the advances a leader wants before its player stops researching for good, by its personality
//  (civ-clone/web-renderer#155).
//
// v474.05's AI sets science to 0 the moment it has Robotics, whoever it is. Here each leader carries on until it has
//  the advances its traits say it cares about: the ruleset's `WantedAdvances` rules (`base-leader-personality`; Civ1's
//  are in `civ1-civilization`). Until then, research picks a wanted advance whenever one is available
//  (`chooseResearch`).
import Advance from '@civ-clone/core-science/Advance';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import WantedAdvances from '@civ-clone/base-leader-personality/Rules/Player/WantedAdvances';
import { union } from '@civ-clone/base-leader-personality/lib/combine';

// Every advance `player`'s leader wants, each once, or `null` if the ruleset says nothing about it.
export const wantedAdvances = (
  dependencies: Dependencies,
  player: Player
): (typeof Advance)[] | null =>
  union<typeof Advance, WantedAdvances>(
    dependencies.ruleRegistry,
    WantedAdvances,
    player
  );

// Whether `player` has stopped researching for good: it has every advance its leader wants. A player with no research,
//  or whose ruleset says nothing about what its leader wants, never has.
export const scienceStopped = (
  dependencies: Dependencies,
  player: Player
): boolean => {
  let playerResearch: PlayerResearch;

  try {
    playerResearch = dependencies.playerResearchRegistry.getByPlayer(player);
  } catch (e) {
    return false;
  }

  const wanted = wantedAdvances(dependencies, player);

  return (
    wanted !== null &&
    wanted.every((AdvanceType: typeof Advance): boolean =>
      playerResearch.completed(AdvanceType)
    )
  );
};

export default wantedAdvances;
