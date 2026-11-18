"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warshipsWanted = exports.navalThreatsNear = exports.planNavalTask = exports.strikeBeside = exports.transportsToEscort = exports.bombardTargets = exports.huntTargets = exports.dropNavalPath = exports.isSubmergedType = exports.isWarship = exports.isWarshipType = exports.WARSHIP_NEED = exports.WARSHIPS_PER_THREATENED_CITY = exports.NAVAL_THREAT_DISTANCE = exports.ESCORT_REACH_TURNS = exports.NAVAL_REACH_TURNS = void 0;
// Generic: warships and submarines at war (civ-clone/web-renderer#1128). Only for a ruleset that says what each unit
//  type is for with base-unit-role's `UnitRoles` (Civ2's `@UNITS` roles): a naval superiority type that carries no
//  aircraft (a warship or a submarine, not a carrier) is a warship here. A ruleset that declares no roles (Civ1) has none,
//  so its ships keep exploring and ferrying as they always have. A naval superiority type that ferries land units (Civ2's
//  Frigate) stays a ferry.
//
// After the original's computer players (OpenCiv2 `ai_orders_ship_goal_war`, `ai.cpp:3823`, and the transport's escort
//  goal in `ai_orders_transport_unload`, `:3981`), in our own terms. Each turn a warship, in order:
//  - **strikes** an enemy ship beside it that it would beat (`attackOdds`), or else a city beside it it would bombard;
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
const retreatToHeal_1 = require("./retreatToHeal");
const rivals_1 = require("../Player/rivals");
const explorerShip_1 = require("../City/explorerShip");
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
// Whether `UnitType` (a class) is a warship: a naval superiority type, by the ruleset's roles, that carries no aircraft
//  and no passengers.
const isWarshipType = (UnitType, ruleRegistry) => Object.prototype.isPrototypeOf.call(Types_1.Naval, UnitType) &&
    (0, roleOf_1.hasRole)(UnitType, Roles_1.NavalSuperiorityRole, ruleRegistry) &&
    !(0, traits_1.traitsOf)(UnitType, Carries_1.default, ruleRegistry).some((carries) => carries.carries(Types_1.Air, ruleRegistry)) &&
    // A ship that ferries land units (Civ2's Frigate) is a ferry first, as it always was: as a warship it would hold on
    //  to its passengers to escort itself.
    !(0, carriesUnits_1.isFerryType)(UnitType, ruleRegistry);
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
            navalPaths.set(unit, path);
            return true;
        }
    }
    return false;
};
// The warships whose path a naval task set, so that it's dropped once they have no task: another strategy would
//  otherwise follow it to where a target was.
const navalPaths = new WeakMap();
// Drops the path a naval task gave `unit`, if that's still the path it has (not one another strategy has set since).
const dropNavalPath = (memory, unit) => {
    const path = navalPaths.get(unit);
    navalPaths.delete(unit);
    if (path !== undefined && memory.unitPathData.get(unit) === path) {
        memory.unitPathData.delete(unit);
    }
};
exports.dropNavalPath = dropNavalPath;
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
    const reach = reachOf(unit, exports.NAVAL_REACH_TURNS), weight = new Map(), weighed = (tile) => {
        if (!weight.has(tile)) {
            weight.set(tile, tile.distanceFrom(unit.tile()) /
                (dependencies.unitRegistry
                    .getByTile(tile)
                    .some((other) => hostile(dependencies, player, other) &&
                    isLoadedTransport(dependencies, other))
                    ? 2
                    : 1));
        }
        return weight.get(tile);
    };
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
// The coastal enemy cities `unit` could bombard (an enemy's, or one of its player's that an enemy holds): a surface
//  ship's, within its reach, with a defender it would beat,
//  nearest first, one with the player's own land units within 2 of it as if half as far.
const bombardTargets = (dependencies, player, memory, unit) => {
    if ((0, exports.isSubmergedType)(unit.constructor, dependencies.ruleRegistry)) {
        return [];
    }
    const reach = reachOf(unit, exports.NAVAL_REACH_TURNS), ownLand = dependencies.unitRegistry
        .getByPlayer(player)
        .filter((own) => (0, traits_1.isA)(own, Types_1.Land) && !own.destroyed() && own.tile().isLand())
        .map((own) => own.tile()), weight = new Map(), weighed = (tile) => {
        if (!weight.has(tile)) {
            weight.set(tile, tile.distanceFrom(unit.tile()) /
                (ownLand.some((own) => own.distanceFrom(tile) <= 2)
                    ? 2
                    : 1));
        }
        return weight.get(tile);
    };
    return [
        ...memory.targets.enemyCitiesToAttack,
        ...memory.targets.citiesToLiberate,
    ]
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
        // Unclaimed, claimed by `unit`, or claimed by a warship since sunk or gone to heal (`RetreatToHeal` takes a
        //  damaged one before it's asked again).
        const by = escorts.get(transport);
        return (!transport.destroyed() &&
            transport.tile().isWater() &&
            isLoadedTransport(dependencies, transport) &&
            transport.tile().distanceFrom(unit.tile()) <= reach &&
            (by === undefined ||
                by === unit ||
                by.destroyed() ||
                (0, retreatToHeal_1.healsThisTurn)(dependencies, by)));
    })
        .sort((a, b) => a.tile().distanceFrom(unit.tile()) - b.tile().distanceFrom(unit.tile()));
};
exports.transportsToEscort = transportsToEscort;
// The tile beside `unit` it would strike now, if any: an enemy ship to hunt, or else an enemy city to bombard. Reads only.
const strikeBeside = (dependencies, player, memory, unit) => strikeBesideOf(unit, (0, exports.huntTargets)(dependencies, player, memory, unit), (0, exports.bombardTargets)(dependencies, player, memory, unit));
exports.strikeBeside = strikeBeside;
const strikeBesideOf = (unit, hunt, bombard) => {
    var _a, _b;
    const beside = (tile) => tile.isNeighbourOf(unit.tile());
    return (_b = (_a = hunt.find(beside)) !== null && _a !== void 0 ? _a : bombard.find(beside)) !== null && _b !== void 0 ? _b : null;
};
// Gives `unit`, a warship, its task for the turn: a path for it (`memory.unitPathData`), or the tile beside it to strike
//  now. `null` when it has none of its own, leaving it to the missions every unit has.
const planNavalTask = (dependencies, player, memory, unit) => {
    var _a, _b;
    // Next to its prey, or a city to bombard, it strikes, escorting or not (a claim it had stands: it sails on to it once
    //  it has struck).
    const hunt = (0, exports.huntTargets)(dependencies, player, memory, unit), bombard = (0, exports.bombardTargets)(dependencies, player, memory, unit), strike = strikeBesideOf(unit, hunt, bombard);
    if (strike !== null) {
        memory.unitPathData.delete(unit);
        return {
            task: dependencies.cityRegistry.getByTile(strike) === null
                ? 'hunt'
                : 'bombard',
            strike,
        };
    }
    const escorts = escortsFor(dependencies, memory);
    // A warship escorts one transport at a time: whatever it had claimed before this plan is let go.
    escorts.forEach((escort, transport) => {
        if (escort === unit) {
            escorts.delete(transport);
        }
    });
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
    for (const tile of bombard) {
        if (sailFor(dependencies, memory, unit, waterBeside(unit, tile))) {
            return { task: 'bombard', strike: null };
        }
    }
    (0, exports.dropNavalPath)(memory, unit);
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
        cities: [
            ...targets.enemyCitiesToAttack,
            ...targets.citiesToLiberate,
        ].filter((tile) => {
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
// The number of `player`'s coastal cities with an enemy ship or an enemy's coastal city within reach. Production runs it
//  for every city that chooses, so it's kept for the rest of the turn once the player's own survey has filled the board
//  this turn (`Memory#surveyedTurn`), and never from a board left from an earlier turn (a choice made during another
//  player's turn, from `unitDestroyed`).
const threatenedCounts = new WeakMap();
const threatenedPorts = (dependencies, player, targets) => {
    const turn = dependencies.turn.value(), memory = dependencies.memoryRegistry.memoryFor(player), surveyed = memory.targets === targets && memory.surveyedTurn === turn, known = surveyed ? threatenedCounts.get(targets) : undefined;
    if (known && known.turn === turn) {
        return known.count;
    }
    const count = dependencies.cityRegistry
        .getByPlayer(player)
        .filter((other) => {
        if (!other.tile().isCoast() || !(0, explorerShip_1.isOnSea)(other)) {
            return false;
        }
        const near = (0, exports.navalThreatsNear)(dependencies, player, targets, other);
        return near.ships.length > 0 || near.cities.length > 0;
    }).length;
    if (surveyed) {
        threatenedCounts.set(targets, { turn, count });
    }
    return count;
};
const warshipsWanted = (dependencies, player, targets, city) => {
    const threatenedHere = (0, exports.navalThreatsNear)(dependencies, player, targets, city), here = threatenedHere.ships.length > 0 || threatenedHere.cities.length > 0, memory = dependencies.memoryRegistry.memoryFor(player), units = dependencies.unitRegistry.getByPlayer(player), ferrying = units.filter((unit) => (0, carriesUnits_1.isFerry)(unit, dependencies.ruleRegistry) &&
        (0, overseas_1.isFerrying)(dependencies, memory, unit)).length;
    if (!here && ferrying === 0) {
        return null;
    }
    // This city counts whatever was kept, as it may have become threatened since.
    const threatened = Math.max(threatenedPorts(dependencies, player, targets), here ? 1 : 0);
    if (threatened === 0) {
        return null;
    }
    const isWarshipItem = (item) => (0, exports.isWarshipType)(item, dependencies.ruleRegistry), warships = units.filter((unit) => isWarshipItem(unit.constructor)), submerged = warships.filter((unit) => (0, exports.isSubmergedType)(unit.constructor, dependencies.ruleRegistry)).length, surface = warships.length - submerged, onOrder = dependencies.cityRegistry
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
        // Only for ships to hunt, while surface warships outnumber submarines and there are enough of them to escort the
        //  transports in use, as submarines don't.
        submarines: threatenedHere.ships.length > 0 &&
            surface > submerged &&
            surface >= ferrying,
    };
};
exports.warshipsWanted = warshipsWanted;
exports.default = exports.planNavalTask;
//# sourceMappingURL=navalWar.js.map