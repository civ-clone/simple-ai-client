"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sail = exports.raid = exports.leader = exports.bestStep = exports.nearestCity = exports.liveCities = exports.LEADER_FOLLOWS = exports.LANDING_DISTANCE = exports.TOO_FAR = exports.STRANDED_EVERY = exports.POLAR_ROWS = void 0;
// Civ1: how a barbarian unit moves (v474.05 `AIEngine.cs` `F0_25fb_362d_MoveBarbarianUnit`), for `BarbarianClient`'s
//  `Raid` strategy (civ-clone/web-renderer#169).
const Actions_1 = require("@civ-clone/library-unit/Actions");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const TileImprovements_1 = require("@civ-clone/civ1-world/TileImprovements");
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
const Path_1 = require("@civ-clone/core-world-path/Path");
const cityGold_1 = require("@civ-clone/civ1-barbarians/lib/cityGold");
const isBarbarian_1 = require("@civ-clone/base-civilization-barbarian/isBarbarian");
const polar_1 = require("@civ-clone/civ1-barbarians/lib/polar");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
// A barbarian within this many of v474.05's 50 rows of either edge leaves the map.
exports.POLAR_ROWS = 2;
// Every fourth turn, staggered by unit, a raider too far from any city, or on the wrong continent, gives up.
exports.STRANDED_EVERY = 4;
exports.TOO_FAR = 8;
// How near a city a ship must be to land its raiders.
exports.LANDING_DISTANCE = 8;
// How near a friendly unit the leader walks to.
exports.LEADER_FOLLOWS = 4;
const STEP_LIMIT = 50;
// How far `to` is from `from` on one axis, the short way round a wrapping world: negative for west or north.
const wrappedDelta = (from, to, size) => {
    const delta = (((to - from) % size) + size) % size;
    return delta > size / 2 ? delta - size : delta;
};
const landMassOf = (tile) => {
    var _a;
    return (_a = tile
        .map()
        .landMasses()
        .find((landMass) => landMass.hasTile(tile))) !== null && _a !== void 0 ? _a : null;
};
const liveCities = (dependencies) => dependencies.cityRegistry
    .entries()
    .filter((city) => !city.destroyed());
exports.liveCities = liveCities;
const nearestCity = (tile, cities) => cities.reduce((nearest, city) => nearest === null ||
    tile.distanceFrom(city.tile()) < tile.distanceFrom(nearest.tile())
    ? city
    : nearest, null);
exports.nearestCity = nearestCity;
// Takes `action` and says whether it did anything, as `moveUnit`'s `takeAction` does, so a step that changes nothing
//  isn't taken again for ever.
const takeAction = (unit, action) => {
    const tile = unit.tile(), moves = unit.moves().value();
    unit.action(action);
    return (!unit.active() || unit.tile() !== tile || unit.moves().value() !== moves);
};
const standDown = (dependencies, unit) => {
    if (unit.active() && !unit.destroyed() && unit.moves().value() > 0) {
        (0, orders_1.noOrders)(dependencies, unit);
    }
};
// The player's own units beside `tile`, other than `unit`.
const friendsBeside = (dependencies, player, unit, tile) => tile
    .getNeighbours()
    .flatMap((neighbour) => dependencies.unitRegistry.getByTile(neighbour))
    .filter((other) => other !== unit && other.player() === player);
/**
 * The best step from where `unit` stands, scored as v474.05 does: 0–5 at random, +6 onto irrigation or a mine, +99
 * to attack a unit that isn't a Diplomat, +2 for each axis towards `target`; an enemy city next door is always
 * entered. `null` when no neighbour can be stepped onto or attacked.
 */
