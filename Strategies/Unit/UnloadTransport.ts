// Generic: a transport at the coast unloads cargo that hasn't just come from there, then waits. Handles the action
//  only when it unloads. The first unit strategy to read the unit's turn context, so the one that creates it.
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';
import unitTurnContextFor from '@civ-clone/base-strategy-ai/Strategies/lib/unitTurnContextFor';
import unloadTransport from '../../lib/Unit/unloadTransport';

export class UnloadTransport extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return isUnitAction(action);
  }

  attempt(action: PlayerAction<Unit>): boolean {
    // Read for every unit, not only transports: this is where each unit's turn reads its context.
    const {
      actions: { unload },
      tile,
    } = unitTurnContextFor(this.dependencies(), action);

    return unloadTransport(
      this.memoryFor(action.player()),
      action.value(),
      tile,
      unload
    );
  }
}

export default UnloadTransport;
