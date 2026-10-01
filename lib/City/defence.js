"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defendersIn = exports.isDefender = exports.defendersWanted = exports.martialLawUnitsWanted = void 0;
// Generic: how many defenders a city wants, judged the same way by city production and by the units deciding whether to
//  stay and fortify there. When the two disagreed, cities built a defender, it walked off, and they built another.
const Yields_1 = require("@civ-clone/library-city/Yields");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Types_1 = require("@civ-clone/library-unit/Types");
const Yield_1 = require("@civ-clone/core-yield/Yield");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
// More unhappy citizens than any city has, for `improvementContent`.
const CROWD = 100;
// How many unhappy citizens the yields of `YieldType` keep content: `MartialLaw`, say.
const contentFrom = (yields, YieldType) => yields
    .filter((cityYield) => cityYield instanceof YieldType)
    .reduce((total, cityYield) => total + Math.abs(cityYield.value()), 0);
// How many unhappy citizens `city`'s improvements can make content, by the ruleset's own `Cost` rules, run as
//  `City#yields` runs them but over nothing but a crowd of unhappy citizens. An improvement only says what it can do
//  when it has someone to calm: in a city where martial law (or anything that comes before it) has calmed everyone,
//  it says nothing.
const improvementContent = (dependencies, city) => {
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
    return contentFrom(yields, Yields_1.CityImprovementContent);
};
// How many units in `city` martial law would use: one for each citizen unhappy before martial law or the city's
//  improvements calm them, less those the improvements can calm, up to the policy's limit. Those counts are the
//  ruleset's rules' own, so they're the same whether or not the city has made Entertainers yet, and whichever of martial
//  law and the improvements its rules apply first. A citizen a unit keeps content leaves its tile worked, where an
//  Entertainer gives it up.
const martialLawUnitsWanted = (dependencies, knowledge, city) => {
    const limit = knowledge.martialLaw.limit(dependencies, city);
    if (limit <= 0) {
        return 0;
    }
    const yields = city.yields(), unhappy = (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness) +
        contentFrom(yields, Yields_1.MartialLaw) +
        contentFrom(yields, Yields_1.CityImprovementContent);
    return Math.min(limit, Math.max(0, unhappy - improvementContent(dependencies, city)));
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