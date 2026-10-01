"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reachableTiles = exports.terrainFor = void 0;
// Generic: the tiles a unit could reach from where it stands, moving the way `simple-world-path`'s `BasePathFinder`
//  does: a land unit by land, a ship by sea. `null` for any other unit, which could go anywhere.
const Types_1 = require("@civ-clone/library-unit/Types");
// Whether `unit` can move onto a tile, by its terrain alone: land for a land unit, water for a ship. `null` for any
//  other unit, which can move onto any tile.
const terrainFor = (unit) => unit instanceof Types_1.Land
    ? (tile) => tile.isLand()
    : unit instanceof Types_1.Naval
        ? (tile) => tile.isWater()
        : null;
exports.terrainFor = terrainFor;
// One pass over the unit's continent or sea. Checking targets against it saves a path search over the whole of it for
//  each target the unit can't reach, such as the coast of another continent that a ship has seen.
const reachableTiles = (unit) => {
    const canEnter = (0, exports.terrainFor)(unit);
    if (canEnter === null) {
        return null;
    }
    const start = unit.tile(), reached = new Set([start]), queue = [start];
    for (let i = 0; i < queue.length; i++) {
        queue[i].getNeighbours().forEach((tile) => {
            if (!reached.has(tile) && canEnter(tile)) {
                reached.add(tile);
                queue.push(tile);
            }
        });
    }
    return reached;
};
exports.reachableTiles = reachableTiles;
exports.default = exports.reachableTiles;
//# sourceMappingURL=reachable.js.map