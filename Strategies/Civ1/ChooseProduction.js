"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseProduction = void 0;
// Civ1: what a city builds next. Always handles the choice. `SimpleAIClient#unitDestroyed` also runs the same module
//  directly, outside the turn.
const AIStrategy_1 = require("../lib/AIStrategy");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
const buildItemInCity_1 = require("../../lib/Civ1/buildItemInCity");
class ChooseProduction extends AIStrategy_1.default {
    handles(action) {
        return action.value() instanceof CityBuild_1.default;
    }
    attempt(action) {
        const player = action.player();
        (0, buildItemInCity_1.default)(this.dependencies(), player, this.memoryFor(player).targets, action.value().city());
        return true;
    }
}
exports.ChooseProduction = ChooseProduction;
exports.default = ChooseProduction;
//# sourceMappingURL=ChooseProduction.js.map