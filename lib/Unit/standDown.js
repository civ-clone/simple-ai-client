"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standDown = exports.goAlong = exports.firstPath = exports.citiesInReach = exports.unitsWanted = void 0;
// Generic: what a unit with nothing to do does, in place of walking back and forth for ever (civ-clone/web-renderer#230).
//  In order:
//  1. a unit that could defend a city goes to the nearest of the player's cities it can reach that still wants a unit
//     in it, to defend it or for martial law to use, counting the units already on their way there;
//  2. failing that, it's disbanded, if the ruleset's policy finds it costs more than it's worth;
//  3. otherwise it waits in the player's city it's in, ready for a mission when one comes up;
//  4. or heads for the nearest of the player's cities it can reach, a ship for the sea beside one and then into it;
//  5. or, with none it can reach, stays where it is, fortified if it can be.
const defence_1 = require("../City/defence");
const defence_2 = require("../City/defence");
const Types_1 = require("@civ-clone/library-unit/Types");
const Path_1 = require("@civ-clone/core-world-path/Path");
const moveUnit_1 = require("./moveUnit");
const orders_1 = require("./orders");
const reachable_1 = require("./reachable");
const homeCity_1 = require("./homeCity");
// How many of the cities nearest a unit it looks for a path to, nearest first, before giving up on the rest.
const CITIES_TRIED = 3;
// How many more units `city` wants in it: defenders, or units for martial law to use, whichever it's shorter of.
const unitsWanted = (dependencies, knowledge, city) => {
    const yields = city.yields();
    return Math.max(0, (0, defence_1.defendersWanted)(dependencies, city) -
        (0, defence_1.defendersIn)(dependencies, city).length, (0, defence_2.martialLawUnitsWanted)(dependencies, knowledge, city, yields) -
        (0, defence_2.martialLawUnitsIn)(city, yields).length);
};
exports.unitsWanted = unitsWanted;
// How many of the player's units that could defend a city are on their way to `tile`: a ship going into port, say,
//  doesn't make up for a defender the city is short of.
const defendersHeadingFor = (memory, tile) => [...memory.unitPathData.entries()].filter(([unit, path]) => path.end() === tile && (0, defence_1.isDefender)(unit)).length;
// The player's cities other than the one the unit is in, that it could reach, nearest first.
const citiesInReach = (dependencies, player, unit) => {
    const reachable = (0, reachable_1.default)(unit), inReach = (city) => reachable === null ||
        (unit instanceof Types_1.Land
            ? reachable.has(city.tile())
            : city
                .tile()
                .getNeighbours()
                .some((tile) => reachable.has(tile)));
    return dependencies.cityRegistry
        .getByPlayer(player)
        .filter((city) => city.tile() !== unit.tile() && inReach(city))
        .sort((a, b) => a.tile().distanceFrom(unit.tile()) - b.tile().distanceFrom(unit.tile()));
};
exports.citiesInReach = citiesInReach;
// A path for `unit` into `city`: straight there by land, or for a ship to the sea beside it and then in.
const pathInto = (dependencies, unit, city) => {
    var _a;
    if (unit instanceof Types_1.Land) {
        return ((_a = Path_1.default.for(unit, unit.tile(), city.tile(), dependencies.pathFinderRegistry)) !== null && _a !== void 0 ? _a : null);
    }
    const reachable = (0, reachable_1.default)(unit), [beside] = city
        .tile()
        .getNeighbours()
        .filter((tile) => tile.isWater() && (reachable === null || reachable.has(tile)))
        .sort((a, b) => a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile()));
    if (!beside) {
        return null;
    }
    if (beside === unit.tile()) {
        const path = new Path_1.default();
        path.push(city.tile());
        return path;
    }
    const path = Path_1.default.for(unit, unit.tile(), beside, dependencies.pathFinderRegistry);
    if (!path) {
        return null;
    }
    path.push(city.tile());
    return path;
};
// The first of `cities` that `wanted` accepts and the unit has a path into, with the path.
const firstPath = (dependencies, unit, cities, wanted) => {
    let tried = 0;
    for (const city of cities) {
        if (tried >= CITIES_TRIED) {
            break;
        }
        if (!wanted(city)) {
            continue;
        }
        tried++;
        const path = pathInto(dependencies, unit, city);
        if (path) {
            return path;
        }
    }
    return null;
};
exports.firstPath = firstPath;
// Along `path`, and no further, rather than take a step towards anything it passes: arrived with moves to spare, the
//  unit does `arrived`.
const goAlong = async (dependencies, player, memory, knowledge, unit, path, arrived) => {
    memory.unitPathData.set(unit, path);
    await (0, moveUnit_1.default)(dependencies, player, memory, knowledge, unit, {
        stopAtPathEnd: true,
        wander: false,
    });
    if (unit.active() && unit.moves().value() >= 0.1) {
        arrived();
    }
};
exports.goAlong = goAlong;
const stay = (dependencies, unit, { fortify }) => {
    if (fortify) {
        unit.action(fortify);
        return;
    }
    (0, orders_1.noOrders)(dependencies, unit);
};
const standDown = async (dependencies, player, memory, knowledge, policy, unit, actions) => {
    // Arrived with moves to spare, it waits there for `Garrison` or this to decide next turn.
    const go = (path) => (0, exports.goAlong)(dependencies, player, memory, knowledge, unit, path, () => (0, orders_1.noOrders)(dependencies, unit));
    // Worked out only if there's a city to look for.
    let cities;
    const reachableCities = () => (cities !== null && cities !== void 0 ? cities : (cities = (0, exports.citiesInReach)(dependencies, player, unit)));
    if ((0, defence_1.isDefender)(unit) && unit instanceof Types_1.Land) {
        const path = (0, exports.firstPath)(dependencies, unit, reachableCities(), (city) => (0, exports.unitsWanted)(dependencies, knowledge, city) >
            defendersHeadingFor(memory, city.tile()));
        if (path) {
            await go(path);
            return;
        }
    }
    // In one of the player's cities, it would wait there: it becomes that city's, if the city can support it, before its
    //  upkeep is weighed, so that a unit its old home can't afford isn't disbanded when the city it's in can.
    const city = dependencies.cityRegistry.getByTile(unit.tile()), inOwnCity = (city === null || city === void 0 ? void 0 : city.player()) === player;
    if (city && inOwnCity) {
        (0, homeCity_1.default)(dependencies, knowledge, unit, city, actions.setHomeCity);
    }
    if (actions.disband && policy.disband(dependencies, unit)) {
        unit.action(actions.disband);
        return;
    }
    // Not fortified: the city has the defenders it wants, so this one waits, ready for a mission when one comes up. A
    //  fortified unit stays fortified for good.
    if (inOwnCity) {
        (0, orders_1.noOrders)(dependencies, unit);
        return;
    }
    const path = (0, exports.firstPath)(dependencies, unit, reachableCities(), () => true);
    if (path) {
        await go(path);
        return;
    }
    stay(dependencies, unit, actions);
};
exports.standDown = standDown;
exports.default = exports.standDown;
//# sourceMappingURL=standDown.js.map