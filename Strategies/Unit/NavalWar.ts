// Generic: a warship hunts enemy ships, escorts its player's loaded transports and bombards enemy coastal cities
//  (`lib/Unit/navalWar`, civ-clone/web-renderer#1128). Only a unit the ruleset's roles make a warship is handled, and
//  only when it has one of those tasks: in a ruleset that declares no roles (Civ1) this strategy never handles a unit.
import planNavalTask, { isWarship } from '../../lib/Unit/navalWar';
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

    await moveUnit(dependencies, player, memory, this.knowledge(), unit, {
      wander: false,
    });

    return true;
  }
}

export default NavalWar;
