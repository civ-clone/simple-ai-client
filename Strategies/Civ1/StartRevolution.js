"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartRevolution = void 0;
// Civ1: at the start of each turn, starts a revolution, as a human player would, when the player would choose another
//  government than the one it has (`lib/Civ1/government`).
const AIStrategy_1 = require("../lib/AIStrategy");
const BeforeTurn_1 = require("@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn");
const government_1 = require("../../lib/Civ1/government");
class StartRevolution extends AIStrategy_1.default {
    handles(action) {
        return action instanceof BeforeTurn_1.default;
    }
    attempt(action) {
        (0, government_1.startRevolution)(this.dependencies(), action.player());
        return true;
    }
}
exports.StartRevolution = StartRevolution;
exports.default = StartRevolution;
//# sourceMappingURL=StartRevolution.js.map