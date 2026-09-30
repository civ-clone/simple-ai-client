// Generic: a unit in one of the player's cities fortifies there if the city needs more defenders, or if it can relieve
//  a weaker one. Handles the action only when it fortifies.
import AIStrategy from '../lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import garrison from '../../lib/Unit/garrison';
import isUnitAction from '../lib/isUnitAction';
import unitTurnContextFor from '../lib/unitTurnContextFor';

export class Garrison extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return isUnitAction(action);
  }

  attempt(action: PlayerAction<Unit>): boolean {
    const {
      actions: { fortify },
      tile,
      tileUnits,
    } = unitTurnContextFor(this.dependencies(), action);

    return garrison(
      this.dependencies(),
      action.value(),
      tile,
      tileUnits,
      fortify
    );
  }
}

export default Garrison;
