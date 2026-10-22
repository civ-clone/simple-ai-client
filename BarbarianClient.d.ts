import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { StrategyRegistry } from '@civ-clone/core-strategy/StrategyRegistry';
import MandatoryPlayerAction from '@civ-clone/core-player/MandatoryPlayerAction';
import Player from '@civ-clone/core-player/Player';
import Strategy from '@civ-clone/core-strategy/Strategy';
import StrategyAIClient from '@civ-clone/core-strategy-ai-client/StrategyAIClient';
export declare const createBarbarianStrategies: (
  dependencies: Dependencies
) => Strategy[];
/**
 * The barbarians' client (civ-clone/web-renderer#169): an `AIClient`, so `isHuman` and the hooks that tell a computer
 * player from a person treat it as one, with a strategy pack of its own rather than `SimpleAIClient`'s, which plans
 * for a civilization. A host gives it to the player `civ1-barbarians` spawns, when `player:spawned` names a barbarian.
 */
export declare class BarbarianClient extends StrategyAIClient {
  private _dependencies;
  constructor(
    player: Player,
    dependencies?: Dependencies,
    strategyRegistry?: StrategyRegistry
  );
  protected actionFailed(
    action: MandatoryPlayerAction,
    error: unknown
  ): boolean;
  protected unhandledAction(action: MandatoryPlayerAction): void;
}
export default BarbarianClient;
