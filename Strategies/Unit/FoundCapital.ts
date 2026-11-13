// Generic: a worker founds its player's first city where it stands once the player has waited long enough for a good
//  site. Handles the action only when it founds the city; otherwise `WorkerTurn` carries on as usual.
import FoundsCities from '@civ-clone/base-unit-trait-founds-cities/FoundsCities';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import shouldFoundCapital from '../../lib/Unit/foundCapital';
import unitTurnContextFor from '@civ-clone/base-strategy-ai/Strategies/lib/unitTurnContextFor';

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

  // A unit that `FoundsCities`.
  handles(action: PlayerAction): boolean {
    const value = action.value();

    return value instanceof Unit && value.hasTrait(FoundsCities);
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
