"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retreatToHeal = exports.healingCities = exports.healsThisTurn = exports.needsHealing = exports.restsHere = exports.healingFacilityFor = exports.RETREAT_RANGE = exports.FACILITY_PREFERENCE = exports.RETREAT_BELOW = void 0;
// Generic: a damaged unit rests to heal, where the ruleset deals damage (a unit has some: only a `CombatResolver`, a
//  Spy's sabotage and the like deal it, so no Civ1 unit ever comes here). Healing happens at the start of a turn for a
//  unit that didn't move in the last one, faster in a city, and fully in one with the facility for the unit's kind
//  (base-unit-healing, as Civ2 wires it): Barracks, Port Facility or Airport.
const Types_1 = require("@civ-clone/library-unit/Types");
const Airport_1 = require("@civ-clone/base-city-improvement-airport/Airport");
const Barracks_1 = require("@civ-clone/base-city-improvement-barracks/Barracks");
const Fortress_1 = require("@civ-clone/base-tile-improvement-fortress/Fortress");
const Path_1 = require("@civ-clone/core-world-path/Path");
const PortFacility_1 = require("@civ-clone/base-city-improvement-portfacility/PortFacility");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
const moveUnit_1 = require("./moveUnit");
// A unit with less than this share of its hit points left goes to heal.
exports.RETREAT_BELOW = 1 / 2;
// How much nearer a city without the healing facility has to be to be chosen over one with it, in squares.
exports.FACILITY_PREFERENCE = 3;
// The furthest a damaged unit goes to heal in a city, in squares: further away, it rests where it is.
exports.RETREAT_RANGE = 8;
// The most cities a damaged unit looks for a way to, nearest first.
const PATHS_TRIED = 3;
// The facility that heals a unit of `unit`'s kind fully in a city.
const healingFacilityFor = (unit) => unit instanceof Types_1.Land
    ? Barracks_1.default
    : unit instanceof Types_1.Naval
        ? PortFacility_1.default
        : unit instanceof Types_1.Air
            ? Airport_1.default
            : null;
exports.healingFacilityFor = healingFacilityFor;
const cityHas = (dependencies, city, Improvement) => dependencies.cityImprovementRegistry
    .getByCity(city)
    .some((improvement) => improvement instanceof Improvement);
// Whether `unit` rests where it is to heal: in one of its player's cities, or on a Fortress.
const restsHere = (dependencies, unit) => {
    var _a;
    return ((_a = dependencies.cityRegistry.getByTile(unit.tile())) === null || _a === void 0 ? void 0 : _a.player()) ===
        unit.player() ||
        dependencies.tileImprovementRegistry
            .getByTile(unit.tile())
            .some((improvement) => improvement instanceof Fortress_1.default);
};
exports.restsHere = restsHere;
// Whether `unit` is damaged enough to go and heal: below `RETREAT_BELOW` of its hit points. Asks for its hit points only
//  once it has some damage, so an undamaged unit costs nothing.
const needsHealing = (unit) => {
    if (unit.damage() <= 0) {
        return false;
    }
    const [remaining, maximum] = unit.hitPoints();
    return remaining < maximum * exports.RETREAT_BELOW;
};
exports.needsHealing = needsHealing;
// Whether `unit` heals this turn rather than doing anything else: a damaged unit in one of its player's cities or on a
//  Fortress stays until it's whole; one elsewhere goes once it's below `RETREAT_BELOW`. An aircraft heals where it
//  lands, as its fuel brings it back, and a land unit at sea is a passenger, so neither turns back here.
const healsThisTurn = (dependencies, unit) => unit.damage() > 0 &&
    !(unit instanceof Types_1.Land && unit.tile().isWater()) &&
    ((0, exports.restsHere)(dependencies, unit) ||
        (!(unit instanceof Types_1.Air) && (0, exports.needsHealing)(unit)));
exports.healsThisTurn = healsThisTurn;
// The player's cities `unit` could heal in, best first: the nearest, counting one with the facility for its kind
//  `FACILITY_PREFERENCE` squares nearer, up to `RETREAT_RANGE` away. A ship only looks at coastal cities.
const healingCities = (dependencies, player, unit) => {
    const Facility = (0, exports.healingFacilityFor)(unit), distance = (city) => unit.tile().distanceFrom(city.tile()) -
        (Facility !== null && cityHas(dependencies, city, Facility)
            ? exports.FACILITY_PREFERENCE
            : 0);
    return dependencies.cityRegistry
        .getByPlayer(player)
        .filter((city) => unit.tile().distanceFrom(city.tile()) <= exports.RETREAT_RANGE &&
        (!(unit instanceof Types_1.Naval) || city.tile().isCoast()))
        .sort((a, b) => distance(a) - distance(b));
};
exports.healingCities = healingCities;
// A damaged unit's turn: in one of its player's cities or on a Fortress it stands where it is (no orders, so it doesn't
//  count as having moved and heals next turn); elsewhere it heads for the best city it has a way to
//  (`healingCities`), and stands where it is if there's none. It never leaves a city, so it can't strip a city of its
//  last defender to heal. Returns whether it handled the unit.
const retreatToHeal = async (dependencies, player, memory, knowledge, unit) => {
    var _a, _b;
    if (!(0, exports.healsThisTurn)(dependencies, unit)) {
        return false;
    }
    if ((0, exports.restsHere)(dependencies, unit)) {
        memory.unitPathData.delete(unit);
        (0, orders_1.noOrders)(dependencies, unit);
        return true;
    }
    const goingTo = (_b = (_a = memory.unitPathData.get(unit)) === null || _a === void 0 ? void 0 : _a.end()) !== null && _b !== void 0 ? _b : null, cities = (0, exports.healingCities)(dependencies, player, unit);
    if (goingTo === null ||
        !cities.some((city) => city.tile() === goingTo)) {
        memory.unitPathData.delete(unit);
        for (const city of cities.slice(0, PATHS_TRIED)) {
            const path = Path_1.default.for(unit, unit.tile(), city.tile(), dependencies.pathFinderRegistry);
            if (path) {
                memory.unitPathData.set(unit, path);
                break;
            }
        }
    }
    if (memory.unitPathData.has(unit)) {
        await (0, moveUnit_1.travelToPathEnd)(dependencies, player, memory, knowledge, unit);
    }
    if (unit.active() && !unit.destroyed()) {
        (0, orders_1.noOrders)(dependencies, unit);
    }
    return true;
};
exports.retreatToHeal = retreatToHeal;
exports.default = exports.retreatToHeal;
//# sourceMappingURL=retreatToHeal.js.map