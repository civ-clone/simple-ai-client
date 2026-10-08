"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defendersIn = exports.isDefenderType = exports.isDefender = exports.keepsOrder = exports.wantsUnit = exports.wantsMartialLawUnit = exports.wantsDefender = exports.martialLawUnitsIn = exports.defendersWanted = exports.martialLawUnitsWanted = void 0;
// Generic: how many defenders a city wants, judged the same way by city production and by the units deciding whether to
//  stay and fortify there. When the two disagreed, cities built a defender, it walked off, and they built another.
const Yields_1 = require("@civ-clone/library-city/Yields");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Yields_2 = require("@civ-clone/core-unit/Yields");
const Types_1 = require("@civ-clone/library-unit/Types");
const Yield_1 = require("@civ-clone/core-yield/Yield");
const unitType_1 = require("../Unit/unitType");
// More unhappy citizens than any city has, for `calmedWithoutMartialLaw`.
const CROWD = 100;
// The unhappiness in `yields` before anything calms it (`positive`), and how much of it anything but martial law calms
//  (`other`): Temples and the like (`CityImprovementContent`), and Wonders, which give a plain negative `Unhappiness`.
const unhappiness = (yields) => yields
    .filter((cityYield) => cityYield instanceof Yields_1.Unhappiness)
    .reduce((totals, cityYield) => {
    const value = cityYield.value();
    if (value > 0) {
        totals.positive += value;
    }
    else if (!(cityYield instanceof Yields_1.MartialLaw)) {
        totals.other -= value;
    }
    return totals;
}, { positive: 0, other: 0 });
// How many unhappy citizens `city`'s improvements, Wonders and anything else but martial law can make content, by the
//  ruleset's own `Cost` rules, run as `City#yields` runs them but over nothing but a crowd of unhappy citizens. They
//  only say what they can do when they have someone to calm: in a city where something applied before them has
//  calmed everyone, they say nothing. (Civ1's martial law now comes after the improvements, but Shakespeare's Theatre
//  still comes after it.)
const calmedWithoutMartialLaw = (dependencies, city) => {
    const yields = [new Yields_1.Unhappiness(CROWD)];
    dependencies.ruleRegistry.get(Cost_1.default).forEach((rule) => {
        if (!rule.validate(city, yields)) {
            return;
        }
        const costs = rule.process(city, yields);
        if (costs) {
            yields.push(...(costs instanceof Yield_1.default ? [costs] : costs));
        }
    });
    return unhappiness(yields).other;
};
// How many units in `city` martial law would use: one for each citizen unhappy before anything calms them, less those
//  its improvements, Wonders and the rest can calm, up to the policy's limit. Those counts are the ruleset's rules' own,
//  so they're the same whether or not the city has made Entertainers yet, and whatever order the rules apply in. A
//  citizen a unit keeps content leaves its tile worked, where an Entertainer gives it up. A caller that has `city`'s
//  yields already passes them in, as working them out isn't cheap (civ-clone/web-renderer#315).
const martialLawUnitsWanted = (dependencies, knowledge, city, yields) => {
    const limit = knowledge.martialLaw.limit(dependencies, city);
    if (limit <= 0) {
        return 0;
    }
    return Math.min(limit, Math.max(0, unhappiness(yields !== null && yields !== void 0 ? yields : city.yields()).positive -
        calmedWithoutMartialLaw(dependencies, city)));
};
exports.martialLawUnitsWanted = martialLawUnitsWanted;
// One defender, and one more for each five sizes over five.
const defendersWanted = (dependencies, city) => Math.ceil(dependencies.cityGrowthRegistry.getByCity(city).size() / 5);
exports.defendersWanted = defendersWanted;
// The units in `city` that martial law is using now, by the ruleset's own rules. A defender keeps order as well as any
//  unit, and so might a unit that couldn't defend the city at all.
const martialLawUnitsIn = (city, yields = city.yields()) => yields
    .filter((cityYield) => cityYield instanceof Yields_1.MartialLaw)
    .map((cityYield) => cityYield.unit());
exports.martialLawUnitsIn = martialLawUnitsIn;
// Whether `city` wants another defender in it.
const wantsDefender = (dependencies, city) => (0, exports.defendersIn)(dependencies, city).length < (0, exports.defendersWanted)(dependencies, city);
exports.wantsDefender = wantsDefender;
// Whether `city` wants another unit in it for martial law to use.
const wantsMartialLawUnit = (dependencies, knowledge, city, yields = city.yields()) => (0, exports.martialLawUnitsIn)(city, yields).length <
    (0, exports.martialLawUnitsWanted)(dependencies, knowledge, city, yields);
exports.wantsMartialLawUnit = wantsMartialLawUnit;
// Whether `city` wants another unit in it: a defender, or a unit for martial law to use.
const wantsUnit = (dependencies, knowledge, city) => (0, exports.wantsDefender)(dependencies, city) ||
    (0, exports.wantsMartialLawUnit)(dependencies, knowledge, city);
exports.wantsUnit = wantsUnit;
// Whether `city` needs `unit` to keep order: martial law is using it, and wouldn't have the units it wants without it.
const keepsOrder = (dependencies, knowledge, city, unit) => {
    const yields = city.yields(), inUse = (0, exports.martialLawUnitsIn)(city, yields);
    return (inUse.includes(unit) &&
        inUse.length <= (0, exports.martialLawUnitsWanted)(dependencies, knowledge, city, yields));
};
exports.keepsOrder = keepsOrder;
// A unit that could defend a city: not, say, Settlers or a ship.
const isDefender = (unit) => unit instanceof Types_1.Fortifiable && unit.defence().value() > 0;
exports.isDefender = isDefender;
// A type of unit that could defend a city, as `isDefender` judges a unit: not, say, a Diplomat.
const isDefenderType = (dependencies, UnitType) => Object.prototype.isPrototypeOf.call(Types_1.Fortifiable, UnitType) &&
    (0, unitType_1.default)(dependencies, UnitType, Yields_2.Defence) > 0;
exports.isDefenderType = isDefenderType;
// The units on the city's tile that could defend it, fortified or not.
const defendersIn = (dependencies, city) => dependencies.unitRegistry.getByTile(city.tile()).filter(exports.isDefender);
exports.defendersIn = defendersIn;
//# sourceMappingURL=defence.js.map