const bestStep = (dependencies, player, unit, target) => {
    var _a, _b;
    const from = unit.tile(), world = from.map(), towards = target
        ? [
            Math.sign(wrappedDelta(from.x(), target.x(), world.width())),
            Math.sign(wrappedDelta(from.y(), target.y(), world.height())),
        ]
        : [0, 0];
    let best = null;
    for (const to of from.getNeighbours()) {
        const actions = unit.actions(to), enemy = dependencies.unitRegistry
            .getByTile(to)
            .find((other) => other.player() !== player), capture = actions.find((action) => action instanceof Actions_1.CaptureCity || action instanceof Actions_1.SneakCaptureCity), attack = actions.find((action) => action instanceof Actions_1.Attack || action instanceof Actions_1.SneakAttack), move = (_a = actions.find((action) => action.constructor === Actions_1.Move)) !== null && _a !== void 0 ? _a : actions.find((action) => action instanceof Actions_1.Move), action = (_b = capture !== null && capture !== void 0 ? capture : attack) !== null && _b !== void 0 ? _b : (enemy ? null : move);
        if (!action) {
            continue;
        }
        if (capture) {
            return { action, score: Infinity, to };
        }
        let score = Math.floor(dependencies.randomNumberGenerator() * 6);
        if (dependencies.tileImprovementRegistry
            .getByTile(to)
            .some((improvement) => improvement instanceof TileImprovements_1.Irrigation || improvement instanceof TileImprovements_1.Mine)) {
            score += 6;
        }
        if (attack && enemy && !(enemy instanceof Units_1.Diplomat)) {
            score += 99;
        }
        const direction = [
            Math.sign(wrappedDelta(from.x(), to.x(), world.width())),
            Math.sign(wrappedDelta(from.y(), to.y(), world.height())),
        ];
        [0, 1].forEach((axis) => {
            if (towards[axis] !== 0 && direction[axis] === towards[axis]) {
                score += 2;
            }
        });
        if (best === null || score > best.score) {
            best = { action, score, to };
        }
    }
    return best;
};
exports.bestStep = bestStep;
// Steps `unit` towards `target` (or wherever scores best) until its moves are spent, then stands it down.
const march = (dependencies, player, unit, target) => {
    for (let steps = 0; unit.active() &&
        !unit.destroyed() &&
        unit.moves().value() > 0 &&
        steps < STEP_LIMIT; steps++) {
        const step = (0, exports.bestStep)(dependencies, player, unit, target);
        if (step === null || !takeAction(unit, step.action)) {
            break;
        }
    }
    standDown(dependencies, unit);
};
// Whether `city`'s owner is worth raiding: not the barbarians themselves, and not a civilization with fewer than 2
//  cities and under 100 gold (`AIEngine.cs` L2343-2347).
const worthRaiding = (dependencies, city) => {
    const owner = city.player();
    if ((0, isBarbarian_1.default)(owner)) {
        return false;
    }
    return (dependencies.cityRegistry.getByPlayer(owner).length >= 2 ||
        dependencies.playerTreasuryRegistry
            .getByPlayerAndType(owner, Gold_1.default)
            .value() >= 100);
};
/**
 * The leader (the group's Diplomat): he stays with a stack, and otherwise walks to a friendly unit within 4 squares.
 * What becomes of him when he's stranded, and when he enters a city, is civ-clone/web-renderer#171.
 */
const leader = (dependencies, player, unit) => {
    const here = dependencies.unitRegistry
        .getByTile(unit.tile())
        .filter((other) => other !== unit &&
        other.player() === player &&
        !(other instanceof Units_1.Diplomat));
    if (here.length > 0) {
        standDown(dependencies, unit);
        return;
    }
    const friend = dependencies.unitRegistry
        .getByPlayer(player)
        .filter((other) => other !== unit &&
        !(other instanceof Units_1.Diplomat) &&
        other.tile().isLand() &&
        unit.tile().distanceFrom(other.tile()) < exports.LEADER_FOLLOWS)
        .sort((a, b) => unit.tile().distanceFrom(a.tile()) - unit.tile().distanceFrom(b.tile()))[0];
    if (!friend) {
        standDown(dependencies, unit);
        return;
    }
    march(dependencies, player, unit, friend.tile());
};
exports.leader = leader;
/**
 * A raider's turn: off the map near the poles; every fourth turn, gone if stranded; in a city, fortified when alone or
 * a defender; otherwise marching on the nearest city of a civilization worth raiding on its continent, attacking
 * what it meets.
 */
