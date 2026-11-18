"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirWar = void 0;
// Generic: aircraft, missiles, nuclear weapons and paratroopers at war (`lib/Unit/airWar`, civ-clone/web-renderer#1124).
//  Only a unit of a kind the ruleset's roles name (`airKindOf`, `isParatrooperType`) is handled: in a ruleset that
//  declares no roles (Civ1) this strategy never handles a unit.
const Actions_1 = require("@civ-clone/library-unit/Actions");
const airWar_1 = require("../../lib/Unit/airWar");
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const Paradrop_1 = require("@civ-clone/base-unit-action-paradrop/Paradrop");
const SingleUse_1 = require("@civ-clone/base-unit-trait-single-use/SingleUse");
const moveUnit_1 = require("../../lib/Unit/moveUnit");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
const moveUnit_2 = require("../../lib/Unit/moveUnit");
const movesBetween_1 = require("../../lib/movesBetween");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
// `knowledge`, letting a missile (`SingleUse`) on its way to `target` take any step that leaves the target within its
//  moves: it's spent in the attack, so it needs no way back. Every other unit, and step, is asked of `knowledge`.
const towards = (knowledge, missile, target) => target === null || !missile.hasTrait(SingleUse_1.default)
    ? knowledge
    : {
        ...knowledge,
        canReturnAfter: (dependencies, player, unit, action) => (unit === missile &&
            (0, movesBetween_1.default)(action.to(), target) <= unit.moves().value() - 1) ||
            knowledge.canReturnAfter(dependencies, player, unit, action),
    };
// Takes `action` for `unit`; one that changes nothing (not its square, its moves or whether it's active) would bring
//  it back each time, so it then stands down.
const takeOrStandDown = (dependencies, unit, action) => {
    const tile = unit.tile(), moves = unit.moves().value();
    unit.action(action);
    if (unit.active() &&
        !unit.destroyed() &&
        unit.tile() === tile &&
        unit.moves().value() === moves) {
        (0, orders_1.noOrders)(dependencies, unit);
    }
};
class AirWar extends AIStrategy_1.default {
    handles(action) {
        if (!(0, isUnitAction_1.default)(action)) {
            return false;
        }
        const { ruleRegistry } = this.dependencies(), UnitType = action.value().constructor;
        return ((0, airWar_1.airKindOf)(UnitType, ruleRegistry) !== null ||
            (0, airWar_1.isParatrooperType)(UnitType, ruleRegistry));
    }
    async attempt(action) {
        const dependencies = this.dependencies(), player = action.player(), unit = action.value(), memory = this.memoryFor(player);
        // A paratrooper drops when it has somewhere to drop; otherwise it's a land unit like any other.
        if ((0, airWar_1.isParatrooperType)(unit.constructor, dependencies.ruleRegistry)) {
            const target = (0, airWar_1.paradropTarget)(dependencies, player, unit), drop = target === null
                ? undefined
                : unit
                    .actions(target)
                    .find((offered) => offered instanceof Paradrop_1.default);
            if (!drop) {
                return false;
            }
            takeOrStandDown(dependencies, unit, drop);
            return true;
        }
        const planned = (0, airWar_1.default)(dependencies, player, memory, unit);
        if (planned === null) {
            return false;
        }
        const knowledge = towards(this.knowledge(), unit, planned.target);
        if (planned.task === 'stay') {
            (0, orders_1.noOrders)(dependencies, unit);
            return true;
        }
        // Beside its target, with a path to none: it strikes, if the attack is on offer and it could still get back after
        //  it (`canReturnAfter`, base-unit-fuel's count), and otherwise heads home.
        if (planned.target !== null && !memory.unitPathData.has(unit)) {
            const strike = (0, moveUnit_1.actionToTake)(dependencies, player, unit.actions(planned.target));
            if ((strike instanceof Actions_1.Attack || strike instanceof Actions_1.NuclearAttack) &&
                knowledge.canReturnAfter(dependencies, player, unit, strike)) {
                takeOrStandDown(dependencies, unit, strike);
                return true;
            }
            await this.goHome(player, unit, knowledge);
            return true;
        }
        const tile = unit.tile(), moves = unit.moves().value();
        await (0, moveUnit_2.default)(dependencies, player, memory, knowledge, unit, {
            stopAtPathEnd: true,
            stopIfBlocked: true,
            wander: false,
        });
        if (!unit.active() || unit.moves().value() <= 0) {
            return true;
        }
        // Beside its target, having moved: it strikes on its next action.
        if (planned.task === 'strike' &&
            planned.target !== null &&
            planned.target.isNeighbourOf(unit.tile()) &&
            (unit.tile() !== tile || unit.moves().value() !== moves)) {
            return true;
        }
        // Otherwise (home already, blocked, or a step its fuel wouldn't allow): back to where it refuels, once, then
        //  nothing more this turn.
        await this.goHome(player, unit, knowledge, planned.task === 'home' && unit.tile() === tile);
        return true;
    }
    // Flies `unit` back to where it refuels (`planHome`), unless `tried` already, and then ends its turn wherever it is.
    async goHome(player, unit, knowledge, tried = false) {
        const dependencies = this.dependencies(), memory = this.memoryFor(player);
        if (!tried &&
            (0, airWar_1.planHome)(dependencies, player, memory, unit).task === 'home') {
            await (0, moveUnit_2.default)(dependencies, player, memory, knowledge, unit, {
                stopAtPathEnd: true,
                stopIfBlocked: true,
                wander: false,
            });
        }
        if (unit.active() && unit.moves().value() > 0) {
            memory.unitPathData.delete(unit);
            (0, orders_1.noOrders)(dependencies, unit);
        }
    }
}
exports.AirWar = AirWar;
exports.default = AirWar;
//# sourceMappingURL=AirWar.js.map