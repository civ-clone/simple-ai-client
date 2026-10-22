// Civ1: a barbarian unit's turn (civ-clone/web-renderer#169): a ship sails for the richest city in reach and lands
//  its raiders; a raider marches on the nearest city and attacks what it meets; the leader keeps to the stack. Always
//  handles the action: a barbarian has nothing else to do with a unit.
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import NavalTransport from '@civ-clone/base-unit-type-naval-transport/NavalTransport';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Strategy from '@civ-clone/core-strategy/Strategy';
import Unit from '@civ-clone/core-unit/Unit';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';
import { raid, sail } from '../../lib/Barbarian/raid';

export class Raid extends Strategy {
  private _dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    super(dependencies.ruleRegistry);

    this._dependencies = dependencies;
  }

  handles(action: PlayerAction): boolean {
    return isUnitAction(action);
  }

  attempt(action: PlayerAction<Unit>): boolean {
    const unit = action.value();

    if (unit instanceof NavalTransport) {
      sail(this._dependencies, action.player(), unit);
    } else {
      raid(this._dependencies, action.player(), unit);
    }

    return true;
  }
}

export default Raid;
