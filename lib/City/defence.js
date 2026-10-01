"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defendersIn = exports.isDefender = exports.defendersWanted = exports.martialLawUnitsWanted = void 0;
// Generic: how many defenders a city wants, judged the same way by city production and by the units deciding whether to
//  stay and fortify there. When the two disagreed, cities built a defender, it walked off, and they built another.
const Yields_1 = require("@civ-clone/library-city/Yields");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Types_1 = require("@civ-clone/library-unit/Types");
const Yield_1 = require("@civ-clone/core-yield/Yield");
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
//  only say what they can do when they have someone to calm: in a city where martial law, which the engine applies
//  first, has calmed everyone, they say nothing.
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
//  citizen a unit keeps content leaves its tile worked, where an Entertainer gives it up.
const martialLawUnitsWanted = (dependencies, knowledge, city) => {
    const limit = knowledge.martialLaw.limit(dependencies, city);
    if (limit <= 0) {
        return 0;
    }
    return Math.min(limit, Math.max(0, unhappiness(city.yields()).positive -
        calmedWithoutMartialLaw(dependencies, city)));
};
exports.martialLawUnitsWanted = martialLawUnitsWanted;
// One defender, and one more for each five sizes over five, or as many units as martial law would use if that's more:
//  a defender keeps order as well as any unit.
const defendersWanted = (dependencies, knowledge, city) => Math.max(Math.ceil(dependencies.cityGrowthRegistry.getByCity(city).size() / 5), (0, exports.martialLawUnitsWanted)(dependencies, knowledge, city));
exports.defendersWanted = defendersWanted;
// A unit that could defend a city: not, say, Settlers or a ship.
const isDefender = (unit) => unit instanceof Types_1.Fortifiable && unit.defence().value() > 0;
exports.isDefender = isDefender;
// The units on the city's tile that could defend it, fortified or not.
const defendersIn = (dependencies, city) => dependencies.unitRegistry.getByTile(city.tile()).filter(exports.isDefender);
exports.defendersIn = defendersIn;
//# sourceMappingURL=defence.js.map