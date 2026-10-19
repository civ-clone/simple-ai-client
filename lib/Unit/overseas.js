"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canFerryFromLandmassOf = exports.planEscort = exports.isFerrying = exports.canBerthAt = exports.planInvasion = exports.invasionTargets = exports.planGarrison = exports.candidatesFor = exports.citiesShortOfDefenders = exports.originOf = exports.isPassenger = exports.isFounder = exports.waitingAt = exports.settlesOverseas = exports.SCARCE_SITES = exports.mustered = exports.musterWaited = exports.invadersFor = exports.travel = exports.dropPassenger = exports.planPassenger = exports.canFerryFrom = exports.MUSTER_WAIT = exports.MUSTER = exports.INVADERS = exports.ESCORT_WAIT = exports.overseasStateFor = void 0;
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
const rivals_1 = require("../Player/rivals");
const AttackConfidence_1 = require("@civ-clone/base-leader-personality/Rules/Player/AttackConfidence");
const strength_1 = require("@civ-clone/core-power/lib/strength");
const combine_1 = require("@civ-clone/base-leader-personality/lib/combine");
const OverseasSettlers_1 = require("@civ-clone/base-leader-personality/Rules/Player/OverseasSettlers");
const Path_1 = require("@civ-clone/core-world-path/Path");
const explorers_1 = require("../City/explorers");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
const reachable_1 = require("@civ-clone/base-strategy-ai/lib/Unit/reachable");
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
// How many invaders go for the same enemy city, where other roles go one to a target.
exports.INVADERS = 8;
// How much stronger in attack invaders gathered for a city must be than its owner's defence on its landmass before they
//  board, as their leader sees it (`AttackConfidence`), and the most turns they wait to be (Dom, on
//  civ-clone/web-renderer#374: landing one unit at a time lost most of them).
exports.MUSTER = 2;
exports.MUSTER_WAIT = 15;
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
//  ferry it. Targets other passengers are already going for are left to them: one each, or `INVADERS` invaders.
const destination = (dependencies, player, memory, unit, role, candidates) => {
    const home = landmassOf(dependencies, unit.tile()), going = new Map(), share = role === 'invader' ? exports.INVADERS : 1;
    (0, exports.overseasStateFor)(memory).passengers.forEach((passenger, other) => {
        var _a;
        if (other !== unit && !other.destroyed()) {
            going.set(passenger.target, ((_a = going.get(passenger.target)) !== null && _a !== void 0 ? _a : 0) + 1);
        }
    });
    for (const target of [...candidates]
        .filter((tile) => { var _a; return !home.has(tile) && ((_a = going.get(tile)) !== null && _a !== void 0 ? _a : 0) < share; })
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
    const found = destination(dependencies, player, memory, unit, role, candidates);
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
    if (embark &&
        (passenger.role !== 'invader' ||
            (0, exports.mustered)(dependencies, player, memory, passenger))) {
        (0, exports.overseasStateFor)(memory).origins.set(unit, landmassOf(dependencies, tile));
        // The `instanceof` narrows it to a type that isn't assignable to `Action` (civ-clone/web-renderer#21).
        unit.action(embark);
        return true;
    }
    (0, orders_1.noOrders)(dependencies, unit);
    return true;
};
exports.travel = travel;
// The invaders going for `target`, that have reached their port or set sail.
const invadersFor = (memory, target) => [...(0, exports.overseasStateFor)(memory).passengers.entries()].filter(([unit, passenger]) => passenger.role === 'invader' &&
    passenger.target === target &&
    passenger.since !== null &&
    !unit.destroyed());
exports.invadersFor = invadersFor;
// How long the first of the invaders going for `target` has waited.
const musterWaited = (dependencies, memory, target) => Math.max(0, ...(0, exports.invadersFor)(memory, target).map(([, passenger]) => dependencies.turn.value() - passenger.since));
exports.musterWaited = musterWaited;
// Whether the invaders going for `passenger`'s target are strong enough to take it (`MUSTER`), or have waited long
//  enough (`MUSTER_WAIT`).
const mustered = (dependencies, player, memory, passenger) => {
    const city = dependencies.cityRegistry.getByTile(passenger.target);
    if (city === null ||
        (0, exports.musterWaited)(dependencies, memory, passenger.target) >= exports.MUSTER_WAIT) {
        return true;
    }
    const landmass = landmassOf(dependencies, passenger.target), { attack } = (0, strength_1.militaryStrength)((0, exports.invadersFor)(memory, passenger.target).map(([unit]) => unit), dependencies.ruleRegistry), { defence } = (0, strength_1.militaryStrength)(dependencies.unitRegistry
        .getByPlayer(city.player())
        .filter((unit) => landmass.has(unit.tile())), dependencies.ruleRegistry);
    return (attack *
        (0, combine_1.product)(dependencies.ruleRegistry, AttackConfidence_1.default, player, city.player()) >=
        exports.MUSTER * defence);
};
exports.mustered = mustered;
// A number from 0 to 99 for `unit`, the same every turn, to pick a share of a player's units by.
const shareOf = (unit) => [...unit.id()].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) % 100, 7);
// How few sites for cities a landmass has left, by the survey's board, for it to count as filling up.
exports.SCARCE_SITES = 6;
// Whether `unit`'s landmass is filling up, with fewer than `SCARCE_SITES` sites left (Dom, on
//  civ-clone/web-renderer#374). Counting a landmass shared with another player too sent Expansionists away from room
//  they had at home, and they founded fewer cities.
const homeIsFillingUp = (dependencies, memory, unit) => {
    const home = landmassOf(dependencies, unit.tile());
    return (memory.targets.goodSitesForCities.filter((tile) => home.has(tile)).length < exports.SCARCE_SITES);
};
// Whether `unit`, a founder, is one of the share its leader sends overseas before its landmass is full, once it's
//  filling up (`OverseasSettlers`, civ-clone/web-renderer#374). Sent while there was still plenty of room
//  at home, Expansionists founded fewer cities in all.
const settlesOverseas = (dependencies, player, memory, unit) => (0, exports.isFounder)(unit) &&
    shareOf(unit) <
        100 * (0, combine_1.sum)(dependencies.ruleRegistry, OverseasSettlers_1.default, player) &&
    homeIsFillingUp(dependencies, memory, unit);
