"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WakeCarrierAircraft = void 0;
// Generic: at the start of each turn, gives orders to aircraft resting aboard the player's carriers.
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const BeforeTurn_1 = require("@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn");
const wakeCarrierAircraft_1 = require("../../lib/Turn/wakeCarrierAircraft");
class WakeCarrierAircraft extends AIStrategy_1.default {
    handles(action) {
        return action instanceof BeforeTurn_1.default;
    }
    attempt(action) {
        (0, wakeCarrierAircraft_1.default)(this.dependencies(), action.player(), this.knowledge());
        return true;
    }
}
exports.WakeCarrierAircraft = WakeCarrierAircraft;
exports.default = WakeCarrierAircraft;
//# sourceMappingURL=WakeCarrierAircraft.js.map