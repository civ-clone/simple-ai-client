"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canFerryFromLandmassOf = exports.planEscort = exports.isFerrying = exports.planGarrison = exports.candidatesFor = exports.citiesShortOfDefenders = exports.originOf = exports.isPassenger = exports.isFounder = exports.waitingAt = exports.travel = exports.dropPassenger = exports.planPassenger = exports.canFerryFrom = exports.ESCORT_WAIT = exports.overseasStateFor = void 0;
// Generic: taking land units to another landmass by sea (civ-clone/web-renderer#211, #374). A land unit with nothing
//  left to do on its own landmass and a target on another one is a passenger: it walks to the player's port nearest
//  that target and waits there, embarking when a transport comes alongside. A transport (`Strategies/Unit/Ferry`)
//  sails to the passengers' port, takes them aboard, carries them to the target's coast and unloads them, after which
//  they carry on with their usual work there. v474.05 does much the same with a stack drawn to a port and a ship
//  picking a destination for its cargo (OpenCivOne `AIEngine.cs` `F0_25fb_0c9d`, L944-1253).
//
// Nothing here is saved: the cargo is the engine's own (`TransportManifest`), and each passenger's target is worked out
//  again from the survey's board. A game loaded mid-voyage carries on, unloading on the first other landmass reached.
const Actions_1 = require("@civ-clone/library-unit/Actions");
const Types_1 = require("@civ-clone/library-unit/Types");
const defence_1 = require("../City/defence");
const Path_1 = require("@civ-clone/core-world-path/Path");
const explorers_1 = require("../City/explorers");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
const states = new WeakMap();
const overseasStateFor = (memory) => {
    if (!states.has(memory)) {
        states.set(memory, {
            passengers: new Map(),
            origins: new Map(),
            ferried: new Map(),
            heading: new Map(),
        });
    }
    return states.get(memory);
};
exports.overseasStateFor = overseasStateFor;
// How long a lone founder waits in port for an escort before sailing without one.
exports.ESCORT_WAIT = 3;
const landmassOf = (dependencies, tile) => (0, explorers_1.continentOf)(dependencies.turn.value(), tile);
// Whether `unit` can be carried by sea at all: a land unit, not one aboard already (a land unit at sea).
const canTravel = (unit) => unit instanceof Types_1.Land && !unit.destroyed() && unit.tile().isLand();
// The player's coastal cities on `landmass`, nearest `target` first.
const portsOn = (dependencies, player, landmass, target) => dependencies.cityRegistry
    .getByPlayer(player)
    .filter((city) => landmass.has(city.tile()) && city.tile().isCoast())
    .sort((a, b) => a.tile().distanceFrom(target) - b.tile().distanceFrom(target));
// Whether `player` has a transport, or `port` could build one: without either, a passenger would wait for ever.
const canFerryFrom = (dependencies, player, port) => dependencies.unitRegistry
    .getByPlayer(player)
    .some((unit) => unit instanceof Types_1.NavalTransport) ||
    dependencies.cityBuildRegistry
        .getByCity(port)
        .available()
        .some((buildItem) => Object.prototype.isPrototypeOf.call(Types_1.NavalTransport, buildItem.item()));
