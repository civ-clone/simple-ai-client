"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warshipsWanted = exports.navalThreatsNear = exports.planNavalTask = exports.transportsToEscort = exports.bombardTargets = exports.huntTargets = exports.isSubmergedType = exports.isWarship = exports.isWarshipType = exports.WARSHIP_NEED = exports.WARSHIPS_PER_THREATENED_CITY = exports.NAVAL_THREAT_DISTANCE = exports.ESCORT_REACH_TURNS = exports.NAVAL_REACH_TURNS = void 0;
// Generic: warships and submarines at war (civ-clone/web-renderer#1128). Only for a ruleset that says what each unit
//  type is for with base-unit-role's `UnitRoles` (Civ2's `@UNITS` roles): a naval superiority type that carries no
//  aircraft (a warship or a submarine, not a carrier) is a warship here. A ruleset that declares no roles (Civ1) has none,
//  so its ships keep exploring and ferrying as they always have.
//
// After the original's computer players (OpenCiv2 `ai_orders_ship_goal_war`, `ai.cpp:3823`, and the transport's escort
//  goal in `ai_orders_transport_unload`, `:3981`), in our own terms. Each turn a warship, in order:
//  - **strikes** an enemy ship beside it that it would beat (`attackOdds`);
//  - **escorts** one of its player's loaded transports at sea within its reach that no other warship escorts, sailing
//    alongside it (to defend its square) or, failing that, for where it's going;
//  - **hunts** the nearest enemy ship within its reach that it would beat, a loaded transport counting as half as far;
//  - **bombards** a coastal city of an enemy's, a surface ship only, whose defender it would beat, from the sea beside it;
//    one with the player's own land units near it counting as half as far, as the original's air raids weigh them;
//  - otherwise does what any ship does (`MissionAndMove`: exploring, hunting further afield, standing down).
// An enemy is a player the computer player has no treaty with (`isEnemy`), the barbarians among them.
const Types_1 = require("@civ-clone/library-unit/Types");
const attackOdds_1 = require("./attackOdds");
const traits_1 = require("@civ-clone/core-unit/traits");
const Carries_1 = require("@civ-clone/base-unit-trait-carries/Carries");
const Roles_1 = require("@civ-clone/base-unit-role/Roles");
const Path_1 = require("@civ-clone/core-world-path/Path");
const Submerged_1 = require("@civ-clone/base-unit-trait-submerged/Submerged");
const roleOf_1 = require("@civ-clone/base-unit-role/roleOf");
const rivals_1 = require("../Player/rivals");
const reachable_1 = require("@civ-clone/base-strategy-ai/lib/Unit/reachable");
const carriesUnits_1 = require("./carriesUnits");
const overseas_1 = require("./overseas");
// How many turns of its moves away a warship looks for a ship to hunt or a city to bombard.
exports.NAVAL_REACH_TURNS = 3;
// How many turns of its moves away a warship looks for a transport to escort.
exports.ESCORT_REACH_TURNS = 2;
// How far (in tiles) from one of a player's coastal cities an enemy ship, or an enemy's coastal city, makes the city want
//  a warship (`navalThreatsNear`): about two turns of a Destroyer's.
exports.NAVAL_THREAT_DISTANCE = 12;
// Warships a player wants for each of its coastal cities with an enemy ship or coastal city in reach, rounded up.
exports.WARSHIPS_PER_THREATENED_CITY = 0.5;
// What a warship scores in production when the player has none of those it wants, against the other needs
//  (`ProductionPolicy#needs`): under a reinforcement (3), over a Caravan (1).
exports.WARSHIP_NEED = 2;
// Whether `UnitType` (a class) is a warship: a naval superiority type, by the ruleset's roles, that carries no aircraft.
const isWarshipType = (UnitType, ruleRegistry) => Object.prototype.isPrototypeOf.call(Types_1.Naval, UnitType) &&
    (0, roleOf_1.hasRole)(UnitType, Roles_1.NavalSuperiorityRole, ruleRegistry) &&
    !(0, traits_1.traitsOf)(UnitType, Carries_1.default, ruleRegistry).some((carries) => carries.carries(Types_1.Air, ruleRegistry));
