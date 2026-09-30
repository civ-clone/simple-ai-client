// Generic: holds an aircraft back until the player's carriers have moved. Handles the action only when it does.
import AIStrategy from '../lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import isUnitAction from '../lib/isUnitAction';
import waitForCarrier from '../../lib/Unit/waitForCarrier';

export class WaitForCarrier extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return isUnitAction(action);
  }

  attempt(action: PlayerAction<Unit>): boolean {
    return waitForCarrier(
      this.dependencies(),
      action.player(),
      this.knowledge(),
      action.value()
    );
  }
}

export default WaitForCarrier;
