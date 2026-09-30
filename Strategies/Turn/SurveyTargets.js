"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyTargets = void 0;
// Generic: at the start of each turn, surveys everything the player can see and refills its target board.
const AIStrategy_1 = require("../lib/AIStrategy");
const BeforeTurn_1 = require("@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn");
const surveyTargets_1 = require("../../lib/Turn/surveyTargets");
class SurveyTargets extends AIStrategy_1.default {
    handles(action) {
        return action instanceof BeforeTurn_1.default;
    }
    attempt(action) {
        const player = action.player();
        (0, surveyTargets_1.default)(this.dependencies(), player, this.memoryFor(player), this.knowledge());
        return true;
    }
}
exports.SurveyTargets = SurveyTargets;
exports.default = SurveyTargets;
//# sourceMappingURL=SurveyTargets.js.map