exports.canFerryFrom = canFerryFrom;
// The nearest of `candidates` on another landmass than `unit`'s, and the port it would sail from, if the player can
//  ferry it. Targets another passenger is already going for are left to that one.
const destination = (dependencies, player, memory, unit, candidates) => {
    const home = landmassOf(dependencies, unit.tile()), taken = new Set([...(0, exports.overseasStateFor)(memory).passengers.entries()]
        .filter(([other]) => other !== unit)
        .map(([, passenger]) => passenger.target));
    for (const target of [...candidates]
        .filter((tile) => !home.has(tile) && !taken.has(tile))
        .sort((a, b) => a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile()))) {
        const [port] = portsOn(dependencies, player, home, target);
        if (port && (0, exports.canFerryFrom)(dependencies, player, port)) {
            return { target, port };
        }
    }
    return null;
};
// `unit`'s overseas plan as a `role`, kept while its target is still worth going for, or made afresh from `candidates`.
const planPassenger = (dependencies, player, memory, unit, role, candidates) => {
    if (!canTravel(unit)) {
        return null;
    }
    const { passengers } = (0, exports.overseasStateFor)(memory), known = passengers.get(unit);
    if (known && known.role === role && candidates.includes(known.target)) {
        return known;
    }
    // An escort goes with its founder, so it's kept only while that founder is still going (`planEscort` makes one).
    if (role === 'escort') {
        passengers.delete(unit);
        return null;
    }
    const found = destination(dependencies, player, memory, unit, candidates);
    if (!found) {
        passengers.delete(unit);
        return null;
    }
    const passenger = { ...found, role, since: null };
    passengers.set(unit, passenger);
    return passenger;
};
exports.planPassenger = planPassenger;
const dropPassenger = (memory, unit) => {
    (0, exports.overseasStateFor)(memory).passengers.delete(unit);
};
exports.dropPassenger = dropPassenger;
// A transport of the player's beside `tile`, at sea, with room for `unit`.
const transportBeside = (dependencies, player, unit, tile) => {
    var _a;
    return (_a = tile
        .getNeighbours()
        .find((neighbour) => neighbour.isWater() &&
        dependencies.unitRegistry
            .getByTile(neighbour)
            .some((other) => other.player() === player &&
            other instanceof Types_1.NavalTransport &&
            other.hasCapacity() &&
            other.canStow(unit)))) !== null && _a !== void 0 ? _a : null;
};
// A passenger's turn: walk to its port, board a transport that's alongside, or wait in port for one. Returns whether
//  it did any of those (and so its turn is taken care of).
const travel = (dependencies, player, memory, unit, passenger) => {
    var _a;
    const tile = unit.tile(), portTile = passenger.port.tile();
    if (passenger.port.player() !== player || passenger.port.destroyed()) {
        (0, exports.dropPassenger)(memory, unit);
        return false;
    }
    if (tile !== portTile) {
        if (((_a = memory.unitPathData.get(unit)) === null || _a === void 0 ? void 0 : _a.end()) !== portTile) {
            const path = Path_1.default.for(unit, tile, portTile, dependencies.pathFinderRegistry);
            if (!path) {
                (0, exports.dropPassenger)(memory, unit);
                return false;
            }
            memory.unitPathData.set(unit, path);
        }
        // `moveUnit` takes it along the path.
        return false;
    }
    if (passenger.since === null) {
        passenger.since = dependencies.turn.value();
    }
    const alongside = transportBeside(dependencies, player, unit, tile), embark = alongside &&
        unit
            .actions(alongside)
            .find((action) => action instanceof Actions_1.Embark);
    if (embark) {
        (0, exports.overseasStateFor)(memory).origins.set(unit, landmassOf(dependencies, tile));
        // The `instanceof` narrows it to a type that isn't assignable to `Action` (civ-clone/web-renderer#21).
        unit.action(embark);
        return true;
    }
    (0, orders_1.noOrders)(dependencies, unit);
    return true;
};
exports.travel = travel;
// The passengers waiting in `port`.
const waitingAt = (memory, port) => [...(0, exports.overseasStateFor)(memory).passengers.entries()].filter(([unit, passenger]) => passenger.port === port &&
    passenger.since !== null &&
    !unit.destroyed() &&
    unit.tile() === port.tile());
