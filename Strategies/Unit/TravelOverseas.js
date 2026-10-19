"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelOverseas = void 0;
// Generic: a passenger's turn (`lib/Unit/overseas`): walking to its port, boarding a transport alongside, or waiting
//  in port for one (civ-clone/web-renderer#211, #374). Handles the action only for a unit with an overseas plan that
//  still holds; otherwise the next strategies give it work.
const overseas_1 = require("../../lib/Unit/overseas");
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
const moveUnit_1 = require("../../lib/Unit/moveUnit");
class TravelOverseas extends AIStrategy_1.default {
    handles(action) {
        return ((0, isUnitAction_1.default)(action) &&
            (0, overseas_1.overseasStateFor)(this.memoryFor(action.player())).passengers.has(action.value()));
    }
    async attempt(action) {
        const player = action.player(), unit = action.value(), memory = this.memoryFor(player), known = (0, overseas_1.overseasStateFor)(memory).passengers.get(unit), passenger = (0, overseas_1.planPassenger)(this.dependencies(), player, memory, unit, known.role, (0, overseas_1.candidatesFor)(this.dependencies(), this.knowledge(), player, memory, unit, known.role));
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