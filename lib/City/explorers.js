"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reachableLandToExplore = exports.continentOf = exports.landReachableFrom = void 0;
// The land tiles reachable by land from `start`, in one pass over its continent, as `Unit/reachable` finds them for a
//  land unit.
const landReachableFrom = (start) => {
    const reached = new Set([start]), queue = [start];
    for (let i = 0; i < queue.length; i++) {
        queue[i].getNeighbours().forEach((tile) => {
            if (!reached.has(tile) && tile.isLand()) {
                reached.add(tile);
                queue.push(tile);
            }
        });
    }
    return reached;
};
exports.landReachableFrom = landReachableFrom;
// The continents found so far this turn, by each of their tiles.
let continents = null;
// `landReachableFrom` a land tile, found once a turn for each continent: every city the player has asks for its own as
//  it chooses what to build, once or twice, and a player's cities mostly share a few continents
//  (civ-clone/web-renderer#316). No rule turns land into sea or sea into land, but a continent is only kept for the
//  turn all the same. Shared by every tile of the continent, so not for changing.
const continentOf = (turn, start) => {
    // From the sea, the land all around it, which isn't one continent.
    if (!start.isLand()) {
        return (0, exports.landReachableFrom)(start);
    }
    if (continents === null || continents.turn !== turn) {
        continents = { turn, byTile: new WeakMap() };
    }
    const known = continents.byTile.get(start);
    if (known) {
        return known;
    }
    const continent = (0, exports.landReachableFrom)(start), { byTile } = continents;
    continent.forEach((tile) => {
        byTile.set(tile, continent);
    });
    return continent;
};
exports.continentOf = continentOf;
// How many of `landTilesToExplore` a land unit built in `city` could walk to: those on `reachable`, the land it can
//  walk to, if that's known already.
const reachableLandToExplore = (city, landTilesToExplore, reachable) => {
    if (landTilesToExplore.length === 0) {
        return 0;
    }
    const land = reachable !== null && reachable !== void 0 ? reachable : (0, exports.landReachableFrom)(city.tile());
    return landTilesToExplore.filter((tile) => land.has(tile))
        .length;
};
exports.reachableLandToExplore = reachableLandToExplore;
exports.default = exports.reachableLandToExplore;
//# sourceMappingURL=explorers.js.map