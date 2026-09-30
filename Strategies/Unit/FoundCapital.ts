// Generic: a worker founds its player's first city where it stands once the player has waited long enough for a good
//  site. Handles the action only when it founds the city; otherwise `WorkerTurn` carries on as usual.
import AIStrategy from '../lib/AIStrategy';
import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import { Worker } from '@civ-clone/library-unit/Types';
import shouldFoundCapital from '../../lib/Unit/foundCapital';
import unitTurnContextFor from '../lib/unitTurnContextFor';

export class FoundCapital extends AIStrategy {
  private _foundByTurn: number;

  // `foundByTurn`: from this turn a player with no city founds one wherever its worker stands. By then a first worker
  //  has usually found a good site: over 40 arena games, every other capital was founded by turn 5.
  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    foundByTurn: number = 5
  ) {
    super(dependencies, knowledge);

    this._foundByTurn = foundByTurn;
  }

  handles(action: PlayerAction): boolean {
    return action.value() instanceof Worker;
  }

  attempt(action: PlayerAction<Unit>): boolean {
    const {
      actions: { foundCity },
    } = unitTurnContextFor(this.dependencies(), action);

    if (
      !foundCity ||
      !shouldFoundCapital(
        this.dependencies(),
        action.player(),
        this._foundByTurn
      )
    ) {
      return false;
    }

    action.value().action(foundCity);

    return true;
  }
}

export default FoundCapital;