exports.settlesOverseas = settlesOverseas;
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
            : role === 'invader'
                ? (0, exports.invasionTargets)(dependencies, player, unit)
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
// An attacker: a land unit with more attack than defence, not a worker.
const isInvader = (unit) => unit instanceof Types_1.Land &&
    !(0, exports.isFounder)(unit) &&
    unit.attack().value() > unit.defence().value();
// The cities of `player`'s rival, one enemy at a time (`rivalOf`), on another landmass than `unit`'s, where it's weaker than
//  `player`, its units there against all of `player`'s, as its leader sees it (`AttackConfidence`): an Aggressive leader
//  takes on a stronger enemy than a Friendly one (civ-clone/web-renderer#374).
const invasionTargets = (dependencies, player, unit) => {
    const home = landmassOf(dependencies, unit.tile()), power = (0, rivals_1.powerOfPlayer)(dependencies, player), 
    // Each owner's power on each landmass, worked out once: `continentOf` gives each landmass one set a turn.
    defended = new Map(), defenceOf = (owner, landmass) => {
        if (!defended.has(owner)) {
            defended.set(owner, new Map());
        }
        const byLandmass = defended.get(owner);
        if (!byLandmass.has(landmass)) {
            byLandmass.set(landmass, (0, rivals_1.powerOf)(dependencies, dependencies.unitRegistry
                .getByPlayer(owner)
                .filter((other) => landmass.has(other.tile()))));
        }
        return byLandmass.get(landmass);
    };
    const rival = (0, rivals_1.rivalOf)(dependencies, player);
    return (0, rivals_1.knownEnemyCities)(dependencies, player)
        .filter((city) => city.player() === rival &&
        !home.has(city.tile()) &&
        defenceOf(city.player(), landmassOf(dependencies, city.tile())) <
            (0, rivals_1.confidentPower)(dependencies, player, city.player(), power))
        .map((city) => city.tile());
};
exports.invasionTargets = invasionTargets;
// An attacker with no enemy city it can reach, and nothing to explore, goes for one overseas (civ-clone/web-renderer#374),
//  up to `INVADERS` to a city, so that a ferry sails with a load.
const planInvasion = (dependencies, player, memory, unit) => isInvader(unit)
    ? (0, exports.planPassenger)(dependencies, player, memory, unit, 'invader', (0, exports.invasionTargets)(dependencies, player, unit))
    : null;
exports.planInvasion = planInvasion;
// Whether `ship` could sail alongside `port`: a water tile beside it is one it can reach.
const canBerthAt = (ship, port) => {
    const reachable = (0, reachable_1.default)(ship);
    return port
        .tile()
        .getNeighbours()
        .some((tile) => tile.isWater() && (reachable === null || reachable.has(tile)));
};
exports.canBerthAt = canBerthAt;
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