// Generic: picks what to research next from what's available, or from the advances the player's leader wants
//  (`wantedAdvances`) when any of those is available: by how keen the leader is on each (`AdvanceGrade`), or at random
//  if no grade applies to this player and these advances.
import Advance from '@civ-clone/core-science/Advance';
import AdvanceGrade from '@civ-clone/base-leader-personality/Rules/Player/AdvanceGrade';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';

// Each advance's grade, the `AdvanceGrade` rules that apply to it added together, or `null` for an advance no rule
//  applies to.
const grades = (
  dependencies: Dependencies,
  player: Player,
  choices: (typeof Advance)[]
): (number | null)[] =>
  choices.map((AdvanceType: typeof Advance): number | null => {
    const matched = dependencies.ruleRegistry.process(
      AdvanceGrade,
      player,
      AdvanceType
    );

    return matched.length === 0
      ? null
      : matched.reduce((total: number, grade: number) => total + grade, 0);
  });

// v474.05's pick (OpenCivOne `Segment_1ade.cs` `F0_1ade_1584`): each advance draws a whole number below 4 × its grade,
//  and the first highest draw wins, so a grade of 0 (or none) wins only if every other draw is 0 too. One draw per
//  advance.
const byGrade = (
  dependencies: Dependencies,
  choices: (typeof Advance)[],
  gradeOf: (number | null)[]
): typeof Advance => {
  let best = -1,
    chosen = choices[0];

  choices.forEach((AdvanceType: typeof Advance, index: number): void => {
    const draw = Math.floor(
      dependencies.randomNumberGenerator() *
        Math.max(0, gradeOf[index] ?? 0) *
        4
    );

    if (draw > best) {
      best = draw;
      chosen = AdvanceType;
    }
  });

  return chosen;
};

// Chooses among the `wanted` advances available or, if there are none, among everything available, and only draws from
//  the random number generator when there's something to choose from: once per advance by grade, or once at random
//  when no `AdvanceGrade` rule applies to the player and any of them, so a rule for one leader's trait leaves the
//  others' choices as they were. Once a player has every advance it wants, and so has stopped researching, that's
//  everything available: the engine still asks it to choose, but its science rate is 0, so nothing comes of it.
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

  const gradeOf = grades(dependencies, playerResearch.player(), choices);

  playerResearch.research(
    gradeOf.some((grade: number | null): boolean => grade !== null)
      ? byGrade(dependencies, choices, gradeOf)
      : choices[
          Math.floor(choices.length * dependencies.randomNumberGenerator())
        ]
  );
};

export default chooseResearch;
