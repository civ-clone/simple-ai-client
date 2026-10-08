import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
export declare class ReviewCities extends AIStrategy {
  handles(action: PlayerAction): boolean;
  attempt(action: BeforeTurn): boolean;
}
export default ReviewCities;
