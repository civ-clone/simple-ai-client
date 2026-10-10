"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseProduction = void 0;
// Civ1: what a city builds next. Always handles the choice. `SimpleAIClient#unitDestroyed` also asks it directly,
//  outside the turn (`choose`).
const buildItemInCity_1 = require("../../lib/Civ1/buildItemInCity");
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
class ChooseProduction extends AIStrategy_1.default {
    // `policyFor` gives each player's `ProductionPolicy`, the same for everyone by default: the leader's personality comes
    //  in through the rules `buildItemInCity` reads (civ-clone/web-renderer#157).
    constructor(dependencies, knowledge, policyFor = () => buildItemInCity_1.defaultProductionPolicy) {
        super(dependencies, knowledge);
        this._policyFor = policyFor;
    }
    handles(action) {
        return action.value() instanceof CityBuild_1.default;
    }
    attempt(action) {
        this.choose(action.player(), action.value().city());
        return true;
    }
    // Picks what `city` builds by `player`'s `ProductionPolicy`. `SimpleAIClient#unitDestroyed` calls this directly, so
    //  that its emergency rebuild follows the same policy as the player's other choices.
    choose(player, city) {
        (0, buildItemInCity_1.default)(this.dependencies(), player, this.memoryFor(player).targets, city, this._policyFor(player), this.knowledge());
    }
}
exports.ChooseProduction = ChooseProduction;
exports.default = ChooseProduction;
//# sourceMappingURL=ChooseProduction.js.map