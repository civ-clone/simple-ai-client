"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settlerWork = void 0;
const Path_1 = require("@civ-clone/core-world-path/Path");
const reachable_1 = require("./reachable");
// The site the worker should still be heading for, if any. A site is given up when the worker has reached it, when
//  it's no longer a good place for a city (say another city was founded nearby), or when the worker has lost its path
//  and no new one can be found. Giving it up frees it for the survey to offer again.
const siteToKeep = (dependencies, player, memory, knowledge, unit, tile, target) => {
    var _a;
    if (!target) {
        return undefined;
    }
    if (target !== tile &&
        knowledge.shouldBuildCity(dependencies, player, target)) {
        if (memory.unitPathData.has(unit)) {
            return target;
        }
        const path = Path_1.default.for(unit, tile, target, dependencies.pathFinderRegistry);
        if (path) {
            memory.unitPathData.set(unit, path);
            return target;
        }
    }
    memory.unitTargetData.delete(unit);
    if (((_a = memory.unitPathData.get(unit)) === null || _a === void 0 ? void 0 : _a.end()) === target) {
        memory.unitPathData.delete(unit);
    }
    return undefined;
};
// The nearest site on the board that the worker can reach: claimed as its target, with the path to it, and taken off
//  the board.
const claimSite = (dependencies, memory, unit, tile) => {
    const sites = memory.targets.goodSitesForCities.sort((a, b) => a.distanceFrom(tile) - b.distanceFrom(tile));
    // Only worked out if there's a site to check.
    let reachable;
    for (const site of sites) {
        if (site === tile) {
            continue;
        }
        if (reachable === undefined) {
            reachable = (0, reachable_1.default)(unit);
        }
        // On another continent: a search would cover the whole of this one and find nothing. Once ships have shown the
        //  players other continents, most of the board can be sites like that, and searching for each of them, for each
        //  worker with no site, every turn, was most of the game's time.
        if (reachable !== null && !reachable.has(site)) {
            continue;
        }
        const path = Path_1.default.for(unit, tile, site, dependencies.pathFinderRegistry);
        if (path) {
            sites.splice(sites.indexOf(site), 1);
            memory.unitTargetData.set(unit, site);
            memory.unitPathData.set(unit, path);
            return;
        }
    }
};
const settlerWork = (dependencies, player, memory, knowledge, unit, tile, target, { buildIrrigation, buildMine, buildRoad, foundCity }) => {
    const site = siteToKeep(dependencies, player, memory, knowledge, unit, tile, target);
    if (foundCity && knowledge.shouldBuildCity(dependencies, player, tile)) {
        unit.action(foundCity);
    }
    else if (buildIrrigation &&
        knowledge.shouldIrrigate(dependencies, player, tile)) {
        unit.action(buildIrrigation);
    }
    else if (buildMine && knowledge.shouldMine(dependencies, player, tile)) {
        unit.action(buildMine);
    }
    else if (buildRoad && knowledge.shouldRoad(dependencies, player, tile)) {
        unit.action(buildRoad);
    }
    else if (!site && memory.targets.goodSitesForCities.length) {
        claimSite(dependencies, memory, unit, tile);
    }
};
exports.settlerWork = settlerWork;
exports.default = exports.settlerWork;
//# sourceMappingURL=settlerWork.js.map