"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ferry = void 0;
// Generic: a transport's turn as a ferry (civ-clone/web-renderer#211, #374), for `Strategies/Unit/Ferry`. With
//  passengers aboard, it sails, once they're all aboard, to the coast nearest their target and unloads them there
//  (`unloadTransport` unloads). Empty, it sails alongside a port where passengers are waiting (`lib/Unit/overseas`),
//  unless another transport is on its way there already. Otherwise it does nothing here, and goes on exploring, and
//  while it's ferrying the player may build another ship to explore with (civ-clone/web-renderer#440).
const overseas_1 = require("./overseas");
const Path_1 = require("@civ-clone/core-world-path/Path");
const explorers_1 = require("../City/explorers");
const moveUnit_1 = require("./moveUnit");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
const reachable_1 = require("@civ-clone/base-strategy-ai/lib/Unit/reachable");
// The turn a transport took its first passenger aboard, so it doesn't wait for more for ever.
const loading = new WeakMap();
// The water tile `ship` can reach that's beside `landmass`, nearest `target`, if any.
const landingFor = (ship, landmass, target) => {
    var _a;
    const reachable = (0, reachable_1.default)(ship);
    return ((_a = [...(reachable !== null && reachable !== void 0 ? reachable : [])]
        .filter((tile) => tile.isWater() &&
        tile
            .getNeighbours()
            .some((neighbour) => landmass.has(neighbour)))
        .sort((a, b) => a.distanceFrom(target) - b.distanceFrom(target) ||
        a.distanceFrom(ship.tile()) - b.distanceFrom(ship.tile()))[0]) !== null && _a !== void 0 ? _a : null);
};
const oneStep = (to) => {
    const path = new Path_1.default();
    path.push(to);
    return path;
};
// Sets `ship` off towards `to`, then lets the move executor take it. Returns whether it has a way there.
const sailTo = async (dependencies, player, memory, knowledge, ship, to) => {
    var _a;
    if (ship.tile() === to) {
        (0, orders_1.noOrders)(dependencies, ship);
        return true;
    }
    if (((_a = memory.unitPathData.get(ship)) === null || _a === void 0 ? void 0 : _a.end()) !== to) {
        // One step, as from a port city to the sea beside it, which the path finder finds no way for (it starts on land).
        const path = ship.tile().getNeighbours().includes(to)
            ? oneStep(to)
            : Path_1.default.for(ship, ship.tile(), to, dependencies.pathFinderRegistry);
        if (!path) {
            return false;
        }
        memory.unitPathData.set(ship, path);
    }
    await (0, moveUnit_1.default)(dependencies, player, memory, knowledge, ship);
    return true;
};
// The port beside `ship` that has passengers still waiting in it, if any.
const portBeside = (dependencies, memory, ship) => {
    var _a;
    return (_a = ship
        .tile()
        .getNeighbours()
        .map((tile) => dependencies.cityRegistry.getByTile(tile))
        .find((city) => city !== null && (0, overseas_1.waitingAt)(memory, city).length > 0)) !== null && _a !== void 0 ? _a : null;
};
// Whether a transport with `cargo` aboard sets sail: it's full; or no one else is waiting or on their way to the port
//  it's beside; or it has waited long enough. A lone founder waits a little longer for an escort.
const readyToSail = (dependencies, memory, ship, cargo) => {
    var _a;
    const turn = dependencies.turn.value(), since = (_a = loading.get(ship)) !== null && _a !== void 0 ? _a : turn, waited = turn - since, port = portBeside(dependencies, memory, ship), { passengers } = (0, overseas_1.overseasStateFor)(memory), stillComing = port !== null &&
        [...passengers.entries()].some(([unit, passenger]) => passenger.port === port && !cargo.includes(unit) && !unit.destroyed());
    if (!ship.hasCapacity() || waited >= overseas_1.ESCORT_WAIT) {
        return true;
    }
    if (cargo.every(overseas_1.isFounder)) {
        return false;
    }
    return !stillComing;
};
const ferryTurn = async (dependencies, player, memory, knowledge, ship) => {
    // Not `Unit & Ferry`: a type with members of its own isn't assignable to `Unit` (civ-clone/web-renderer#21).
    const cargo = ship.cargo(), { passengers, heading } = (0, overseas_1.overseasStateFor)(memory), turn = dependencies.turn.value();
    if (cargo.length > 0) {
        heading.delete(ship);
        if (!loading.has(ship)) {
            loading.set(ship, turn);
        }
        const targets = cargo
            .map((unit) => { var _a; return (_a = passengers.get(unit)) === null || _a === void 0 ? void 0 : _a.target; })
            .filter((tile) => tile !== undefined);
        // Cargo with no plan (aboard before this, or since a load): `unloadTransport` puts it ashore anywhere new.
        if (targets.length === 0) {
            return false;
        }
        if (!readyToSail(dependencies, memory, ship, cargo)) {
            (0, orders_1.noOrders)(dependencies, ship);
            return true;
        }
        const [target] = targets.sort((a, b) => a.distanceFrom(ship.tile()) - b.distanceFrom(ship.tile())), landmass = (0, explorers_1.continentOf)(turn, target), landing = landingFor(ship, landmass, target);
        if (!landing) {
            // Nowhere to land them: they give up their plans and go ashore where they can.
            cargo.forEach((unit) => (0, overseas_1.dropPassenger)(memory, unit));
            return false;
        }
        return sailTo(dependencies, player, memory, knowledge, ship, landing);
    }
    loading.delete(ship);
    // Empty: alongside the nearest port with passengers waiting in it that no other transport is sailing for.
    const taken = new Set([...heading.entries()]
        .filter(([other]) => other !== ship &&
        !other.destroyed() &&
        other.hasCapacity())
        .map(([, port]) => port)), ports = [
        ...new Set([...passengers.values()]
            .filter((passenger) => passenger.since !== null)
            .map((passenger) => passenger.port)),
    ]
        .filter((port) => !taken.has(port))
        .sort((a, b) => a.tile().distanceFrom(ship.tile()) -
        b.tile().distanceFrom(ship.tile()));
    for (const port of ports) {
        const berth = landingFor(ship, new Set([port.tile()]), port.tile());
        if (berth &&
            (await sailTo(dependencies, player, memory, knowledge, ship, berth))) {
            heading.set(ship, port);
            return true;
        }
    }
    heading.delete(ship);
    return false;
};
const ferry = async (dependencies, player, memory, knowledge, ship) => {
    const ferried = await ferryTurn(dependencies, player, memory, knowledge, ship);
    if (ferried) {
        (0, overseas_1.overseasStateFor)(memory).ferried.set(ship, dependencies.turn.value());
    }
    return ferried;
};
exports.ferry = ferry;
exports.default = exports.ferry;
//# sourceMappingURL=ferry.js.map