const raid = (dependencies, player, unit) => {
    const tile = unit.tile();
    if ((0, polar_1.nearPole)(tile, exports.POLAR_ROWS)) {
        unit.destroy();
        return;
    }
    if (unit instanceof Units_1.Diplomat) {
        (0, exports.leader)(dependencies, player, unit);
        return;
    }
    const cities = (0, exports.liveCities)(dependencies), nearest = (0, exports.nearestCity)(tile, cities), stagger = dependencies.unitRegistry.entries().indexOf(unit);
    if (nearest !== null &&
        (stagger + dependencies.turn.value()) % exports.STRANDED_EVERY === 0 &&
        (landMassOf(tile) !== landMassOf(nearest.tile()) ||
            tile.distanceFrom(nearest.tile()) > exports.TOO_FAR)) {
        unit.destroy();
        return;
    }
    const here = dependencies.cityRegistry.getByTile(tile);
    if (here !== null &&
        here.player() === player &&
        (dependencies.unitRegistry
            .getByTile(tile)
            .filter((other) => other !== unit).length === 0 ||
            unit.defence().value() >= unit.attack().value())) {
        const fortify = unit
            .actions()
            .find((action) => action instanceof Actions_1.Fortify);
        if (fortify) {
            unit.action(fortify);
        }
        standDown(dependencies, unit);
        return;
    }
    const target = nearest !== null &&
        landMassOf(tile) === landMassOf(nearest.tile()) &&
        worthRaiding(dependencies, nearest)
        ? nearest.tile()
        : null;
    march(dependencies, player, unit, target);
};
exports.raid = raid;
/**
 * A raiding ship's turn: gone once empty; within 8 of a city, lands everyone on an empty square next to the ship on
 * that city's continent (`barbarians:landed`); otherwise sails for the city with the best gold for the distance, or
 * is gone when none scores.
 */
const sail = (dependencies, player, ship) => {
    var _a;
    const tile = ship.tile(), 
    // A transport is a `Unit` at runtime; its type's keys differ, which is all the cast papers over.
    asUnit = ship;
    if ((0, polar_1.nearPole)(tile, exports.POLAR_ROWS)) {
        ship.destroy();
        return;
    }
    const cargo = ship.cargo();
    if (cargo.length === 0) {
        ship.destroy();
        return;
    }
    const cities = (0, exports.liveCities)(dependencies), nearest = (0, exports.nearestCity)(tile, cities);
    if (nearest !== null &&
        tile.distanceFrom(nearest.tile()) <= exports.LANDING_DISTANCE) {
        const landMass = landMassOf(nearest.tile()), landing = tile
            .getNeighbours()
            .find((neighbour) => neighbour.isLand() &&
            !(0, polar_1.nearPole)(neighbour, exports.POLAR_ROWS) &&
            dependencies.cityRegistry.getByTile(neighbour) === null &&
            dependencies.unitRegistry.getByTile(neighbour).length === 0 &&
            landMassOf(neighbour) === landMass);
        if (landing) {
            cargo.forEach((unit) => {
                const disembark = unit
                    .actions(landing)
                    .find((action) => action instanceof Actions_1.Disembark);
                if (disembark) {
                    unit.action(disembark);
                }
            });
            dependencies.engine.emit('barbarians:landed', player, nearest, landing);
            standDown(dependencies, asUnit);
            return;
        }
    }
    const target = cities
        .filter((city) => !(0, isBarbarian_1.default)(city.player()))
        .map((city) => [
        city,
        Math.floor(((0, cityGold_1.default)(city, {
            cities: dependencies.cityRegistry,
            cityGrowth: dependencies.cityGrowthRegistry,
            playerTreasuries: dependencies.playerTreasuryRegistry,
        }) +
            50) /
            (tile.distanceFrom(city.tile()) + 1)),
    ])
        .reduce((best, candidate) => { var _a; return candidate[1] > ((_a = best === null || best === void 0 ? void 0 : best[1]) !== null && _a !== void 0 ? _a : 0) ? candidate : best; }, null);
    if (target === null) {
        ship.destroy();
        return;
    }
    // To a sea square beside the city, the nearest first: the path finder won't take a ship into a city it can't enter.
    const path = target[0]
        .tile()
        .getNeighbours()
        .filter((neighbour) => neighbour.isWater())
        .sort((a, b) => tile.distanceFrom(a) - tile.distanceFrom(b))
        .reduce((found, end) => {
        var _a;
        return (_a = found !== null && found !== void 0 ? found : Path_1.default.for(asUnit, tile, end, dependencies.pathFinderRegistry)) !== null && _a !== void 0 ? _a : null;
    }, null);
    if (path === null) {
        standDown(dependencies, asUnit);
        return;
    }
    for (let steps = 0; ship.active() &&
        ship.moves().value() > 0 &&
        path.length > 0 &&
        steps < STEP_LIMIT; steps++) {
        const next = path.shift();
        if (!next.isNeighbourOf(asUnit.tile())) {
            break;
        }
        const actions = asUnit.actions(next), move = (_a = actions.find((action) => action.constructor === Actions_1.Move)) !== null && _a !== void 0 ? _a : actions.find((action) => action instanceof Actions_1.Move);
        if (!move || !takeAction(asUnit, move)) {
            break;
        }
    }
    standDown(dependencies, asUnit);
};
exports.sail = sail;
//# sourceMappingURL=raid.js.map