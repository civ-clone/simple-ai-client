// Generic: aircraft, missiles, nuclear weapons and paratroopers at war (`lib/Unit/airWar`, civ-clone/web-renderer#1124).
//  Only a unit of a kind the ruleset's roles name (`airKindOf`, `isParatrooperType`) is handled: in a ruleset that
//  declares no roles (Civ1) this strategy never handles a unit.
import { Attack, NuclearAttack } from '@civ-clone/library-unit/Actions';
import planAirTask, {
  airKindOf,
  isParatrooperType,
  paradropTarget,
} from '../../lib/Unit/airWar';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import Paradrop from '@civ-clone/base-unit-action-paradrop/Paradrop';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import { actionToTake } from '../../lib/Unit/moveUnit';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';
import moveUnit from '../../lib/Unit/moveUnit';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';

export class AirWar extends AIStrategy {
  handles(action: PlayerAction): boolean {
    if (!isUnitAction(action)) {
      return false;
    }

    const { ruleRegistry } = this.dependencies(),
      UnitType = (action.value() as Unit).constructor;

    return (
      airKindOf(UnitType, ruleRegistry) !== null ||
      isParatrooperType(UnitType, ruleRegistry)
    );
  }

  async attempt(action: PlayerAction<Unit>): Promise<boolean> {
    const dependencies = this.dependencies(),
      player = action.player(),
      unit = action.value(),
      memory = this.memoryFor(player);

    // A paratrooper drops when it has somewhere to drop; otherwise it's a land unit like any other.
    if (isParatrooperType(unit.constructor, dependencies.ruleRegistry)) {
      const target = paradropTarget(dependencies, player, unit),
        drop =
          target === null
            ? undefined
            : unit
                .actions(target)
                .find((offered): boolean => offered instanceof Paradrop);

      if (!drop) {
        return false;
      }

      unit.action(drop);

      return true;
    }

    const planned = planAirTask(dependencies, player, memory, unit);

    if (planned === null) {
      return false;
    }

    if (planned.task === 'stay') {
      noOrders(dependencies, unit);

      return true;
    }

    if (planned.target !== null && planned.target.isNeighbourOf(unit.tile())) {
      const strike = actionToTake(
        dependencies,
        player,
        unit.actions(planned.target)
      );

      // Only the attack (a nuclear weapon's, for a nuclear weapon): anything else on offer there isn't the task's.
      if (strike instanceof Attack || strike instanceof NuclearAttack) {
        unit.action(strike);
      } else {
        noOrders(dependencies, unit);
      }

      return true;
    }

    const tile = unit.tile(),
      moves = unit.moves().value();

    await moveUnit(dependencies, player, memory, this.knowledge(), unit, {
      stopAtPathEnd: true,
      stopIfBlocked: true,
      wander: false,
    });

    // Once there: home, it stays; beside its target, it strikes on its next action. Otherwise (blocked, or its fuel
    //  kept it from a step) it does nothing more this turn.
    if (
      unit.active() &&
      unit.moves().value() > 0 &&
      (unit.tile() === tile ||
        unit.moves().value() === moves ||
        planned.task === 'home' ||
        planned.target === null ||
        !planned.target.isNeighbourOf(unit.tile()))
    ) {
      memory.unitPathData.delete(unit);
      noOrders(dependencies, unit);
    }

    return true;
  }
}

export default AirWar;
