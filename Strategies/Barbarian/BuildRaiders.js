"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildRaiders = void 0;
// Civ1: what a barbarian city builds (civ-clone/web-renderer#27, decision 3): of the units the `Build` rules allow it
//  (`civ1-barbarians` allows attacking units at least two civilizations can build), the strongest attacker, by its
//  attack and then its cost; without one, the strongest defender. Never an improvement or a Wonder.
const Attack_1 = require("@civ-clone/core-unit/Yields/Attack");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
const Defence_1 = require("@civ-clone/core-unit/Yields/Defence");
const Strategy_1 = require("@civ-clone/core-strategy/Strategy");
const Unit_1 = require("@civ-clone/core-unit/Unit");
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
            .filter((buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item()))
            .map((item) => ({
            attack: (0, unitType_1.default)(this._dependencies, item.item(), Attack_1.default),
            cost: item.cost().value(),
            defence: (0, unitType_1.default)(this._dependencies, item.item(), Defence_1.default),
            item,
        })), attackers = units.filter((candidate) => candidate.attack > candidate.defence), byStrength = (key) => (a, b) => b[key] - a[key] || b.cost - a.cost, [best] = attackers.length > 0
            ? attackers.sort(byStrength('attack'))
            : units.sort(byStrength('defence'));
        return (_a = best === null || best === void 0 ? void 0 : best.item) !== null && _a !== void 0 ? _a : null;
    }
}
exports.BuildRaiders = BuildRaiders;
exports.default = BuildRaiders;
//# sourceMappingURL=BuildRaiders.js.map