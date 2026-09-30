import AIStrategy from '../lib/AIStrategy';
import ChooseFromList from '@civ-clone/core-strategy-ai-client/PlayerActions/ChooseFromList';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
export declare class NegotiationAnswers extends AIStrategy {
  handles(action: PlayerAction): boolean;
  attempt(action: ChooseFromList): boolean;
}
export default NegotiationAnswers;