exports.waitingAt = waitingAt;
// Whether `unit` is a founder (a worker), as opposed to a unit that explores or escorts.
const isFounder = (unit) => unit instanceof Types_1.Worker;
exports.isFounder = isFounder;
const isPassenger = (memory, unit) => (0, exports.overseasStateFor)(memory).passengers.has(unit);
exports.isPassenger = isPassenger;
const originOf = (memory, unit) => { var _a; return (_a = (0, exports.overseasStateFor)(memory).origins.get(unit)) !== null && _a !== void 0 ? _a : null; };
exports.originOf = originOf;
// The player's cities that are short of the defenders they keep, wherever they are.
const citiesShortOfDefenders = (dependencies, knowledge, player) => dependencies.cityRegistry
    .getByPlayer(player)
    .filter((city) => (0, defence_1.defendersIn)(dependencies, city).length <
    (0, defence_1.defendersKept)(dependencies, knowledge, city))
    .map((city) => city.tile());
exports.citiesShortOfDefenders = citiesShortOfDefenders;
// The candidates `unit`'s role chooses from: land to explore, sites for cities, cities short of defenders, or, for an
//  escort, the targets of the founders it could go with.
const candidatesFor = (dependencies, knowledge, player, memory, unit, role) => role === 'explorer'
    ? memory.targets.landTilesToExplore
    : role === 'founder'
        ? memory.targets.goodSitesForCities
        : role === 'garrison'
            ? (0, exports.citiesShortOfDefenders)(dependencies, knowledge, player)
            : [...(0, exports.overseasStateFor)(memory).passengers.entries()]
                .filter(([other, passenger]) => other !== unit && passenger.role === 'founder')
                .map(([, passenger]) => passenger.target);
exports.candidatesFor = candidatesFor;
// A defender with nothing to do on its own landmass goes to a city of the player's on another one that's short of
//  defenders, one at a time for each city (civ-clone/web-renderer#441): a new city overseas is founded with a single
//  escort, and its garrison grows only if it can build one.
const planGarrison = (dependencies, knowledge, player, memory, unit) => (0, defence_1.isDefender)(unit)
    ? (0, exports.planPassenger)(dependencies, player, memory, unit, 'garrison', (0, exports.citiesShortOfDefenders)(dependencies, knowledge, player))
    : null;
exports.planGarrison = planGarrison;
// Whether `unit`, a ship, is busy ferrying: it has passengers aboard, or took or sailed for some in the last turn.
const isFerrying = (dependencies, memory, unit) => {
    var _a;
    return (unit instanceof Types_1.NavalTransport &&
        unit.hasCargo()) ||
        ((_a = (0, exports.overseasStateFor)(memory).ferried.get(unit)) !== null && _a !== void 0 ? _a : -Infinity) >=
            dependencies.turn.value() - 1;
};
exports.isFerrying = isFerrying;
// An escort for a founder waiting in a port on `unit`'s landmass that has none yet: `unit` goes with it, to the same
//  target from the same port. Settlers go overseas with an escort (Dom, on #374).
const planEscort = (dependencies, memory, unit) => {
    if (!canTravel(unit) || (0, exports.isFounder)(unit) || unit.defence().value() <= 0) {
        return null;
    }
    const home = landmassOf(dependencies, unit.tile()), { passengers } = (0, exports.overseasStateFor)(memory), escorted = new Set([...passengers.values()]
        .filter((passenger) => passenger.role === 'escort')
        .map((passenger) => passenger.target)), founder = [...passengers.values()].find((passenger) => passenger.role === 'founder' &&
        home.has(passenger.port.tile()) &&
        !escorted.has(passenger.target));
    if (!founder) {
        return null;
    }
    const escort = {
        target: founder.target,
        role: 'escort',
        port: founder.port,
        since: null,
    };
    passengers.set(unit, escort);
    return escort;
};
exports.planEscort = planEscort;
// Whether the player could ferry a unit from `tile`'s landmass: it has a coastal city there it can sail from.
const canFerryFromLandmassOf = (dependencies, player, tile) => {
    const home = landmassOf(dependencies, tile);
    return dependencies.cityRegistry
        .getByPlayer(player)
        .some((city) => home.has(city.tile()) &&
        city.tile().isCoast() &&
        (0, exports.canFerryFrom)(dependencies, player, city));
};
exports.canFerryFromLandmassOf = canFerryFromLandmassOf;
//# sourceMappingURL=overseas.js.map