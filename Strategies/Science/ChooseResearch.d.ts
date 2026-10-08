import { WantedAdvancesPolicy } from '../../lib/Science/wantedAdvances';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
export declare class ChooseResearch extends AIStrategy {
  private _policy;
  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy?: WantedAdvancesPolicy | null
  );
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<PlayerResearch>): boolean;
}
export default ChooseResearch;
