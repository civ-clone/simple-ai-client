"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseGovernment = void 0;
// Once the ruleset's revolution allows the choice, the government the player would choose now (`lib/Civ1/government`).
//  Handles the choice unless the ruleset names no revolution (no `RevolutionTerms`).
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const PlayerGovernment_1 = require("@civ-clone/core-government/PlayerGovernment");
const government_1 = require("../../lib/Civ1/government");
class ChooseGovernment extends AIStrategy_1.default {
    handles(action) {
        return action.value() instanceof PlayerGovernment_1.default;
    }
    attempt(action) {
        return (0, government_1.pickGovernment)(this.dependencies(), action.value());
    }
}
exports.ChooseGovernment = ChooseGovernment;
exports.default = ChooseGovernment;
//# sourceMappingURL=ChooseGovernment.js.map