exports.isWarshipType = isWarshipType;
const isWarship = (unit, ruleRegistry) => (0, exports.isWarshipType)(unit.constructor, ruleRegistry);
exports.isWarship = isWarship;
// Whether `UnitType` stays under water: a submarine attacks only at sea, so never bombards a city.
const isSubmergedType = (UnitType, ruleRegistry) => (0, traits_1.hasTrait)(UnitType, Submerged_1.default, ruleRegistry);
exports.isSubmergedType = isSubmergedType;
// Whether `unit` is another player's that `player` would fight: one it has no treaty with.
const hostile = (dependencies, player, unit) => unit.player() !== player &&
    !unit.destroyed() &&
    (0, rivals_1.isEnemy)(dependencies, player, unit.player());
// A transport of another player's with land units aboard.
const isLoadedTransport = (dependencies, unit) => (0, carriesUnits_1.isFerry)(unit, dependencies.ruleRegistry) &&
    unit.hasCargo();
// How far `unit` could sail in `turns` turns, in tiles.
const reachOf = (unit, turns) => Math.max(1, Math.floor(unit.movement().value())) * turns;
// The water tiles beside `tile`, nearest `unit` first.
const waterBeside = (unit, tile) => tile
    .getNeighbours()
    .filter((neighbour) => neighbour.isWater())
    .sort((a, b) => a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile()));
