"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeLosesShields = exports.progressAfterChange = exports.hasChangeRules = void 0;
const ProductionChanged_1 = require("@civ-clone/core-city-build/Rules/ProductionChanged");
// Whether the ruleset has any rule for what a change of item keeps.
const hasChangeRules = (dependencies) => dependencies.ruleRegistry.get(ProductionChanged_1.default).length > 0;
exports.hasChangeRules = hasChangeRules;
// The progress `cityBuild` would keep if it changed to `to` now: the first answer of the `ProductionChanged` rules, asked
//  as `CityBuild#build` asks them, from the item it's building (or the one it last cleared) and its progress as it is.
//  `CityBuild` asks from where the turn started when the build has already changed this turn, which it keeps to
//  itself; so a second change in a turn is judged from the first change's result here.
const progressAfterChange = (dependencies, cityBuild, to) => {
    var _a, _b, _c, _d;
    const progress = cityBuild.progress().value(), from = (_d = (_b = (_a = cityBuild.building()) === null || _a === void 0 ? void 0 : _a.item()) !== null && _b !== void 0 ? _b : (_c = cityBuild.cleared()) === null || _c === void 0 ? void 0 : _c.item) !== null && _d !== void 0 ? _d : null;
    if (from === to) {
        return progress;
    }
    const [answer] = dependencies.ruleRegistry.process(ProductionChanged_1.default, cityBuild, from, to, progress);
    return answer !== null && answer !== void 0 ? answer : progress;
};
exports.progressAfterChange = progressAfterChange;
// Whether changing `cityBuild` to `to` now would lose shields.
const changeLosesShields = (dependencies, cityBuild, to) => (0, exports.progressAfterChange)(dependencies, cityBuild, to) <
    cityBuild.progress().value();
exports.changeLosesShields = changeLosesShields;
exports.default = exports.progressAfterChange;
//# sourceMappingURL=productionChange.js.map