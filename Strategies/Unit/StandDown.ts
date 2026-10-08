// Generic: a unit with nothing to do, which `MissionAndMove` has passed over, goes where a city wants it, is disbanded
//  if the ruleset's policy finds it isn't worth keeping, or stays in or heads for one of the player's cities
//  (`lib/Unit/standDown`). Always handles a unit.
import standDown, { StandDownPolicy } from '../../lib/Unit/standDown';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';
import unitTurnContextFor from '@civ-clone/base-strategy-ai/Strategies/lib/unitTurnContextFor';

export class StandDown extends AIStrategy {
  private _policy: StandDownPolicy;

  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy: StandDownPolicy
  ) {
    super(dependencies, knowledge);

    this._policy = policy;
  }

  handles(action: PlayerAction): boolean {
    return isUnitAction(action);
  }

  async attempt(action: PlayerAction<Unit>): Promise<boolean> {
    const { actions } = unitTurnContextFor(this.dependencies(), action);

    await standDown(
      this.dependencies(),
      action.player(),
      this.memoryFor(action.player()),
      this.knowledge(),
      this._policy,
      action.value(),
      actions
    );

    return true;
  }
}

export default StandDown;
