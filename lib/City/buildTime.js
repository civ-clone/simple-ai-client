"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTime = exports.netShields = void 0;
const Yields_1 = require("@civ-clone/library-city/Yields");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
// The shields `city` makes each turn after unit support. Unit support yields are negative `Production`.
const netShields = (city) => (0, reduceYields_1.reduceYield)(city.yields(), Yields_1.Production);
exports.netShields = netShields;
// How many turns `city` takes to finish a build item, counting the shields it has stored: 0 for one it has the shields
//  for already, and `Infinity` for any other when it makes no shields to spare. Built once per decision, as working out
//  a city's yields isn't cheap.
const buildTime = (dependencies, city, shields = (0, exports.netShields)(city)) => {
    const stored = dependencies.cityBuildRegistry
        .getByCity(city)
        .progress()
        .value();
    return (buildItem) => {
        const remaining = buildItem.cost().value() - stored;
        if (remaining <= 0) {
            return 0;
        }
        return shields > 0 ? Math.ceil(remaining / shields) : Infinity;
    };
};
exports.buildTime = buildTime;
exports.default = exports.buildTime;
//# sourceMappingURL=buildTime.js.map