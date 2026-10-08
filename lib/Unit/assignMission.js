"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignMission = exports.missions = exports.exploreSea = exports.exploreLand = exports.attackEnemyCity = exports.attackEnemyUnits = exports.liberateCity = exports.defendUndefendedCity = void 0;
// Generic: gives a unit with no target a path to the first mission it qualifies for, taking that target off the board.
const Types_1 = require("@civ-clone/library-unit/Types");
const mission_1 = require("@civ-clone/base-strategy-ai/lib/Unit/mission");
const explore_1 = require("@civ-clone/base-strategy-explore/lib/Unit/explore");
Object.defineProperty(exports, "exploreLand", { enumerable: true, get: function () { return explore_1.exploreLand; } });
Object.defineProperty(exports, "exploreSea", { enumerable: true, get: function () { return explore_1.exploreSea; } });
const defendUndefendedCity = (dependencies, memory, unit) => {
    const { undefendedCities } = memory.targets;
    if (!(unit instanceof Types_1.Fortifiable &&
        unit.defence().value() > 0 &&
        undefendedCities.length > 0)) {
        return false;
    }
    return (0, mission_1.pursue)(dependencies, memory, unit, undefendedCities, undefendedCities.sort((0, mission_1.nearest)(unit)));
};
exports.defendUndefendedCity = defendUndefendedCity;
const liberateCity = (dependencies, memory, unit) => {
    const { citiesToLiberate } = memory.targets;
    if (!(unit.attack().value() > 0 && citiesToLiberate.length > 0)) {
        return false;
    }
    return (0, mission_1.pursue)(dependencies, memory, unit, citiesToLiberate, citiesToLiberate
        .filter((tile) => unit instanceof Types_1.Land && tile.isLand())
        .sort((0, mission_1.nearest)(unit)));
};
exports.liberateCity = liberateCity;
const attackEnemyUnits = (dependencies, memory, unit) => {
    const { enemyUnitsToAttack } = memory.targets;
    if (!(unit.attack().value() > 0 && enemyUnitsToAttack.length > 0)) {
        return false;
    }
    // Only enemies on terrain this unit can cross: with none, or none it has a path to, it's free for the missions
    //  after this one, such as a ship exploring by sea.
    return (0, mission_1.pursue)(dependencies, memory, unit, enemyUnitsToAttack, enemyUnitsToAttack
        .filter((tile) => (unit instanceof Types_1.Land && tile.isLand()) ||
        (unit instanceof Types_1.Naval && tile.isWater()))
        .sort((0, mission_1.nearest)(unit)));
};
exports.attackEnemyUnits = attackEnemyUnits;
const attackEnemyCity = (dependencies, memory, unit) => {
    const { enemyCitiesToAttack } = memory.targets;
    if (!(unit instanceof Types_1.Land &&
        unit.attack().value() > 0 &&
        enemyCitiesToAttack.length > 0)) {
        return false;
    }
    return (0, mission_1.pursue)(dependencies, memory, unit, enemyCitiesToAttack, enemyCitiesToAttack.sort((0, mission_1.nearest)(unit)));
};
exports.attackEnemyCity = attackEnemyCity;
exports.missions = [
    exports.defendUndefendedCity,
    exports.liberateCity,
    exports.attackEnemyCity,
    explore_1.exploreLand,
    explore_1.exploreSea,
    exports.attackEnemyUnits,
];
const assignMission = (dependencies, memory, unit) => {
    exports.missions.some((mission) => mission(dependencies, memory, unit));
};
exports.assignMission = assignMission;
exports.default = exports.assignMission;
//# sourceMappingURL=assignMission.js.map