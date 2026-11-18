// Generic: a warship hunts enemy ships, escorts its player's loaded transports and bombards enemy coastal cities
//  (`lib/Unit/navalWar`, civ-clone/web-renderer#1128). Only a unit the ruleset's roles make a warship is handled, and
//  only when it has one of those tasks: in a ruleset that declares no roles (Civ1) this strategy never handles a unit.
import planNavalTask, {
  isWarship,
  strikeBeside,
} from '../../lib/Unit/navalWar';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import { Attack } from '@civ-clone/library-unit/Actions';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import { actionToTake } from '../../lib/Unit/moveUnit';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';
import moveUnit from '../../lib/Unit/moveUnit';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';

export class NavalWar extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return (
      isUnitAction(action) &&
      isWarship(action.value() as Unit, this.dependencies().ruleRegistry)
    );
  }

  async attempt(action: PlayerAction<Unit>): Promise<boolean> {
    const dependencies = this.dependencies(),
      player = action.player(),
      unit = action.value(),
      memory = this.memoryFor(player),
      planned = planNavalTask(dependencies, player, memory, unit);

    if (planned === null) {
      return false;
    }

    // An escort sails once its transport has moved, so that it ends its turn alongside (as aircraft wait for carriers).
    if (
      planned.escorting &&
      !unit.waiting() &&
      planned.escorting.active() &&
      planned.escorting.moves().value() > 0
    ) {
      memory.unitPathData.delete(unit);
      unit.setWaiting();

      return true;
    }

    if (planned.strike !== null) {
      const strike = actionToTake(
        dependencies,
        player,
        unit.actions(planned.strike)
      );

      // Only the battle: anything else on offer there (a treaty partner's ship, say) isn't the task's.
      if (strike instanceof Attack) {
        unit.action(strike);
      } else {
        noOrders(dependencies, unit);
      }

      return true;
    }

    // An escort already where its transport is going waits there for it.
    if (!memory.unitPathData.has(unit)) {
      noOrders(dependencies, unit);

      return true;
    }

    const tile = unit.tile(),
      moves = unit.moves().value();

    // To where its path ends, and no further: an escort stays alongside, and a hunter or bombarder is planned again on
    //  its next action, to strike from there.
    await moveUnit(dependencies, player, memory, this.knowledge(), unit, {
      stopAtPathEnd: true,
      wander: false,
    });

    // Nothing more this turn once its path is over and it has nothing to strike, or where it couldn't take a step (a
    //  blocked path, which planning again would only find again).
    if (
      unit.active() &&
      unit.moves().value() > 0 &&
      (unit.tile() === tile ||
        unit.moves().value() === moves ||
        (!memory.unitPathData.has(unit) &&
          strikeBeside(dependencies, player, memory, unit) === null))
    ) {
      memory.unitPathData.delete(unit);
      noOrders(dependencies, unit);
    }

    return true;
  }
}

export default NavalWar;
