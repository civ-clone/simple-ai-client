import AIStrategy from '../lib/AIStrategy';
import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
export declare class FoundCapital extends AIStrategy {
  private _foundByTurn;
  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    foundByTurn?: number
  );
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<Unit>): boolean;
}
export default FoundCapital;
