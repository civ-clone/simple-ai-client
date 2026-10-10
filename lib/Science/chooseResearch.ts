// Generic: picks what to research next from what's available, or from the advances the player's leader wants
//  (`wantedAdvances`) when any of those is available: by how keen the leader is on each (`AdvanceGrade`), or at random
//  if the ruleset grades none.
import Advance from '@civ-clone/core-science/Advance';
import AdvanceGrade from '@civ-clone/base-leader-personality/Rules/Player/AdvanceGrade';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import { sum } from '@civ-clone/base-leader-personality/lib/combine';

// v474.05's pick (OpenCivOne `Segment_1ade.cs` `F0_1ade_1584`): each advance draws a whole number below 4 × its grade,
//  and the first highest draw wins, so a grade of 0 wins only if every other draw is 0 too. One draw per advance.
const byGrade = (
  dependencies: Dependencies,
  playerResearch: PlayerResearch,
  choices: (typeof Advance)[]
): typeof Advance => {
  let best = -1,
    chosen = choices[0];

  choices.forEach((AdvanceType: typeof Advance): void => {
    const grade = sum(
        dependencies.ruleRegistry,
        AdvanceGrade,
        playerResearch.player(),
        AdvanceType
      ),
      draw = Math.floor(
        dependencies.randomNumberGenerator() * Math.max(0, grade) * 4
      );

    if (draw > best) {
      best = draw;
      chosen = AdvanceType;
    }
  });

  return chosen;
};

// Chooses among the `wanted` advances available or, if there are none, among everything available, and only draws from
//  the random number generator when there's something to choose from: once per advance by grade, or once at random.
//  Once a player has every advance it wants, and so has stopped researching, that's everything available: the engine
//  still asks it to choose, but its science rate is 0, so nothing comes of it.
export const chooseResearch = (
  dependencies: Dependencies,
  playerResearch: PlayerResearch,
  wanted: (typeof Advance)[] = []
): void => {
  const available = playerResearch.available(),
    availableWanted = available.filter((AdvanceType: typeof Advance) =>
      wanted.includes(AdvanceType)
    ),
    choices = availableWanted.length > 0 ? availableWanted : available;

  if (choices.length === 0) {
    return;
  }

  playerResearch.research(
    dependencies.ruleRegistry.get(AdvanceGrade).length > 0
      ? byGrade(dependencies, playerResearch, choices)
      : choices[
          Math.floor(choices.length * dependencies.randomNumberGenerator())
        ]
  );
};

export default chooseResearch;
