// Generic: answers each step of a negotiation (`lib/Diplomacy/chooseNegotiationStep`): the rule set's one answer where
//  it gives one, its own choice where it speaks for a person and the rule set leaves one (`lib/Diplomacy/personTalks`).
//  Every other `chooseFromList` falls through to the client's random pick.
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import ChooseFromList from '@civ-clone/core-strategy-ai-client/PlayerActions/ChooseFromList';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import chooseNegotiationStep from '../../lib/Diplomacy/chooseNegotiationStep';

export class NegotiationAnswers extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return (
      action instanceof ChooseFromList &&
      action.value().meta().key() === 'negotiation.next-step'
    );
  }

  attempt(action: ChooseFromList): boolean {
    const data = action.value();

    data.choose(
      chooseNegotiationStep(this.dependencies(), action.player(), data.meta())
    );

    return true;
  }
}

export default NegotiationAnswers;
