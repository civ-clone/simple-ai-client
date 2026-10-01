"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseGovernment = void 0;
// Civ1: once the Anarchy is over, the government the player would choose now (`lib/Civ1/government`). Always handles
//  the choice.
const AIStrategy_1 = require("../lib/AIStrategy");
const PlayerGovernment_1 = require("@civ-clone/core-government/PlayerGovernment");
const government_1 = require("../../lib/Civ1/government");
class ChooseGovernment extends AIStrategy_1.default {
    handles(action) {
        return action.value() instanceof PlayerGovernment_1.default;
    }
    attempt(action) {
        (0, government_1.pickGovernment)(this.dependencies(), action.value());
        return true;
    }
}
exports.ChooseGovernment = ChooseGovernment;
exports.default = ChooseGovernment;
//# sourceMappingURL=ChooseGovernment.js.map