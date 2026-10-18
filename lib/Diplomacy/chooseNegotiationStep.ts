// Generic: the AI's answer at each step of a negotiation. The ruleset's steps decide what a computer player says
//  (Civ1's offer it one thing to say at each turn, from how it stands with the other player), so the AI takes what
//  it's offered, accepting rather than declining where it has the choice: a meeting it's asked to.
import {
  ChoiceMeta,
  DataForChoiceMeta,
} from '@civ-clone/core-client/ChoiceMeta';
import Accept from '@civ-clone/core-diplomacy/Proposal/Accept';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';

// Synchronous, so `chooseFromList` resolves in the same number of ticks as when this was inline.
export const chooseNegotiationStep = <Name extends keyof ChoiceMetaDataMap>(
  dependencies: Dependencies,
  player: Player,
  meta: ChoiceMeta<Name>
): DataForChoiceMeta<ChoiceMeta<Name>> => {
  const choices = meta.choices(),
    accept = choices.find((choice) => choice.value() instanceof Accept);

  return (accept ?? choices[0]).value();
};

export default chooseNegotiationStep;
