"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewCities = void 0;
// Generic: at the start of each turn, assigns each of the player's cities' workers and notes any city left undefended.
const AIStrategy_1 = require("../lib/AIStrategy");
const BeforeTurn_1 = require("@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn");
const reviewCities_1 = require("../../lib/Turn/reviewCities");
class ReviewCities extends AIStrategy_1.default {
    handles(action) {
        return action instanceof BeforeTurn_1.default;
    }
    attempt(action) {
        const player = action.player();
        (0, reviewCities_1.default)(this.dependencies(), player, this.memoryFor(player).targets, this.knowledge());
        return true;
    }
}
exports.ReviewCities = ReviewCities;
exports.default = ReviewCities;
//# sourceMappingURL=ReviewCities.js.map