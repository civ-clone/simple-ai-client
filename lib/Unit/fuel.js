"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withFuel = exports.fuelCanReturn = exports.fuelFor = void 0;
// Generic: aircraft fuel where the ruleset counts it with base-unit-fuel (a unit with a `Fuel` yield above 0, as in
//  Civ2), and the `Knowledge` answers that use it. A unit with no `Fuel` (every unit in Civ1, whose aircraft are counted
//  by civ1-unit, and Civ2's Helicopter, which needs none) is left to the `Knowledge` it's given, so nothing changes for
//  it.
const reach_1 = require("@civ-clone/base-unit-fuel/lib/reach");
const Types_1 = require("@civ-clone/library-unit/Types");
const AttackEndsTurn_1 = require("@civ-clone/base-unit-trait-attack-ends-turn/AttackEndsTurn");
const SingleUse_1 = require("@civ-clone/base-unit-trait-single-use/SingleUse");
const movesBetween_1 = require("../movesBetween");
const fuelRules_1 = require("@civ-clone/base-unit-fuel/lib/fuelRules");
// Where `unit` stands for fuel, or `null` for a unit that needs none: only an aircraft is asked for its `Fuel`.
const fuelFor = (dependencies, unit) => unit instanceof Types_1.Air
    ? (0, reach_1.fuelState)(dependencies.unitImprovementRegistry, unit)
    : null;
exports.fuelFor = fuelFor;
// The squares `unit` could refuel on: its player's cities and the squares its player's other units are on (a carrier,
//  say), wherever the ruleset's `Refuel` rules say it refuels. Airbases the AI doesn't build aren't looked for.
const refuellingTiles = (dependencies, player, unit, from, within) => [
    ...new Set([
        ...dependencies.cityRegistry
            .getByPlayer(player)
            .map((city) => city.tile()),
        ...dependencies.unitRegistry
            .getByPlayer(player)
            .filter((other) => other !== unit && !other.destroyed())
            .map((other) => other.tile()),
    ]),
].filter((tile) => (0, movesBetween_1.default)(from, tile) <= within &&
    (0, fuelRules_1.refuels)(dependencies.ruleRegistry, unit, tile));
// Whether `action` is a fight with whoever is on its square, after which the unit stays where it is: another player's
//  unit or city is there.
const isAttack = (dependencies, player, action) => {
    var _a, _b;
    return dependencies.unitRegistry
        .getByTile(action.to())
        .some((other) => other.player() !== player) ||
        ((_b = (_a = dependencies.cityRegistry.getByTile(action.to())) === null || _a === void 0 ? void 0 : _a.player()) !== null && _b !== void 0 ? _b : player) !==
            player;
};
// Whether a fuelled aircraft could still get to somewhere it refuels after taking `action`, before its fuel runs out
//  (`fuelState`'s reach): a move costs 1 and an attack, fought from where it is, costs 1, or the rest of this turn's
//  moves for one whose attack ends its turn (`AttackEndsTurn`); a missile only has to reach its target. `null` for a
//  unit that needs no fuel.
const fuelCanReturn = (dependencies, player, unit, action) => {
    const state = (0, exports.fuelFor)(dependencies, unit);
    if (state === null) {
        return null;
    }
    const attacking = isAttack(dependencies, player, action);
    // A missile (`SingleUse`) is spent in its attack, so it needs no way back: only fuel left to reach its target.
    if (attacking && unit.hasTrait(SingleUse_1.default)) {
        return state.reach >= 1;
    }
    const from = attacking ? unit.tile() : action.to(), remaining = attacking && unit.hasTrait(AttackEndsTurn_1.default)
        ? state.reach - unit.moves().value()
        : state.reach - 1;
    if (remaining < 0) {
        return false;
    }
    if (!attacking && (0, fuelRules_1.refuels)(dependencies.ruleRegistry, unit, from)) {
        return true;
    }
    return (refuellingTiles(dependencies, player, unit, from, remaining).length > 0);
};
exports.fuelCanReturn = fuelCanReturn;
// `knowledge` with base-unit-fuel's fuel for the aircraft that have it: whether one can still get back after an action,
//  and that it's an aircraft. Every other unit is asked of `knowledge` as before.
const withFuel = (knowledge) => ({
    ...knowledge,
    canReturnAfter: (dependencies, player, unit, action) => {
        var _a;
        return (_a = (0, exports.fuelCanReturn)(dependencies, player, unit, action)) !== null && _a !== void 0 ? _a : knowledge.canReturnAfter(dependencies, player, unit, action);
    },
    isAircraft: (dependencies, unit) => (0, exports.fuelFor)(dependencies, unit) !== null ||
        knowledge.isAircraft(dependencies, unit),
});
exports.withFuel = withFuel;
exports.default = exports.withFuel;
//# sourceMappingURL=fuel.js.map