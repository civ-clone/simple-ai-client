import { SpendingPolicy } from '../../lib/City/spendTreasury';
import AfterTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
export declare class SpendTreasury extends AIStrategy {
  private _policy;
  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy: SpendingPolicy
  );
  handles(action: PlayerAction): boolean;
  attempt(action: AfterTurn): boolean;
}
export default SpendTreasury;
