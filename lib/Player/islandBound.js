"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.islandBound = void 0;
const explorers_1 = require("../City/explorers");
const overseas_1 = require("../Unit/overseas");
// Where the player's units are going: each one's target and the end of its path, and each passenger's target. The
//  survey leaves these off its board while they're claimed, so a site its Settlers are walking to, or the last land
//  its explorer is heading for, would otherwise look gone.
const claimed = (memory) => [
    ...memory.unitTargetData.values(),
    ...[...memory.unitPathData.values()]
        .map((path) => path.end())
        .filter((tile) => tile !== undefined),
    ...[...(0, overseas_1.overseasStateFor)(memory).passengers.entries()]
        .filter(([unit]) => !unit.destroyed())
        .map(([, passenger]) => passenger.target),
];
// Whether `tile`, a land tile the player knows, has a neighbour it doesn't: land still to explore.
const unexplored = (dependencies, player, tile) => {
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);
    return tile
        .getNeighbours()
        .some((neighbour) => !playerWorld.includes(neighbour));
};
// Whether the player has explored `landmass`: it knows every tile of it, or there's no land tile left to explore on it,
//  on the survey's board or claimed by one of its units. The survey counts a coastal tile beside unseen sea as land to
//  explore, so a small island the player has seen all of would never be explored by that alone.
const explored = (dependencies, player, memory, landmass, heading) => {
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);
    if ([...landmass].every((tile) => playerWorld.includes(tile))) {
        return true;
    }
    return (!memory.targets.landTilesToExplore.some((tile) => landmass.has(tile)) &&
        !heading.some((tile) => landmass.has(tile) && unexplored(dependencies, player, tile)));
};
// Whether `player` has cities, every one of them on a landmass it has explored with no site for a city left on it: none
//  on the survey's board, and none its units are heading for. False before it has a city or has surveyed, and false
//  again as soon as it has a city on land with room, so its usual priorities come back by themselves. Worked out afresh
//  each time: the board, its cities and what it knows all change during a turn.
const islandBound = (dependencies, knowledge, player, memory) => {
    if (memory.surveyedTurn === null) {
        return false;
    }
    const turn = dependencies.turn.value(), cities = dependencies.cityRegistry.getByPlayer(player);
    if (cities.length === 0) {
        return false;
    }
    const landmasses = [
        ...new Set(cities.map((city) => (0, explorers_1.continentOf)(turn, city.tile()))),
    ], onLandmasses = (tile) => landmasses.some((landmass) => landmass.has(tile));
    if (memory.targets.goodSitesForCities.some(onLandmasses)) {
        return false;
    }
    const heading = claimed(memory);
    if (heading.some((tile) => onLandmasses(tile) &&
        dependencies.cityRegistry.getByTile(tile) === null &&
        knowledge.shouldBuildCity(dependencies, player, tile))) {
        return false;
    }
    return landmasses.every((landmass) => explored(dependencies, player, memory, landmass, heading));
};
exports.islandBound = islandBound;
exports.default = exports.islandBound;
//# sourceMappingURL=islandBound.js.map