"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseYieldOf = void 0;
// Generic: what a type of unit is like before anything modifies it, for judging a unit a city might build.
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
// The value of a unit type's `YieldType` (`Attack`, `Defence`) by the ruleset's `BaseYield` rules.
const baseYieldOf = (dependencies, UnitType, YieldType) => {
    const unitYield = new YieldType();
    dependencies.ruleRegistry.process(Yield_1.BaseYield, UnitType, unitYield);
    return unitYield.value();
};
exports.baseYieldOf = baseYieldOf;
exports.default = exports.baseYieldOf;
//# sourceMappingURL=unitType.js.map