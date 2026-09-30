import AIStrategy from '../lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
export declare class ChooseResearch extends AIStrategy {
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<PlayerResearch>): boolean;
}
export default ChooseResearch;
