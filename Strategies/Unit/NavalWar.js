"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavalWar = void 0;
// Generic: a warship hunts enemy ships, escorts its player's loaded transports and bombards enemy coastal cities
//  (`lib/Unit/navalWar`, civ-clone/web-renderer#1128). Only a unit the ruleset's roles make a warship is handled, and
//  only when it has one of those tasks: in a ruleset that declares no roles (Civ1) this strategy never handles a unit.
const navalWar_1 = require("../../lib/Unit/navalWar");
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const Actions_1 = require("@civ-clone/library-unit/Actions");
const moveUnit_1 = require("../../lib/Unit/moveUnit");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
const moveUnit_2 = require("../../lib/Unit/moveUnit");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
class NavalWar extends AIStrategy_1.default {
    handles(action) {
        return ((0, isUnitAction_1.default)(action) &&
            (0, navalWar_1.isWarship)(action.value(), this.dependencies().ruleRegistry));
    }
    async attempt(action) {
        const dependencies = this.dependencies(), player = action.player(), unit = action.value(), memory = this.memoryFor(player), planned = (0, navalWar_1.default)(dependencies, player, memory, unit);
        if (planned === null) {
            return false;
        }
        if (planned.strike !== null) {
            const strike = (0, moveUnit_1.actionToTake)(dependencies, player, unit.actions(planned.strike));
            // Only the battle: anything else on offer there (a treaty partner's ship, say) isn't the task's.
            if (strike instanceof Actions_1.Attack) {
                unit.action(strike);
            }
            else {
                (0, orders_1.noOrders)(dependencies, unit);
            }
            return true;
        }
        // An escort already where its transport is going waits there for it.
        if (!memory.unitPathData.has(unit)) {
            (0, orders_1.noOrders)(dependencies, unit);
            return true;
        }
        await (0, moveUnit_2.default)(dependencies, player, memory, this.knowledge(), unit, {
            wander: false,
        });
        return true;
    }
}
exports.NavalWar = NavalWar;
exports.default = NavalWar;
//# sourceMappingURL=NavalWar.js.map