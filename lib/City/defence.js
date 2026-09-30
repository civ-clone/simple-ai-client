"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defendersIn = exports.isDefender = exports.defendersWanted = void 0;
const Types_1 = require("@civ-clone/library-unit/Types");
// One defender, and one more for each five sizes over five.
const defendersWanted = (dependencies, city) => Math.ceil(dependencies.cityGrowthRegistry.getByCity(city).size() / 5);
exports.defendersWanted = defendersWanted;
// A unit that could defend a city: not, say, Settlers or a ship.
const isDefender = (unit) => unit instanceof Types_1.Fortifiable && unit.defence().value() > 0;
exports.isDefender = isDefender;
// The units on the city's tile that could defend it, fortified or not.
const defendersIn = (dependencies, city) => dependencies.unitRegistry.getByTile(city.tile()).filter(exports.isDefender);
exports.defendersIn = defendersIn;
//# sourceMappingURL=defence.js.map