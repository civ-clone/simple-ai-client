"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reachableLandToExplore = exports.landReachableFrom = void 0;
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
// How many of `landTilesToExplore` a land unit built in `city` could walk to.
const reachableLandToExplore = (city, landTilesToExplore) => {
    if (landTilesToExplore.length === 0) {
        return 0;
    }
    const reachable = (0, exports.landReachableFrom)(city.tile());
    return landTilesToExplore.filter((tile) => reachable.has(tile))
        .length;
};
exports.reachableLandToExplore = reachableLandToExplore;
exports.default = exports.reachableLandToExplore;
//# sourceMappingURL=explorers.js.map