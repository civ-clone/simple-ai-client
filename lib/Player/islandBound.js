"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.islandBound = void 0;
const explorers_1 = require("../City/explorers");
// Whether the player has explored `landmass`: it knows every tile of it, or the survey has no land tile left to explore
//  on it. The survey counts a coastal tile beside unseen sea as land to explore, so a small island the player has seen
//  all of would never be explored by that alone.
const explored = (dependencies, player, memory, landmass) => {
    if (!memory.targets.landTilesToExplore.some((tile) => landmass.has(tile))) {
        return true;
    }
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);
    return [...landmass].every((tile) => playerWorld.includes(tile));
};
// Worked out once for each survey of the player's: every city asks as it chooses what to build.
const known = new WeakMap();
// Whether `player` has cities, every one of them on a landmass it has explored with no site for a city left on it, by
//  the survey's board. False before it has a city or has surveyed, and false again as soon as it has a city on land
//  with room, so its usual priorities come back by themselves.
const islandBound = (dependencies, player, memory) => {
    const turn = dependencies.turn.value(), surveyed = memory.surveyedTurn, cached = known.get(memory);
    if (surveyed === null) {
        return false;
    }
    if (cached && cached.turn === turn && cached.surveyed === surveyed) {
        return cached.bound;
    }
    const cities = dependencies.cityRegistry.getByPlayer(player), landmasses = new Set(cities.map((city) => (0, explorers_1.continentOf)(turn, city.tile()))), onLandmasses = (tile) => [...landmasses].some((landmass) => landmass.has(tile)), bound = cities.length > 0 &&
        !memory.targets.goodSitesForCities.some(onLandmasses) &&
        [...landmasses].every((landmass) => explored(dependencies, player, memory, landmass));
    known.set(memory, { turn, surveyed, bound });
    return bound;
};
exports.islandBound = islandBound;
exports.default = exports.islandBound;
//# sourceMappingURL=islandBound.js.map