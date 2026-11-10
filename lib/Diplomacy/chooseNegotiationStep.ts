// Generic: the AI's answer at each step of a negotiation. The ruleset's steps decide what a computer player says
//  (Civ1's offer it one thing to say at each turn, from how it stands with the other player), so the AI takes what
//  it's offered, accepting rather than declining where it has the choice: a meeting it's asked to. With nothing to
//  accept, it carries on rather than leaving (a demand of its own after the hand-over, say), whatever order the steps
//  come in: a ruleset may put leaving first, as the safe answer for a player (civ-clone/web-renderer#674).
//
// Carrying on can't go on for ever, though: a ruleset that always offers something besides leaving would keep the AI
//  talking without end. So it counts the steps it has answered in each negotiation and, past
//  `MOST_NEGOTIATION_STEPS`, leaves whenever leaving is offered (civ-clone/web-renderer#877).
import {
  ChoiceMeta,
  DataForChoiceMeta,
} from '@civ-clone/core-client/ChoiceMeta';
import Accept from '@civ-clone/core-diplomacy/Proposal/Accept';
import Terminate from '@civ-clone/core-diplomacy/Negotiation/Terminate';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';

// The steps a player answers in one negotiation before it leaves when it can: far more than any meeting needs (in
//  1,752 meetings between computer players under Civ1's rules, each answered two; civ-clone/web-renderer#877).
export const MOST_NEGOTIATION_STEPS = 100;

// Steps answered so far, by negotiation (the choice's `data`), then by player. Weak, so a negotiation's count goes
//  with it.
const answered = new WeakMap<object, Map<Player, number>>();

// How many steps `player` has answered in `negotiation`, counting this one. Without a negotiation to tell this one
//  from another, there's nothing to count.
const count = (negotiation: unknown, player: Player): number => {
  if (typeof negotiation !== 'object' || negotiation === null) {
    return 0;
  }

  const byPlayer = answered.get(negotiation) ?? new Map<Player, number>(),
    steps = (byPlayer.get(player) ?? 0) + 1;

  byPlayer.set(player, steps);
  answered.set(negotiation, byPlayer);

  return steps;
};

// Synchronous, so `chooseFromList` resolves in the same number of ticks as when this was inline.
export const chooseNegotiationStep = <Name extends keyof ChoiceMetaDataMap>(
  dependencies: Dependencies,
  player: Player,
  meta: ChoiceMeta<Name>
): DataForChoiceMeta<ChoiceMeta<Name>> => {
  const choices = meta.choices(),
    leave = choices.find((choice) => choice.value() instanceof Terminate);

  if (count(meta.data(), player) > MOST_NEGOTIATION_STEPS && leave) {
    return leave.value();
  }

  const accept = choices.find((choice) => choice.value() instanceof Accept),
    carryOn = choices.find((choice) => !(choice.value() instanceof Terminate));

  return (accept ?? carryOn ?? choices[0]).value();
};

export default chooseNegotiationStep;
