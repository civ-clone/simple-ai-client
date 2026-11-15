"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oddsWanted = exports.attackOdds = exports.defenderFor = exports.fightsInRounds = exports.DEFEND_CITY_ODDS = exports.ATTACK_ODDS = exports.ODDS_STRENGTH_SCALE = void 0;
// Generic: the chance an attack wins, for a ruleset whose battles are fought in rounds (a `CombatResolver` rule is
//  registered, as base-combat-rounds' is in Civ2). Without one, `Attack` keeps its single roll and `scoreUnitMove`
//  keeps comparing strengths as it always has, so a game with no resolver (Civ1) never comes here.
const rounds_1 = require("@civ-clone/base-combat-rounds/lib/rounds");
const CombatResolver_1 = require("@civ-clone/core-unit/Rules/CombatResolver");
const DefenderRank_1 = require("@civ-clone/core-unit/Rules/DefenderRank");
const CombatModifiers_1 = require("@civ-clone/base-combat-rounds/lib/CombatModifiers");
const combatRoundsRules_1 = require("@civ-clone/base-combat-rounds/lib/combatRoundsRules");
const strength_1 = require("@civ-clone/core-unit/strength");
// The steps a strength of 1 is rolled in. base-combat-rounds leaves the scale to the ruleset's resolver and doesn't
//  say what it is, so the odds are worked out at 8 steps to 1, Civilization II's (`unit_attack_strength`). Another
//  scale moves the odds only through ties, which go to the defender.
exports.ODDS_STRENGTH_SCALE = 8;
// The odds a unit attacks at: a little better than even, so a battle it's sent into is one it expects to win.
exports.ATTACK_ODDS = 0.6;
// The odds a unit attacks at when the enemy stands next to one of its player's cities: the alternative is the enemy
//  attacking the city, so a fair chance is worth taking.
exports.DEFEND_CITY_ODDS = 0.25;
// Whether battles are fought in rounds: a `CombatResolver` rule is registered.
const fightsInRounds = (ruleRegistry) => ruleRegistry.get(CombatResolver_1.default).length > 0;
exports.fightsInRounds = fightsInRounds;
// The unit on `tile` that would defend against `attacker`, and the strengths they'd fight at, as `Attack` chooses it:
//  the best `DefenderRank` score when there are such rules, otherwise the strongest defence. Equal scores keep the
//  square's order.
const defenderFor = (ruleRegistry, attacker, tileUnits) => {
    var _a;
    const ranked = ruleRegistry.get(DefenderRank_1.default).length > 0;
    return ((_a = tileUnits
        .map((candidate) => {
        const [attack, defence] = (0, strength_1.default)(attacker, candidate, ruleRegistry);
        if (!ranked) {
            return [[candidate, attack, defence], defence.value()];
        }
        const answer = ruleRegistry
            .process(DefenderRank_1.default, attacker, candidate, attack, defence)
            .find((score) => score !== undefined), score = answer === undefined ? defence.value() : answer;
        return [
            [candidate, attack, defence],
            Number.isNaN(score) ? -Infinity : score,
        ];
    })
        .sort(([, a], [, b]) => (a === b ? 0 : b > a ? 1 : -1))
        .map(([candidate]) => candidate)[0]) !== null && _a !== void 0 ? _a : null);
};
exports.defenderFor = defenderFor;
// The chance `attacker` beats whichever unit defends `tile`, from the terms the battle would be fought at (strengths
//  after the ruleset's `CombatModifiers`, the attack scaled by the moves it has left, and both sides' firepower) and
//  the hit points each has left. 0 with no one there to fight.
const attackOdds = (dependencies, attacker, tile) => {
    const { ruleRegistry } = dependencies, defending = (0, exports.defenderFor)(ruleRegistry, attacker, dependencies.unitRegistry.getByTile(tile));
    if (defending === null) {
        return 0;
    }
    const [defender, attack, defence] = defending, terms = (0, CombatModifiers_1.applyCombatModifiers)(ruleRegistry, attacker, defender, (0, combatRoundsRules_1.combatTerms)(attacker, defender, attack, defence, Math.min(1, attacker.moves().value()))), [attackerHitPoints] = attacker.hitPoints(), [defenderHitPoints] = defender.hitPoints();
    return (0, rounds_1.combatOdds)((0, rounds_1.rollRange)(terms.attack, exports.ODDS_STRENGTH_SCALE), (0, rounds_1.rollRange)(terms.defence, exports.ODDS_STRENGTH_SCALE), attackerHitPoints, defenderHitPoints, Math.max(0, terms.attackerFirepower), Math.max(0, terms.defenderFirepower));
};
exports.attackOdds = attackOdds;
// The odds `player` attacks `tile` at (`ATTACK_ODDS`), or `DEFEND_CITY_ODDS` when the enemy there is next to one of its
//  cities.
const oddsWanted = (dependencies, player, tile) => tile
    .getNeighbours()
    .some((neighbour) => { var _a; return ((_a = dependencies.cityRegistry.getByTile(neighbour)) === null || _a === void 0 ? void 0 : _a.player()) === player; })
    ? exports.DEFEND_CITY_ODDS
    : exports.ATTACK_ODDS;
exports.oddsWanted = oddsWanted;
exports.default = exports.attackOdds;
//# sourceMappingURL=attackOdds.js.map