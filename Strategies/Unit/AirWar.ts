// Generic: aircraft, missiles, nuclear weapons and paratroopers at war (`lib/Unit/airWar`, civ-clone/web-renderer#1124).
//  Only a unit of a kind the ruleset's roles name (`airKindOf`, `isParatrooperType`) is handled: in a ruleset that
//  declares no roles (Civ1) this strategy never handles a unit.
import { Attack, NuclearAttack } from '@civ-clone/library-unit/Actions';
import planAirTask, {
  airKindOf,
  isParatrooperType,
  paradropTargets,
  planHome,
} from '../../lib/Unit/airWar';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import Action from '@civ-clone/core-unit/Action';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Paradrop from '@civ-clone/base-unit-action-paradrop/Paradrop';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { actionToTake } from '../../lib/Unit/moveUnit';
import isUnitAction from '@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction';
import moveUnit from '../../lib/Unit/moveUnit';
import movesBetween from '../../lib/movesBetween';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';

// `knowledge`, letting a missile (`SingleUse`) on its way to `target` take any step that leaves the target within its
//  moves: it's spent in the attack, so it needs no way back. Every other unit, and step, is asked of `knowledge`.
const towards = (
  knowledge: Knowledge,
  missile: Unit,
  target: Tile | null
): Knowledge =>
  target === null || !missile.hasTrait(SingleUse)
    ? knowledge
    : {
        ...knowledge,
        canReturnAfter: (dependencies, player, unit, action: Action) =>
          (unit === missile &&
            movesBetween(action.to(), target) <= unit.moves().value() - 1) ||
          knowledge.canReturnAfter(dependencies, player, unit, action),
      };

// Takes `action` for `unit`; one that changes nothing (not its square, its moves or whether it's active) would bring
//  it back each time, so it then stands down.
const takeOrStandDown = (
  dependencies: Dependencies,
  unit: Unit,
  action: Action
): void => {
  const tile = unit.tile(),
    moves = unit.moves().value();

  unit.action(action);

  if (
    unit.active() &&
    !unit.destroyed() &&
    unit.tile() === tile &&
    unit.moves().value() === moves
  ) {
    noOrders(dependencies, unit);
  }
};

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
      // The first target the rules offer a drop onto (their measure of range may differ from ours).
      const drop = paradropTargets(dependencies, player, unit)
        .map((target) =>
          unit
            .actions(target)
            .find((offered): boolean => offered instanceof Paradrop)
        )
        .find((offered) => offered !== undefined);

      if (!drop) {
        return false;
      }

      takeOrStandDown(dependencies, unit, drop);

      return true;
    }

    const planned = planAirTask(dependencies, player, memory, unit);

    if (planned === null) {
      return false;
    }

    const knowledge = towards(this.knowledge(), unit, planned.target);

    if (planned.task === 'stay') {
      noOrders(dependencies, unit);

      return true;
    }

    // Beside its target, with a path to none: it strikes, if the attack is on offer and it could still get back after
    //  it (`canReturnAfter`, base-unit-fuel's count), and otherwise heads home.
    if (planned.target !== null && !memory.unitPathData.has(unit)) {
      const strike = actionToTake(
        dependencies,
        player,
        unit.actions(planned.target)
      );

      if (
        (strike instanceof Attack || strike instanceof NuclearAttack) &&
        knowledge.canReturnAfter(dependencies, player, unit, strike)
      ) {
        takeOrStandDown(dependencies, unit, strike);

        return true;
      }

      await this.goHome(player, unit, knowledge);

      return true;
    }

    const tile = unit.tile(),
      moves = unit.moves().value();

    await moveUnit(dependencies, player, memory, knowledge, unit, {
      stopAtPathEnd: true,
      stopIfBlocked: true,
      wander: false,
    });

    if (!unit.active() || unit.moves().value() <= 0) {
      return true;
    }

    // Beside its target, having moved: it strikes on its next action.
    if (
      planned.task === 'strike' &&
      planned.target !== null &&
      planned.target.isNeighbourOf(unit.tile()) &&
      (unit.tile() !== tile || unit.moves().value() !== moves)
    ) {
      return true;
    }

    // Otherwise (home already, blocked, or a step its fuel wouldn't allow): back to where it refuels, once, then
    //  nothing more this turn.
    await this.goHome(
      player,
      unit,
      knowledge,
      planned.task === 'home' && unit.tile() === tile
    );

    return true;
  }

  // Flies `unit` back to where it refuels (`planHome`), unless `tried` already, and then ends its turn wherever it is.
  private async goHome(
    player: Player,
    unit: Unit,
    knowledge: Knowledge,
    tried: boolean = false
  ): Promise<void> {
    const dependencies = this.dependencies(),
      memory = this.memoryFor(player);

    if (
      !tried &&
      planHome(dependencies, player, memory, unit).task === 'home'
    ) {
      await moveUnit(dependencies, player, memory, knowledge, unit, {
        stopAtPathEnd: true,
        stopIfBlocked: true,
        wander: false,
      });
    }

    if (unit.active() && unit.moves().value() > 0) {
      memory.unitPathData.delete(unit);
      noOrders(dependencies, unit);
    }
  }
}

export default AirWar;
