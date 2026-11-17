"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Envoys_instances, _Envoys_targets, _Envoys_plannedCity, _Envoys_worthFromShip, _Envoys_actBeside, _Envoys_approach, _Envoys_stillTarget;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Envoys = void 0;
// Generic: a Caravan or Freight going to set up a trade route, and a Diplomat or Spy going on a mission, where the
//  ruleset makes either worth it (`lib/Unit/envoys`). Handles nothing in a ruleset that registers neither, Civ1's. A
//  unit walks to a square beside its target city, then carries out its route or mission from there, from a ship too.
//  A Caravan with nothing to go for on its own land waits to be ferried to one of the best cities overseas
//  (`lib/Unit/overseas`).
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const envoys_1 = require("../../lib/Unit/envoys");
const overseas_1 = require("../../lib/Unit/overseas");
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const Path_1 = require("@civ-clone/core-world-path/Path");
const explorers_1 = require("../../lib/City/explorers");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
const mission_1 = require("@civ-clone/base-unit-agent/lib/mission");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
const moveUnit_1 = require("../../lib/Unit/moveUnit");
// How many squares beside a target a unit tries to find a path to, nearest first.
const APPROACHES = 3;
class Envoys extends AIStrategy_1.default {
    constructor() {
        super(...arguments);
        _Envoys_instances.add(this);
        // Where each unit is going: kept until it gets there, or the city is gone or no longer a target.
        _Envoys_targets.set(this, new WeakMap());
    }
    handles(action) {
        return ((0, isUnitAction_1.default)(action) &&
            (0, envoys_1.isEnvoy)(this.dependencies(), action.value()));
    }
    async attempt(action) {
        const player = action.player(), unit = action.value(), dependencies = this.dependencies(), memory = this.memoryFor(player), choices = new Map(), giveUp = (city) => {
            (0, envoys_1.refuseTarget)(dependencies, unit, city);
            __classPrivateFieldGet(this, _Envoys_targets, "f").delete(unit);
            memory.unitPathData.delete(unit);
        };
        // A target no longer worth going to is dropped before anything is asked of it.
        if (!__classPrivateFieldGet(this, _Envoys_instances, "m", _Envoys_stillTarget).call(this, player, unit, __classPrivateFieldGet(this, _Envoys_targets, "f").get(unit))) {
            __classPrivateFieldGet(this, _Envoys_targets, "f").delete(unit);
        }
        if (__classPrivateFieldGet(this, _Envoys_instances, "m", _Envoys_actBeside).call(this, player, unit, choices, giveUp)) {
            return true;
        }
        // At sea, a passenger waits to be put ashore (`TravelOverseas`).
        if (!unit.tile().isLand()) {
            return false;
        }
        if (!__classPrivateFieldGet(this, _Envoys_instances, "m", _Envoys_stillTarget).call(this, player, unit, __classPrivateFieldGet(this, _Envoys_targets, "f").get(unit))) {
            __classPrivateFieldGet(this, _Envoys_targets, "f").delete(unit);
            memory.unitPathData.delete(unit);
            const candidates = (0, envoys_1.knownCitiesOn)(dependencies, player, (0, explorers_1.continentOf)(dependencies.turn.value(), unit.tile())).filter((city) => !(0, envoys_1.refusedTarget)(dependencies, unit, city)), target = (0, envoys_1.isTrader)(unit, dependencies.ruleRegistry)
                ? (0, envoys_1.routePartner)(dependencies, player, unit, candidates)
                : (0, envoys_1.missionTarget)(dependencies, player, unit, candidates);
            if (target === null) {
                // A Caravan with no partner on its own land goes overseas, to one of the best of the cities it knows there.
                if ((0, envoys_1.isTrader)(unit, dependencies.ruleRegistry)) {
                    const passenger = (0, overseas_1.planPassenger)(dependencies, player, memory, unit, 'trader', (0, envoys_1.tradeTargets)(dependencies, player, unit));
                    if (passenger) {
                        if (!(0, overseas_1.travel)(dependencies, player, memory, unit, passenger)) {
                            await (0, moveUnit_1.travelToPathEnd)(dependencies, player, memory, this.knowledge(), unit);
                        }
                        if (unit.active() && unit.moves().value() > 0) {
                            (0, orders_1.noOrders)(dependencies, unit);
                        }
                        return true;
                    }
                }
                return false;
            }
            (0, overseas_1.overseasStateFor)(memory).passengers.delete(unit);
            __classPrivateFieldGet(this, _Envoys_targets, "f").set(unit, target);
        }
        const target = __classPrivateFieldGet(this, _Envoys_targets, "f").get(unit);
        if (!memory.unitPathData.has(unit)) {
            const path = __classPrivateFieldGet(this, _Envoys_instances, "m", _Envoys_approach).call(this, unit, target);
            // Nowhere beside it to reach from here: another target next time.
            if (path === null) {
                giveUp(target);
                (0, orders_1.noOrders)(dependencies, unit);
                return true;
            }
            if (path !== undefined) {
                memory.unitPathData.set(unit, path);
            }
        }
        if (memory.unitPathData.has(unit)) {
            await (0, moveUnit_1.travelToPathEnd)(dependencies, player, memory, this.knowledge(), unit);
        }
        // A step blocked on the way leaves the target as it is: a new path is found next turn.
        if (unit.active() &&
            unit.moves().value() > 0 &&
            !__classPrivateFieldGet(this, _Envoys_instances, "m", _Envoys_actBeside).call(this, player, unit, choices, giveUp)) {
            (0, orders_1.noOrders)(dependencies, unit);
        }
        return true;
    }
}
exports.Envoys = Envoys;
_Envoys_targets = new WeakMap(), _Envoys_instances = new WeakSet(), _Envoys_plannedCity = function _Envoys_plannedCity(player, unit) {
    const target = __classPrivateFieldGet(this, _Envoys_targets, "f").get(unit);
    if (target !== undefined) {
        return target;
    }
    const passenger = (0, overseas_1.overseasStateFor)(this.memoryFor(player)).passengers.get(unit);
    return passenger
        ? this.dependencies().cityRegistry.getByTile(passenger.target)
        : null;
}, _Envoys_worthFromShip = function _Envoys_worthFromShip(player, unit, city) {
    const planned = __classPrivateFieldGet(this, _Envoys_instances, "m", _Envoys_plannedCity).call(this, player, unit);
    if (planned === null) {
        return false;
    }
    if (city === planned) {
        return true;
    }
    const dependencies = this.dependencies(), home = (0, envoys_1.routeHome)(dependencies, player, unit);
    if (home === null || home === city) {
        return false;
    }
    const score = (0, envoys_1.routeScore)(dependencies, player, home, city);
    return (score > 0 && score >= (0, envoys_1.routeScore)(dependencies, player, home, planned));
}, _Envoys_actBeside = function _Envoys_actBeside(player, unit, choices, offeredNothing = () => { }) {
    var _a;
    const dependencies = this.dependencies(), trader = (0, envoys_1.isTrader)(unit, dependencies.ruleRegistry), atSea = !unit.tile().isLand(), target = (_a = __classPrivateFieldGet(this, _Envoys_targets, "f").get(unit)) !== null && _a !== void 0 ? _a : null;
    for (const tile of unit.tile().getNeighbours()) {
        const city = dependencies.cityRegistry.getByTile(tile);
        if (city === null ||
            (city !== target &&
                !(trader && atSea && __classPrivateFieldGet(this, _Envoys_instances, "m", _Envoys_worthFromShip).call(this, player, unit, city)))) {
            continue;
        }
        const offered = unit.actions(tile);
        let action;
        if (trader) {
            action = (0, envoys_1.routeFor)(offered);
        }
        else {
            if (!choices.has(city)) {
                choices.set(city, (0, mission_1.missionChoice)(unit, city, dependencies.ruleRegistry));
            }
            action = (0, envoys_1.missionFor)(dependencies, unit, city, offered, () => choices.get(city));
        }
        if (action === null) {
            if (city === target) {
                offeredNothing(city);
            }
            continue;
        }
        __classPrivateFieldGet(this, _Envoys_targets, "f").delete(unit);
        unit.action(action);
        return true;
    }
    return false;
}, _Envoys_approach = function _Envoys_approach(unit, city) {
    if (unit.tile().isNeighbourOf(city.tile())) {
        return undefined;
    }
    const candidates = city
        .tile()
        .getNeighbours()
        .filter((tile) => tile.isLand() === unit.tile().isLand() &&
        this.dependencies().cityRegistry.getByTile(tile) === null &&
        this.dependencies()
            .unitRegistry.getByTile(tile)
            .every((other) => other.player() === unit.player()))
        .sort((a, b) => a.distanceFrom(unit.tile()) - b.distanceFrom(unit.tile()))
        .slice(0, APPROACHES);
    for (const tile of candidates) {
        const path = Path_1.default.for(unit, unit.tile(), tile, this.dependencies().pathFinderRegistry);
        if (path && path.length > 0) {
            return path;
        }
    }
    return null;
}, _Envoys_stillTarget = function _Envoys_stillTarget(player, unit, city) {
    if (city === undefined || city.destroyed()) {
        return false;
    }
    return (0, envoys_1.isAgent)(unit, this.dependencies().ruleRegistry)
        ? city.player() !== player &&
            (0, treatyLevel_1.treatyLevel)(this.dependencies(), player, city.player()) <
                treatyLevel_1.TreatyLevel.Ceasefire
        : true;
};
exports.default = Envoys;
//# sourceMappingURL=Envoys.js.map