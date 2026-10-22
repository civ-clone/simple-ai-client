import Dependencies, {
  dependenciesFor,
} from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { StrategyRegistry } from '@civ-clone/core-strategy/StrategyRegistry';
import BuildRaiders from './Strategies/Barbarian/BuildRaiders';
import EndTurn from '@civ-clone/base-player-action-end-turn/EndTurn';
import MandatoryPlayerAction from '@civ-clone/core-player/MandatoryPlayerAction';
import Player from '@civ-clone/core-player/Player';
import Raid from './Strategies/Barbarian/Raid';
import Strategy from '@civ-clone/core-strategy/Strategy';
import StrategyAIClient from '@civ-clone/core-strategy-ai-client/StrategyAIClient';
import Unit from '@civ-clone/core-unit/Unit';
import { defaultGame } from '@civ-clone/core-game';
import { skipUnit } from '@civ-clone/base-strategy-ai/lib/Unit/orders';

// The barbarians' strategies: their units' turns, and what their cities build. Nothing else is offered to them:
//  `civ1-barbarians` keeps research, revolutions and negotiation away from the barbarian player.
export const createBarbarianStrategies = (
  dependencies: Dependencies
): Strategy[] => [new Raid(dependencies), new BuildRaiders(dependencies)];

/**
 * The barbarians' client (civ-clone/web-renderer#169): an `AIClient`, so `isHuman` and the hooks that tell a computer
 * player from a person treat it as one, with a strategy pack of its own rather than `SimpleAIClient`'s, which plans
 * for a civilization. A host gives it to the player `civ1-barbarians` spawns, when `player:spawned` names a barbarian.
 */
export class BarbarianClient extends StrategyAIClient {
  constructor(
    player: Player,
    dependencies: Dependencies = dependenciesFor(defaultGame),
    strategyRegistry: StrategyRegistry = new StrategyRegistry()
  ) {
    super(player, strategyRegistry, dependencies.randomNumberGenerator);

    if (strategyRegistry.length === 0) {
      strategyRegistry.register(...createBarbarianStrategies(dependencies));
    }
  }

  // As `SimpleAIClient`: one unit's failed move shouldn't cost the rest of the raid, so that unit stands down.
  protected actionFailed(
    action: MandatoryPlayerAction,
    error: unknown
  ): boolean {
    const item = action.value();

    if (!(item instanceof Unit)) {
      throw error;
    }

    console.error(
      `BarbarianClient: ${item.constructor.name} could not act: ${
        error instanceof Error ? error.message : String(error)
      }`
    );

    skipUnit(dependenciesFor(defaultGame), item);

    return true;
  }

  // The turn ends at the first action no strategy handles, which should be `EndTurn`.
  protected unhandledAction(action: MandatoryPlayerAction): void {
    if (action instanceof EndTurn) {
      return;
    }

    console.log(`BarbarianClient: can't process '${action.constructor.name}'`);
  }
}

export default BarbarianClient;
