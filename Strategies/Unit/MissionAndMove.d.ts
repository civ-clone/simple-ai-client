import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
export declare class MissionAndMove extends AIStrategy {
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<Unit>): Promise<boolean>;
}
export default MissionAndMove;
