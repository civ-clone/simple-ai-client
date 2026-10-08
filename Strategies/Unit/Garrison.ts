// Generic: a unit in one of the player's cities fortifies there if the city needs more defenders, or if it can relieve
//  a weaker one, and makes the city its home. Handles the action only when it fortifies.
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import { SetHomeCity } from '@civ-clone/library-unit/Actions';
import Unit from '@civ-clone/core-unit/Unit';
import garrison from '../../lib/Unit/garrison';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';
import unitTurnContextFor from '@civ-clone/base-strategy-ai/Strategies/lib/unitTurnContextFor';

export class Garrison extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return isUnitAction(action);
  }

  attempt(action: PlayerAction<Unit>): boolean {
    const {
      actions: { fortify, setHomeCity },
      tile,
      tileUnits,
    } = unitTurnContextFor(this.dependencies(), action);

    return garrison(
      this.dependencies(),
      action.value(),
      tile,
      tileUnits,
      fortify,
      this.knowledge(),
      setHomeCity as SetHomeCity | undefined
    );
  }
}

export default Garrison;
