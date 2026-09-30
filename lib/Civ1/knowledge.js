"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1Knowledge = void 0;
// Civ1: Civ1's answers to the judgements in `Knowledge`, for the generic modules to use.
const terrain_1 = require("./terrain");
const aircraft_1 = require("./aircraft");
const assignWorkers_1 = require("@civ-clone/civ1-city/lib/assignWorkers");
const trireme_1 = require("./trireme");
exports.civ1Knowledge = {
    assignWorkers: (dependencies, city) => (0, assignWorkers_1.default)(city, dependencies.playerWorldRegistry, dependencies.cityGrowthRegistry, dependencies.workedTileRegistry),
    canReturnAfter: (dependencies, player, unit, action) => (0, aircraft_1.aircraftCanReturn)(dependencies, player, unit, action) &&
        (0, trireme_1.default)(dependencies, player, unit, action),
    isAircraft: (dependencies, unit) => (0, aircraft_1.aircraftFuel)(dependencies, unit) !== null,
    shouldBuildCity: terrain_1.shouldBuildCity,
    shouldIrrigate: terrain_1.shouldIrrigate,
    shouldMine: terrain_1.shouldMine,
    shouldRoad: terrain_1.shouldRoad,
};
exports.default = exports.civ1Knowledge;
//# sourceMappingURL=knowledge.js.map