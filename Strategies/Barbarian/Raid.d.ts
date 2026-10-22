import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Strategy from '@civ-clone/core-strategy/Strategy';
import Unit from '@civ-clone/core-unit/Unit';
export declare class Raid extends Strategy {
  private _dependencies;
  constructor(dependencies: Dependencies);
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<Unit>): boolean;
}
export default Raid;
