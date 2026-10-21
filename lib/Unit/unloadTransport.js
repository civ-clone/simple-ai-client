"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unloadTransport = void 0;
// Generic: a transport at the coast unloads its cargo where it's meant to go ashore, then waits.
//  - Passengers with an overseas plan (`lib/Unit/overseas`) go ashore only beside their target's landmass.
//  - Other cargo goes ashore anywhere but the landmass it set out from, or, where that isn't known (cargo from before
//    a load), anywhere it hasn't just come from (civ-clone/web-renderer#211).
const overseas_1 = require("./overseas");
const Types_1 = require("@civ-clone/library-unit/Types");
const explorers_1 = require("../City/explorers");
// Whether `unit`, aboard a transport on `tile`, should go ashore here.
const goesAshore = (dependencies, memory, unit, tile) => {
    const land = tile
        .getNeighbours()
        .filter((neighbour) => neighbour.isLand()), passenger = (0, overseas_1.overseasStateFor)(memory).passengers.get(unit), origin = (0, overseas_1.originOf)(memory, unit);
    if (passenger) {
        const destination = (0, explorers_1.continentOf)(dependencies.turn.value(), passenger.target);
        return land.some((neighbour) => destination.has(neighbour));
    }
    if (origin) {
        return land.some((neighbour) => !origin.has(neighbour));
    }
    return !land.some((neighbour) => (memory.lastUnitMoves.get(unit) || []).includes(neighbour));
};
// The turn each transport last unloaded.
const unloaded = new WeakMap();
// Returns whether it unloaded, in which case the transport waits so the unloaded units can be moved first. Once a turn:
//  in port, its cargo stays aboard as it takes up its own orders, and unloading again woke the units it had just
//  unloaded, which fortified again, for as long as the turn's action limit allowed (civ-clone/web-renderer#377).
const unloadTransport = (dependencies, memory, unit, tile, unload) => {
    const turn = dependencies.turn.value();
    if (!(unit instanceof Types_1.NavalTransport && unload && tile.isCoast()) ||
        unloaded.get(unit) === turn) {
        return false;
    }
    const cargo = unit.cargo();
    if (!cargo.some((passenger) => goesAshore(dependencies, memory, passenger, tile))) {
        return false;
    }
    unit.action(unload);
    unloaded.set(unit, turn);
    // Ashore, or about to be: they're passengers no longer, and carry on with their own work from here.
    cargo.forEach((passenger) => {
        (0, overseas_1.dropPassenger)(memory, passenger);
        (0, overseas_1.overseasStateFor)(memory).origins.delete(passenger);
    });
    unit.setWaiting();
    // skip out to allow the unloaded units to be moved.
    return true;
};
exports.unloadTransport = unloadTransport;
exports.default = exports.unloadTransport;
//# sourceMappingURL=unloadTransport.js.map