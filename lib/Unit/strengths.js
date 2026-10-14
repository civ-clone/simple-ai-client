"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defenceOf = exports.attackOf = void 0;
// The strengths found so far this turn, by unit.
let known = null;
const strengthsOf = (turn, unit) => {
    if (known === null || known.turn !== turn) {
        known = { turn, byUnit: new WeakMap() };
    }
    let strengths = known.byUnit.get(unit);
    if (strengths === undefined) {
        strengths = {};
        known.byUnit.set(unit, strengths);
    }
    return strengths;
};
// What `unit.attack().value()` is, found once a turn. For judging what kind of unit it is, not for its strength: the
//  only thing in the ruleset that changes a unit's `Attack` or `Defence` in the middle of a turn is a Veteran
//  improvement, which adds the same share of the base yield to each, so a unit that attacks more than it defends, or
//  can fight at all, still does. Where the unit is and whose it is aren't part of the answer.
const attackOf = (turn, unit) => {
    var _a;
    const strengths = strengthsOf(turn, unit);
    return ((_a = strengths.attack) !== null && _a !== void 0 ? _a : (strengths.attack = unit.attack().value()));
};
exports.attackOf = attackOf;
// As `attackOf`, for `unit.defence().value()`.
const defenceOf = (turn, unit) => {
    var _a;
    const strengths = strengthsOf(turn, unit);
    return ((_a = strengths.defence) !== null && _a !== void 0 ? _a : (strengths.defence = unit.defence().value()));
};
exports.defenceOf = defenceOf;
//# sourceMappingURL=strengths.js.map