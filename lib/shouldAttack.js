"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldAttack = exports.militaryPower = void 0;
// Generic: whether `player` is strong enough to pick a fight with `enemy`.
const AttackConfidence_1 = require("@civ-clone/base-leader-personality/Rules/Player/AttackConfidence");
const combine_1 = require("@civ-clone/base-leader-personality/lib/combine");
// The sum of every unit's attack and defence, as `player` last worked it out this turn. Each is a pass through the
//  rules for every unit, and the same pair of players is weighed again and again in a turn (for each neighbouring tile,
//  at each step, of each unit beside a rival's), so the totals are worked out once a turn: 127 of 158 calls on a large
//  late game had the same inputs as the call before (civ-clone/web-renderer#311). A unit gained or lost in the turn
//  shows up from the next one.
const militaryPower = (dependencies, player, of) => {
    const { power } = dependencies.memoryRegistry.memoryFor(player), turn = dependencies.turn.value();
    if (power.turn !== turn) {
        power.turn = turn;
        power.byPlayer.clear();
    }
    const known = power.byPlayer.get(of);
    if (known !== undefined) {
        return known;
    }
    const total = dependencies.unitRegistry
        .getByPlayer(of)
        .reduce((score, unit) => score + unit.attack().value() + unit.defence().value(), 0);
    power.byPlayer.set(of, total);
    return total;
};
exports.militaryPower = militaryPower;
// The player's strength, scaled by how bold its leader is (`AttackConfidence`, by Mood in Civ1), against the enemy's.
//  Negotiation asks this too (`Diplomacy/chooseNegotiationStep`), so a bolder leader is also the readier to refuse.
const shouldAttack = (dependencies, player, enemy) => {
    const ourPower = (0, exports.militaryPower)(dependencies, player, player), enemyPower = (0, exports.militaryPower)(dependencies, player, enemy), confidence = (0, combine_1.product)(dependencies.ruleRegistry, AttackConfidence_1.default, player, enemy);
    return ourPower * confidence >= enemyPower;
};
exports.shouldAttack = shouldAttack;
exports.default = exports.shouldAttack;
//# sourceMappingURL=shouldAttack.js.map