// Sets `unit` off for the first of `ranked` it has a path to (`ranked` is tried as given), or, when it's next to it
//  already, clears its path so that the move executor's step takes the battle. Returns whether there was one.
const sailFor = (dependencies, memory, unit, ranked) => {
    // Only worked out if there's a tile to check: a search for a tile on another sea covers all of this one.
    let reachable;
    for (const tile of ranked) {
        if (tile === unit.tile()) {
            memory.unitPathData.delete(unit);
            return true;
        }
        if (reachable === undefined) {
            reachable = (0, reachable_1.reachableTiles)(unit, dependencies.turn.value());
        }
        if (reachable !== null && !reachable.has(tile)) {
            continue;
        }
        const path = Path_1.default.for(unit, unit.tile(), tile, dependencies.pathFinderRegistry);
        if (path) {
            memory.unitPathData.set(unit, path);
            return true;
        }
    }
    return false;
};
const escortStates = new WeakMap();
const escortsFor = (dependencies, memory) => {
    const turn = dependencies.turn.value(), state = escortStates.get(memory);
    if (state && state.turn === turn) {
        return state.escorts;
    }
    const fresh = { turn, escorts: new Map() };
    escortStates.set(memory, fresh);
    return fresh.escorts;
};
// The enemy ships `unit` could hunt: on the target board, at sea, within its reach and beaten at the odds it wants,
//  nearest first, a loaded transport as if half as far.
const huntTargets = (dependencies, player, memory, unit) => {
    const reach = reachOf(unit, exports.NAVAL_REACH_TURNS), weighed = (tile) => tile.distanceFrom(unit.tile()) /
        (dependencies.unitRegistry
            .getByTile(tile)
            .some((other) => hostile(dependencies, player, other) &&
            isLoadedTransport(dependencies, other))
            ? 2
            : 1);
    return memory.targets.enemyUnitsToAttack
        .filter((tile) => tile.isWater() &&
        tile.distanceFrom(unit.tile()) <= reach &&
        dependencies.unitRegistry
            .getByTile(tile)
            .some((other) => hostile(dependencies, player, other) && (0, traits_1.isA)(other, Types_1.Naval)) &&
        (0, attackOdds_1.attackOdds)(dependencies, unit, tile) >= attackOdds_1.ATTACK_ODDS)
        .sort((a, b) => weighed(a) - weighed(b));
};
exports.huntTargets = huntTargets;
// The coastal enemy cities `unit` could bombard: a surface ship's, within its reach, with a defender it would beat,
//  nearest first, one with the player's own land units within 2 of it as if half as far.
const bombardTargets = (dependencies, player, memory, unit) => {
    if ((0, exports.isSubmergedType)(unit.constructor, dependencies.ruleRegistry)) {
        return [];
    }
    const reach = reachOf(unit, exports.NAVAL_REACH_TURNS), ownLandNear = (tile) => dependencies.unitRegistry
        .getByPlayer(player)
        .some((own) => (0, traits_1.isA)(own, Types_1.Land) &&
        !own.destroyed() &&
        own.tile().isLand() &&
        own.tile().distanceFrom(tile) <= 2), weighed = (tile) => tile.distanceFrom(unit.tile()) / (ownLandNear(tile) ? 2 : 1);
    return memory.targets.enemyCitiesToAttack
        .filter((tile) => {
        const city = dependencies.cityRegistry.getByTile(tile);
        return (city !== null &&
            tile.isCoast() &&
            tile.distanceFrom(unit.tile()) <= reach &&
            (0, rivals_1.isEnemy)(dependencies, player, city.player()) &&
            dependencies.unitRegistry
                .getByTile(tile)
                .some((other) => !other.destroyed()) &&
            (0, attackOdds_1.attackOdds)(dependencies, unit, tile) >= attackOdds_1.ATTACK_ODDS);
    })
        .sort((a, b) => weighed(a) - weighed(b));
};
exports.bombardTargets = bombardTargets;
// The player's loaded transports at sea within `unit`'s reach with no other warship escorting them, nearest first; none
//  for a submarine.
const transportsToEscort = (dependencies, player, memory, unit) => {
    // A submarine can't keep up with a transport, and defends badly against ships.
    if ((0, exports.isSubmergedType)(unit.constructor, dependencies.ruleRegistry)) {
        return [];
    }
    const reach = reachOf(unit, exports.ESCORT_REACH_TURNS), escorts = escortsFor(dependencies, memory);
    return dependencies.unitRegistry
        .getByPlayer(player)
        .filter((transport) => {
        var _a;
        return !transport.destroyed() &&
            transport.tile().isWater() &&
            isLoadedTransport(dependencies, transport) &&
            transport.tile().distanceFrom(unit.tile()) <= reach &&
            ((_a = escorts.get(transport)) !== null && _a !== void 0 ? _a : unit) === unit;
    })
        .sort((a, b) => a.tile().distanceFrom(unit.tile()) - b.tile().distanceFrom(unit.tile()));
};
exports.transportsToEscort = transportsToEscort;
// Gives `unit`, a warship, its task for the turn: a path for it (`memory.unitPathData`), or the tile beside it to strike
//  now. `null` when it has none of its own, leaving it to the missions every unit has.
const planNavalTask = (dependencies, player, memory, unit) => {
    var _a, _b;
    const hunt = (0, exports.huntTargets)(dependencies, player, memory, unit), [beside] = hunt.filter((tile) => tile.isNeighbourOf(unit.tile()));
    // Next to its prey, it strikes, escorting or not.
    if (beside) {
        memory.unitPathData.delete(unit);
        return { task: 'hunt', strike: beside };
    }
    const escorts = escortsFor(dependencies, memory);
    for (const transport of (0, exports.transportsToEscort)(dependencies, player, memory, unit)) {
        // Alongside it, so that it defends the transport's square; or, where it can't get there, where it's going.
        const heading = (_b = (_a = memory.unitPathData.get(transport)) === null || _a === void 0 ? void 0 : _a.end()) !== null && _b !== void 0 ? _b : null, destinations = [
            transport.tile(),
            ...(heading && heading.isWater() ? [heading] : []),
        ];
        escorts.set(transport, unit);
        if (destinations.includes(unit.tile())) {
            memory.unitPathData.delete(unit);
            return { task: 'escort', strike: null, escorting: transport };
        }
        if (sailFor(dependencies, memory, unit, destinations)) {
            return { task: 'escort', strike: null, escorting: transport };
        }
        escorts.delete(transport);
    }
    // Otherwise it sails for the sea beside its prey.
    for (const tile of hunt) {
        if (sailFor(dependencies, memory, unit, waterBeside(unit, tile))) {
            return { task: 'hunt', strike: null };
        }
    }
    for (const tile of (0, exports.bombardTargets)(dependencies, player, memory, unit)) {
        if (tile.isNeighbourOf(unit.tile())) {
            memory.unitPathData.delete(unit);
            return { task: 'bombard', strike: tile };
        }
        if (sailFor(dependencies, memory, unit, waterBeside(unit, tile))) {
            return { task: 'bombard', strike: null };
        }
    }
    return null;
};
exports.planNavalTask = planNavalTask;
// The tiles of enemy ships and enemy coastal cities within `NAVAL_THREAT_DISTANCE` of `city`, from the player's target
//  board: what makes a coastal city want a warship.
const navalThreatsNear = (dependencies, player, targets, city) => {
    const near = (tile) => tile.distanceFrom(city.tile()) <= exports.NAVAL_THREAT_DISTANCE;
    return {
        ships: targets.enemyUnitsToAttack.filter((tile) => tile.isWater() &&
            near(tile) &&
            dependencies.unitRegistry
                .getByTile(tile)
                .some((other) => hostile(dependencies, player, other) && (0, traits_1.isA)(other, Types_1.Naval))),
        cities: targets.enemyCitiesToAttack.filter((tile) => {
            const other = dependencies.cityRegistry.getByTile(tile);
            return (other !== null &&
                tile.isCoast() &&
                near(tile) &&
                (0, rivals_1.isEnemy)(dependencies, player, other.player()));
        }),
    };
};
exports.navalThreatsNear = navalThreatsNear;
// How many warships `player` wants, how many it has (and has on order), and whether `city` may build a submarine, when
//  `city` (a coastal city on the sea) should build one; otherwise `null`. A city builds them while an enemy ship or an
//  enemy's coastal city is within reach of it, as the original builds naval units only in a coastal city on open water
//  (`city_choose_production`, `city_production.cpp:1906-1911`); or, while any of the player's coastal cities is, for
//  its transports in use (`isFerrying`), to escort them. It wants one for every two such cities, and one for each
//  transport in use. A submarine can neither bombard nor keep up with a transport, so it builds one only for ships to
//  hunt and only while it has more surface warships than submarines.
const warshipsWanted = (dependencies, player, targets, city) => {
    const threatenedHere = (0, exports.navalThreatsNear)(dependencies, player, targets, city), threatened = dependencies.cityRegistry
        .getByPlayer(player)
        .filter((other) => {
        if (!other.tile().isCoast()) {
            return false;
        }
        const near = other === city
            ? threatenedHere
            : (0, exports.navalThreatsNear)(dependencies, player, targets, other);
        return near.ships.length > 0 || near.cities.length > 0;
    }).length;
    if (threatened === 0) {
        return null;
    }
    const memory = dependencies.memoryRegistry.memoryFor(player), units = dependencies.unitRegistry.getByPlayer(player), ferrying = units.filter((unit) => (0, carriesUnits_1.isFerry)(unit, dependencies.ruleRegistry) &&
        (0, overseas_1.isFerrying)(dependencies, memory, unit)).length, here = threatenedHere.ships.length > 0 || threatenedHere.cities.length > 0;
    if (!here && ferrying === 0) {
        return null;
    }
    const isWarshipItem = (item) => (0, exports.isWarshipType)(item, dependencies.ruleRegistry), warships = units.filter((unit) => isWarshipItem(unit.constructor)), submerged = warships.filter((unit) => (0, exports.isSubmergedType)(unit.constructor, dependencies.ruleRegistry)).length, onOrder = dependencies.cityRegistry
        .getByPlayer(player)
        .filter((other) => {
        const building = dependencies.cityBuildRegistry
            .getByCity(other)
            .building();
        return building !== null && isWarshipItem(building.item());
    }).length;
    return {
        wanted: Math.ceil(threatened * exports.WARSHIPS_PER_THREATENED_CITY) + ferrying,
        have: warships.length + onOrder,
        submarines: threatenedHere.ships.length > 0 &&
            warships.length - submerged > submerged,
    };
};
exports.warshipsWanted = warshipsWanted;
exports.default = exports.planNavalTask;
//# sourceMappingURL=navalWar.js.map