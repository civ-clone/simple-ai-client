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
const moveUnit_1 = require("../../lib/Unit/moveUnit");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
const moveUnit_2 = require("../../lib/Unit/moveUnit");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
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
            unit.action(drop);
            return true;
        }
        const planned = (0, airWar_1.default)(dependencies, player, memory, unit);
        if (planned === null) {
            return false;
        }
        if (planned.task === 'stay') {
            (0, orders_1.noOrders)(dependencies, unit);
            return true;
        }
        if (planned.target !== null && planned.target.isNeighbourOf(unit.tile())) {
            const strike = (0, moveUnit_1.actionToTake)(dependencies, player, unit.actions(planned.target));
            // Only the attack (a nuclear weapon's, for a nuclear weapon): anything else on offer there isn't the task's.
            if (strike instanceof Actions_1.Attack || strike instanceof Actions_1.NuclearAttack) {
                unit.action(strike);
            }
            else {
                (0, orders_1.noOrders)(dependencies, unit);
            }
            return true;
        }
        const tile = unit.tile(), moves = unit.moves().value();
        await (0, moveUnit_2.default)(dependencies, player, memory, this.knowledge(), unit, {
            stopAtPathEnd: true,
            stopIfBlocked: true,
            wander: false,
        });
        // Once there: home, it stays; beside its target, it strikes on its next action. Otherwise (blocked, or its fuel
        //  kept it from a step) it does nothing more this turn.
        if (unit.active() &&
            unit.moves().value() > 0 &&
            (unit.tile() === tile ||
                unit.moves().value() === moves ||
                planned.task === 'home' ||
                planned.target === null ||
                !planned.target.isNeighbourOf(unit.tile()))) {
            memory.unitPathData.delete(unit);
            (0, orders_1.noOrders)(dependencies, unit);
        }
        return true;
    }
}
exports.AirWar = AirWar;
exports.default = AirWar;
//# sourceMappingURL=AirWar.js.map