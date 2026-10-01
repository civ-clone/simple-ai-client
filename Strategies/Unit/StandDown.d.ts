import { StandDownPolicy } from '../../lib/Unit/standDown';
import AIStrategy from '../lib/AIStrategy';
import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
export declare class StandDown extends AIStrategy {
  private _policy;
  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy: StandDownPolicy
  );
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<Unit>): Promise<boolean>;
}
export default StandDown;
