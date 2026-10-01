"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defendersIn = exports.isDefender = exports.defendersWanted = exports.martialLawUnitsWanted = void 0;
// Generic: how many defenders a city wants, judged the same way by city production and by the units deciding whether to
//  stay and fortify there. When the two disagreed, cities built a defender, it walked off, and they built another.
const Yields_1 = require("@civ-clone/library-city/Yields");
const Types_1 = require("@civ-clone/library-unit/Types");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
// How many units in `city` martial law would use: the ones the ruleset's rules use now, and one more for each citizen
//  still unhappy, up to the policy's limit. Making Entertainers doesn't change it, so it's the same whether or not the
//  city has made them yet. A citizen a unit keeps content leaves its tile worked, where an Entertainer gives it up.
const martialLawUnitsWanted = (dependencies, knowledge, city) => {
    const limit = knowledge.martialLaw.limit(dependencies, city);
    if (limit <= 0) {
        return 0;
    }
    const yields = city.yields(), inUse = yields.filter((cityYield) => cityYield instanceof Yields_1.MartialLaw).length, unhappy = Math.max(0, (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness));
    return Math.min(limit, inUse + unhappy);
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