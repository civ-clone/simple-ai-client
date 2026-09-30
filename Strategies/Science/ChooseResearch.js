"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseResearch = void 0;
// Generic: picks what to research next, at random from what's available. Always handles the choice.
const AIStrategy_1 = require("../lib/AIStrategy");
const PlayerResearch_1 = require("@civ-clone/core-science/PlayerResearch");
const chooseResearch_1 = require("../../lib/Science/chooseResearch");
class ChooseResearch extends AIStrategy_1.default {
    handles(action) {
        return action.value() instanceof PlayerResearch_1.default;
    }
    attempt(action) {
        (0, chooseResearch_1.default)(this.dependencies(), action.value());
        return true;
    }
}
exports.ChooseResearch = ChooseResearch;
exports.default = ChooseResearch;
//# sourceMappingURL=ChooseResearch.js.map