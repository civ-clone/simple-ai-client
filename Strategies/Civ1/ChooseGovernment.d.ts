import AIStrategy from '../lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
export declare class ChooseGovernment extends AIStrategy {
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<PlayerGovernment>): boolean;
}
export default ChooseGovernment;
