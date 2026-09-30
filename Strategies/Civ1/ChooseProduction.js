"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseProduction = void 0;
// Civ1: what a city builds next. Always handles the choice. `SimpleAIClient#unitDestroyed` also runs the same module
//  directly, outside the turn.
const buildItemInCity_1 = require("../../lib/Civ1/buildItemInCity");
const AIStrategy_1 = require("../lib/AIStrategy");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
class ChooseProduction extends AIStrategy_1.default {
    // `policyFor` gives each player's `ProductionPolicy`: the same for everyone until civ-clone/web-renderer#157 derives
    //  it from the leader's traits.
    constructor(dependencies, knowledge, policyFor = () => buildItemInCity_1.defaultProductionPolicy) {
        super(dependencies, knowledge);
        this._policyFor = policyFor;
    }
    handles(action) {
        return action.value() instanceof CityBuild_1.default;
    }
    attempt(action) {
        const player = action.player();
        (0, buildItemInCity_1.default)(this.dependencies(), player, this.memoryFor(player).targets, action.value().city(), this._policyFor(player));
        return true;
    }
}
exports.ChooseProduction = ChooseProduction;
exports.default = ChooseProduction;
//# sourceMappingURL=ChooseProduction.js.map