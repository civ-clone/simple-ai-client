// Generic: the fallback for any unit: a unit with no target takes the first mission it qualifies for, then the move
//  executor runs. Always handles a unit.
import AIStrategy from '../lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import assignMission from '../../lib/Unit/assignMission';
import isUnitAction from '../lib/isUnitAction';
import moveUnit from '../../lib/Unit/moveUnit';
import unitTurnContextFor from '../lib/unitTurnContextFor';

export class MissionAndMove extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return isUnitAction(action);
  }

  async attempt(action: PlayerAction<Unit>): Promise<boolean> {
    const player = action.player(),
      unit = action.value(),
      memory = this.memoryFor(player),
      { target } = unitTurnContextFor(this.dependencies(), action);

    if (!target) {
      assignMission(this.dependencies(), memory, unit);
    }

    await moveUnit(this.dependencies(), player, memory, this.knowledge(), unit);

    return true;
  }
}

export default MissionAndMove;
