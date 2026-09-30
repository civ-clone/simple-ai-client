"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unloadTransport = void 0;
// Generic: a transport at the coast unloads any cargo that hasn't just come from the neighbouring land.
const Types_1 = require("@civ-clone/library-unit/Types");
// Returns whether it unloaded, in which case the transport waits so the unloaded units can be moved first.
const unloadTransport = (memory, unit, tile, unload) => {
    if (unit instanceof Types_1.NavalTransport &&
        unload &&
        tile.isCoast() &&
        unit
            .cargo()
            .some((unit) => !tile
            .getNeighbours()
            .some((tile) => (memory.lastUnitMoves.get(unit) || []).includes(tile)))) {
        unit.action(unload);
        unit.setWaiting();
        // skip out to allow the unloaded units to be moved.
        return true;
    }
    return false;
};
exports.unloadTransport = unloadTransport;
exports.default = exports.unloadTransport;
//# sourceMappingURL=unloadTransport.js.map