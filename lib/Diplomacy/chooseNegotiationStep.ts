// Generic: the AI's answer at each step of a negotiation, declining when it's the stronger side and otherwise
//  preferring knowledge, then peace.
import {
  ChoiceMeta,
  DataForChoiceMeta,
} from '@civ-clone/core-client/ChoiceMeta';
import Accept from '@civ-clone/core-diplomacy/Proposal/Accept';
import Decline from '@civ-clone/core-diplomacy/Proposal/Decline';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import ExchangeKnowledge from '@civ-clone/library-diplomacy/Proposals/ExchangeKnowledge';
import { Interaction } from '@civ-clone/core-diplomacy/Interaction';
import OfferPeace from '@civ-clone/library-diplomacy/Proposals/OfferPeace';
import Player from '@civ-clone/core-player/Player';
import shouldAttack from '../shouldAttack';

// Synchronous, so `chooseFromList` resolves in the same number of ticks as when this was inline.
export const chooseNegotiationStep = <Name extends keyof ChoiceMetaDataMap>(
  dependencies: Dependencies,
  player: Player,
  meta: ChoiceMeta<Name>
): DataForChoiceMeta<ChoiceMeta<Name>> => {
  const score = (item: Interaction) => {
    const aggressive = shouldAttack(
      dependencies,
      player,
      item.players().filter((other) => other !== player)[0]
    );

    if (aggressive) {
      return item instanceof Decline ? 10 : -1;
    }

    return item instanceof ExchangeKnowledge
      ? 30
      : item instanceof OfferPeace
      ? 20
      : item instanceof Accept
      ? 10
      : 0;
  };

  const [topChoice] = meta.choices().sort((actionA, actionB) => {
    return (
      // TODO: This isn't `unknown`...
      score(actionB.value() as unknown as Interaction) -
      score(actionA.value() as unknown as Interaction)
    );
  });

  return topChoice.value();
};

export default chooseNegotiationStep;
