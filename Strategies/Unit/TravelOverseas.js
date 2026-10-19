"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelOverseas = void 0;
// Generic: a passenger's turn (`lib/Unit/overseas`): walking to its port, boarding a transport alongside, or waiting
//  in port for one (civ-clone/web-renderer#211, #374), and any land unit's turn at sea. Handles the action only for a unit with an overseas plan that
//  still holds; otherwise the next strategies give it work.
const overseas_1 = require("../../lib/Unit/overseas");
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
const Types_1 = require("@civ-clone/library-unit/Types");
const moveUnit_1 = require("../../lib/Unit/moveUnit");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
// A land unit on a water tile: aboard a ship, or unloaded beside a coast.
const isAtSea = (unit) => unit instanceof Types_1.Land && unit.tile().isWater();
class TravelOverseas extends AIStrategy_1.default {
    handles(action) {
        return ((0, isUnitAction_1.default)(action) &&
            ((0, overseas_1.overseasStateFor)(this.memoryFor(action.player())).passengers.has(action.value()) ||
                isAtSea(action.value())));
    }
    async attempt(action) {
        const player = action.player(), unit = action.value(), memory = this.memoryFor(player), known = (0, overseas_1.overseasStateFor)(memory).passengers.get(unit);
        // At sea: a passenger waits for its ship to put it ashore (`unloadTransport`). Any other land unit goes ashore if
        //  it can, and otherwise waits: next to a coast held by an enemy, it may have nowhere to step.
        if (isAtSea(unit)) {
            if (!known) {
                await (0, moveUnit_1.default)(this.dependencies(), player, memory, this.knowledge(), unit);
            }
            if (unit.active() && unit.moves().value() > 0) {
                (0, orders_1.noOrders)(this.dependencies(), unit);
            }
            return true;
        }
        if (!known) {
            return false;
        }
        const passenger = (0, overseas_1.planPassenger)(this.dependencies(), player, memory, unit, known.role, (0, overseas_1.candidatesFor)(this.dependencies(), this.knowledge(), player, memory, unit, known.role));
        if (!passenger) {
            (0, overseas_1.dropPassenger)(memory, unit);
            return false;
        }
        if ((0, overseas_1.travel)(this.dependencies(), player, memory, unit, passenger)) {
            return true;
        }
        await (0, moveUnit_1.default)(this.dependencies(), player, memory, this.knowledge(), unit);
        return true;
    }
}
exports.TravelOverseas = TravelOverseas;
exports.default = TravelOverseas;
//# sourceMappingURL=TravelOverseas.js.map