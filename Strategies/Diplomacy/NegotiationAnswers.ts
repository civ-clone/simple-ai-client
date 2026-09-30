// Generic: answers each step of a negotiation: declines when it's the stronger side, otherwise prefers knowledge, then
//  peace. Every other `chooseFromList` falls through to the client's random pick.
import AIStrategy from '../lib/AIStrategy';
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
