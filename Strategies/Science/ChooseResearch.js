"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseResearch = void 0;
// Generic: picks what to research next, at random from what's available, preferring the advances the player's leader
//  wants by the ruleset's `WantedAdvancesPolicy`, if it's given one. Always handles the choice.
const wantedAdvances_1 = require("../../lib/Science/wantedAdvances");
const AIStrategy_1 = require("../lib/AIStrategy");
const PlayerResearch_1 = require("@civ-clone/core-science/PlayerResearch");
const chooseResearch_1 = require("../../lib/Science/chooseResearch");
class ChooseResearch extends AIStrategy_1.default {
    constructor(dependencies, knowledge, policy = null) {
        super(dependencies, knowledge);
        this._policy = policy;
    }
    handles(action) {
        return action.value() instanceof PlayerResearch_1.default;
    }
    attempt(action) {
        const playerResearch = action.value();
        (0, chooseResearch_1.default)(this.dependencies(), playerResearch, this._policy === null
            ? []
            : (0, wantedAdvances_1.wantedAdvances)(this.dependencies(), playerResearch.player(), this._policy));
        return true;
    }
}
exports.ChooseResearch = ChooseResearch;
exports.default = ChooseResearch;
//# sourceMappingURL=ChooseResearch.js.map