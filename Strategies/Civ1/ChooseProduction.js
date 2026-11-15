"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseProduction = void 0;
// Civ1: what a city builds next. Always handles the choice. `SimpleAIClient#unitDestroyed` also asks it directly,
//  outside the turn (`choose`). And at the start of each turn, a city building Capitalization (an item that's never
//  finished, so the choice is never offered again) chooses again, so that it builds something once something is worth
//  building; it only stays on Capitalization while nothing is. Only a ruleset with Capitalization has such a city.
const buildItemInCity_1 = require("../../lib/Civ1/buildItemInCity");
const BeforeTurn_1 = require("@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn");
const capitalizationRules_1 = require("@civ-clone/base-city-improvement-capitalization/lib/capitalizationRules");
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
        return action instanceof BeforeTurn_1.default || action.value() instanceof CityBuild_1.default;
    }
    attempt(action) {
        if (action instanceof BeforeTurn_1.default) {
            this.reviewCapitalization(action.player());
            return true;
        }
        this.choose(action.player(), action.value().city());
        return true;
    }
    // Chooses again for each of `player`'s cities building Capitalization.
    reviewCapitalization(player) {
        const dependencies = this.dependencies();
        dependencies.cityRegistry
            .getByPlayer(player)
            .filter((city) => (0, capitalizationRules_1.isBuildingCapitalization)(dependencies.cityBuildRegistry.getByCity(city)))
            .forEach((city) => this.choose(player, city));
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