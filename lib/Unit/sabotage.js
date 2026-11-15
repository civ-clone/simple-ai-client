"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.worthSabotaging = exports.unitCost = exports.SABOTAGE_WORTH = void 0;
// Generic: whether a Spy's sabotage of a unit (base-unit-action-sabotage-unit's `SabotageUnit`, which a ruleset offers
//  ahead of moving and attacking) is worth the risk to the Spy, which is lost unless it escapes.
const BuildItem_1 = require("@civ-clone/core-city-build/BuildItem");
// The share of the Spy's own cost a target has to be worth.
exports.SABOTAGE_WORTH = 1 / 2;
// What a unit of `unit`'s type costs to build, by the ruleset's `BuildCost` rules: 0 for one it doesn't price.
const unitCost = (dependencies, unit) => {
    const cost = new BuildItem_1.default(unit.constructor, null, dependencies.ruleRegistry)
        .cost()
        .value();
    return Number.isFinite(cost) ? cost : 0;
};
exports.unitCost = unitCost;
// Whether `spy` should sabotage the unit on `tile`: one worth at least `SABOTAGE_WORTH` of the Spy's cost, or one that
//  can attack and stands next to one of `player`'s cities.
const worthSabotaging = (dependencies, player, spy, tile) => {
    const [target] = dependencies.unitRegistry
        .getByTile(tile)
        .filter((unit) => unit.player() !== player);
    if (!target) {
        return false;
    }
    if (target.attack().value() > 0 &&
        tile
            .getNeighbours()
            .some((neighbour) => { var _a; return ((_a = dependencies.cityRegistry.getByTile(neighbour)) === null || _a === void 0 ? void 0 : _a.player()) === player; })) {
        return true;
    }
    return ((0, exports.unitCost)(dependencies, target) >=
        (0, exports.unitCost)(dependencies, spy) * exports.SABOTAGE_WORTH);
};
exports.worthSabotaging = worthSabotaging;
exports.default = exports.worthSabotaging;
//# sourceMappingURL=sabotage.js.map