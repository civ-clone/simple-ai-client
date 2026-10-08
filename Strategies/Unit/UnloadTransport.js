"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnloadTransport = void 0;
// Generic: a transport at the coast unloads cargo that hasn't just come from there, then waits. Handles the action
//  only when it unloads. The first unit strategy to read the unit's turn context, so the one that creates it.
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
const unitTurnContextFor_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/unitTurnContextFor");
const unloadTransport_1 = require("../../lib/Unit/unloadTransport");
class UnloadTransport extends AIStrategy_1.default {
    handles(action) {
        return (0, isUnitAction_1.default)(action);
    }
    attempt(action) {
        // Read for every unit, not only transports: this is where each unit's turn reads its context.
        const { actions: { unload }, tile, } = (0, unitTurnContextFor_1.default)(this.dependencies(), action);
        return (0, unloadTransport_1.default)(this.memoryFor(action.player()), action.value(), tile, unload);
    }
}
exports.UnloadTransport = UnloadTransport;
exports.default = UnloadTransport;
//# sourceMappingURL=UnloadTransport.js.map