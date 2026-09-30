"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignMission = exports.missions = exports.exploreSea = exports.exploreLand = exports.attackEnemyCity = exports.attackEnemyUnits = exports.liberateCity = exports.defendUndefendedCity = void 0;
// Generic: gives a unit with no target a path to the first mission it qualifies for, taking that target off the board.
const Types_1 = require("@civ-clone/library-unit/Types");
const Path_1 = require("@civ-clone/core-world-path/Path");
const nearest = (unit) => (a, b) => a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile());
// `ranked` is sometimes `list` itself, sorted in place, and sometimes a sorted copy of part of it.
const pursue = (dependencies, memory, unit, list, [targetTile]) => {
    // Nothing to head for, or already there: a search would find nothing worth following.
    if (!targetTile || targetTile === unit.tile()) {
        return;
    }
    const path = Path_1.default.for(unit, unit.tile(), targetTile, dependencies.pathFinderRegistry);
    if (path) {
        list.splice(list.indexOf(targetTile), 1);
        memory.unitPathData.set(unit, path);
    }
};
const defendUndefendedCity = (dependencies, memory, unit) => {
    const { undefendedCities } = memory.targets;
    if (!(unit instanceof Types_1.Fortifiable &&
        unit.defence().value() > 0 &&
        undefendedCities.length > 0)) {
        return false;
    }
    pursue(dependencies, memory, unit, undefendedCities, undefendedCities.sort(nearest(unit)));
    return true;
};
exports.defendUndefendedCity = defendUndefendedCity;
const liberateCity = (dependencies, memory, unit) => {
    const { citiesToLiberate } = memory.targets;
    if (!(unit.attack().value() > 0 && citiesToLiberate.length > 0)) {
        return false;
    }
    pursue(dependencies, memory, unit, citiesToLiberate, citiesToLiberate
        .filter((tile) => unit instanceof Types_1.Land && tile.isLand())
        .sort(nearest(unit)));
    return true;
};
exports.liberateCity = liberateCity;
const attackEnemyUnits = (dependencies, memory, unit) => {
    const { enemyUnitsToAttack } = memory.targets;
    if (!(unit.attack().value() > 0 && enemyUnitsToAttack.length > 0)) {
        return false;
    }
    const reachable = enemyUnitsToAttack.filter((tile) => (unit instanceof Types_1.Land && tile.isLand()) ||
        (unit instanceof Types_1.Naval && tile.isWater()));
    // Enemy units only on terrain this unit can't cross leave it free for the missions after this one, such as a ship
    //  exploring by sea.
    if (reachable.length === 0) {
        return false;
    }
    pursue(dependencies, memory, unit, enemyUnitsToAttack, reachable.sort(nearest(unit)));
    return true;
};
exports.attackEnemyUnits = attackEnemyUnits;
const attackEnemyCity = (dependencies, memory, unit) => {
    const { enemyCitiesToAttack } = memory.targets;
    if (!(unit instanceof Types_1.Land &&
        unit.attack().value() > 0 &&
        enemyCitiesToAttack.length > 0)) {
        return false;
    }
    pursue(dependencies, memory, unit, enemyCitiesToAttack, enemyCitiesToAttack.sort(nearest(unit)));
    return true;
};
exports.attackEnemyCity = attackEnemyCity;
const exploreLand = (dependencies, memory, unit) => {
    const { landTilesToExplore } = memory.targets;
    if (!(unit instanceof Types_1.Land && landTilesToExplore.length > 0)) {
        return false;
    }
    pursue(dependencies, memory, unit, landTilesToExplore, landTilesToExplore.sort(nearest(unit)));
    return true;
};
exports.exploreLand = exploreLand;
const exploreSea = (dependencies, memory, unit) => {
    const { seaTilesToExplore } = memory.targets;
    if (!(unit instanceof Types_1.Naval && seaTilesToExplore.length > 0)) {
        return false;
    }
    pursue(dependencies, memory, unit, seaTilesToExplore, seaTilesToExplore.sort(nearest(unit)));
    return true;
};
exports.exploreSea = exploreSea;
// In priority order. Hunting enemy units comes after exploring land: ahead of it (as it was written, when the list was
//  always empty), units chase enemies instead of exploring, and the AI explores and researches measurably less.
exports.missions = [
    exports.defendUndefendedCity,
    exports.liberateCity,
    exports.attackEnemyCity,
    exports.exploreLand,
    exports.attackEnemyUnits,
    exports.exploreSea,
];
const assignMission = (dependencies, memory, unit) => {
    exports.missions.some((mission) => mission(dependencies, memory, unit));
};
exports.assignMission = assignMission;
exports.default = exports.assignMission;
//# sourceMappingURL=assignMission.js.map