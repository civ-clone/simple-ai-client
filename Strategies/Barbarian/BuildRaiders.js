"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildRaiders = void 0;
// Civ1: what a barbarian city builds (civ-clone/web-renderer#27, decision 3): of the land units the `Build` rules allow
//  it (`civ1-barbarians` allows attacking land units at least two civilizations can build), the newest attacker, by its
//  cost and then its attack; without one, the strongest defender. Never a ship, an aircraft, a missile, an improvement
//  or a Wonder: `Raid` moves nothing but land units and transports.
const Attack_1 = require("@civ-clone/core-unit/Yields/Attack");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
const Defence_1 = require("@civ-clone/core-unit/Yields/Defence");
const Types_1 = require("@civ-clone/library-unit/Types");
const Strategy_1 = require("@civ-clone/core-strategy/Strategy");
const unitType_1 = require("../../lib/Unit/unitType");
class BuildRaiders extends Strategy_1.default {
    constructor(dependencies) {
        super(dependencies.ruleRegistry);
        this._dependencies = dependencies;
    }
    handles(action) {
        return action.value() instanceof CityBuild_1.default;
    }
    attempt(action) {
        const cityBuild = action.value(), choice = this.choose(cityBuild.available());
        if (choice === null) {
            return false;
        }
        cityBuild.build(choice.item());
        return true;
    }
    choose(available) {
        var _a;
        const units = available
            .filter((buildItem) => Object.prototype.isPrototypeOf.call(Types_1.Land, buildItem.item()))
            .map((item) => ({
            attack: (0, unitType_1.default)(this._dependencies, item.item(), Attack_1.default),
            cost: item.cost().value(),
            defence: (0, unitType_1.default)(this._dependencies, item.item(), Defence_1.default),
            item,
        })), attackers = units.filter((candidate) => candidate.attack > candidate.defence), 
        // The newest attacker: by cost, which rises with the advances (civ-clone/web-renderer#27, decision 3).
        [best] = attackers.length > 0
            ? attackers.sort((a, b) => b.cost - a.cost || b.attack - a.attack)
            : units.sort((a, b) => b.defence - a.defence || b.cost - a.cost);
        return (_a = best === null || best === void 0 ? void 0 : best.item) !== null && _a !== void 0 ? _a : null;
    }
}
exports.BuildRaiders = BuildRaiders;
exports.default = BuildRaiders;
//# sourceMappingURL=BuildRaiders.js.map