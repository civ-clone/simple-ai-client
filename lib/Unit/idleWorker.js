"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idleWorker = exports.couldJoin = void 0;
// Generic: what a worker with nothing to do does (civ-clone/web-renderer#230, #243): no city site it can reach, no
//  terrain job and no step worth taking. It joins one of the player's cities, giving back the citizen it cost, where
//  the ruleset lets it: at once in the city it's standing in, or else it heads for the nearest of the player's cities
//  it can reach that it could join, and joins on arriving. Which cities it could join is for the ruleset's
//  `CanJoinCity` rules (Civ1's: a city under size 10), and which units may join for the rule that offers `JoinCity`.
//  With no city it could join, it waits in the player's city it's in, or heads for the nearest of any, keeping its
//  home: it takes a site or a terrain job on any later turn the survey offers one. It's never disbanded.
const standDown_1 = require("./standDown");
const actionLookup_1 = require("@civ-clone/base-strategy-ai/lib/actionLookup");
const joinableCity_1 = require("@civ-clone/base-unit-action-join-city/joinableCity");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
// Whether the ruleset would let `unit` join `city`, were it standing there.
const couldJoin = (dependencies, unit, city) => (0, joinableCity_1.default)(unit, city.tile(), dependencies.cityRegistry, dependencies.ruleRegistry) === city;
exports.couldJoin = couldJoin;
// Joins the city it's standing in if it's offered the action, or else waits with no orders.
const joinOrWait = (dependencies, unit, { joinCity }) => {
    if (joinCity) {
        unit.action(joinCity);
        return;
    }
    (0, orders_1.noOrders)(dependencies, unit);
};
// `actions` are what the unit can do where it stands.
const idleWorker = async (dependencies, player, memory, knowledge, unit, actions) => {
    var _a;
    if (actions.joinCity) {
        unit.action(actions.joinCity);
        return;
    }
    const tileCity = dependencies.cityRegistry.getByTile(unit.tile()), inOwnCity = (tileCity === null || tileCity === void 0 ? void 0 : tileCity.player()) === player, cities = (0, standDown_1.citiesInReach)(dependencies, player, unit), path = (_a = (0, standDown_1.firstPath)(dependencies, unit, cities, (city) => (0, exports.couldJoin)(dependencies, unit, city))) !== null && _a !== void 0 ? _a : (inOwnCity ? null : (0, standDown_1.firstPath)(dependencies, unit, cities, () => true));
    if (path) {
        await (0, standDown_1.goAlong)(dependencies, player, memory, knowledge, unit, path, () => joinOrWait(dependencies, unit, (0, actionLookup_1.lookupActions)(unit.actions())));
        return;
    }
    (0, orders_1.noOrders)(dependencies, unit);
};
exports.idleWorker = idleWorker;
exports.default = exports.idleWorker;
//# sourceMappingURL=idleWorker.js.map