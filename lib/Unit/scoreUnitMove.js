"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreUnitMove = void 0;
// Generic: how good a move to `tile` looks for `unit`, for the move executor's greedy step. Below 0 rules it out. The
//  exploring terms are `base-strategy-explore`'s, added in the order they always were around the others.
const carriesUnits_1 = require("./carriesUnits");
const overseas_1 = require("./overseas");
const Types_1 = require("@civ-clone/library-unit/Types");
const scoreExploration_1 = require("@civ-clone/base-strategy-explore/lib/Unit/scoreExploration");
const actionLookup_1 = require("@civ-clone/base-strategy-ai/lib/actionLookup");
const strength_1 = require("@civ-clone/core-unit/strength");
const attackOdds_1 = require("./attackOdds");
const sabotage_1 = require("./sabotage");
const scoreUnitMove = (dependencies, player, memory, knowledge, unit, tile) => {
    const actions = unit.actions(tile), lookup = (0, actionLookup_1.default)(actions), { attack, buildIrrigation, buildMine, buildRoad, captureCity, disembark, embark, foundCity, } = lookup, sneakAttack = lookup.sneakAttack, sneakMove = lookup.sneakMove, abortMove = lookup.abortMove, overruled = lookup.overruled;
    // A computer player keeps its treaties (`breaksTreaty`), and doesn't walk onto a treaty partner's land
    //  (civ-clone/web-renderer#287) or try what a Senate would overrule.
    if (sneakAttack || sneakMove || abortMove || overruled) {
        return -10;
    }
    // A Spy steps onto another player's lone unit only to sabotage one worth it (`actionToTake`).
    if (lookup.sabotageUnit !== undefined &&
        !(0, sabotage_1.default)(dependencies, player, unit, tile)) {
        return -10;
    }
    const context = (0, scoreExploration_1.moveContext)(dependencies, player, memory, knowledge, unit, tile, actions, lookup), gate = (0, scoreExploration_1.moveGate)(context);
    if (gate !== null) {
        return gate;
    }
    let score = 0;
    score += (0, scoreExploration_1.goodyHutTerm)(context);
    if ((foundCity && knowledge.shouldBuildCity(dependencies, player, tile)) ||
        (buildMine && knowledge.shouldMine(dependencies, player, tile)) ||
        (buildIrrigation && knowledge.shouldIrrigate(dependencies, player, tile)) ||
        (buildRoad && knowledge.shouldRoad(dependencies, player, tile))) {
        score += 24;
    }
    const tileUnits = dependencies.unitRegistry.getByTile(tile), 
    // The strengths a battle here would be fought at (terrain, City Walls, fortified), against the unit that would
    //  defend: the strongest against this attacker.
    [attackStrength, defenceStrength] = attack
        ? tileUnits
            .map((tileUnit) => {
            const [attackYield, defenceYield] = (0, strength_1.default)(unit, tileUnit, dependencies.ruleRegistry);
            return [attackYield.value(), defenceYield.value()];
        })
            .sort(([, a], [, b]) => b - a)[0]
        : [0, 0], ourUnitsOnTile = tileUnits.some((unit) => unit.player() === player);
    // A transport for passengers: by its cargo where the ruleset's transports carry other things (`ferriesByCargo`).
    const ferry = ((0, carriesUnits_1.ferriesByCargo)(dependencies.ruleRegistry)
        ? (0, carriesUnits_1.ferries)(unit, dependencies.ruleRegistry)
        : unit instanceof Types_1.NavalTransport)
        ? unit
        : null;
    if (ferry && ferry.hasCapacity() && tileUnits.length && ourUnitsOnTile) {
        score += 10;
    }
    if (ferry && ferry.hasCargo() && tile.isCoast() && tile.isWater()) {
        score += 16;
    }
    // Only a passenger boards: a land unit with work at home, next to a ship exploring the coast, used to climb aboard
    //  and be carried off, or sink with it (civ-clone/web-renderer#211). Passengers board in `TravelOverseas`, so a
    //  move onto a ship scores nothing here.
    if (embark && !(0, overseas_1.isPassenger)(memory, unit)) {
        return -10;
    }
    if (disembark) {
        score += 16;
    }
    if (captureCity) {
        score += 100;
    }
    // Battles fought in rounds, with hit points and firepower (a `CombatResolver` is registered): the odds decide. A unit
    //  attacks only at the odds it wants (`oddsWanted`), and the better they are the more the attack is worth. Otherwise
    //  (a single roll, as in Civ1) the strengths are compared.
    if (attack && (0, attackOdds_1.fightsInRounds)(dependencies.ruleRegistry)) {
        const odds = (0, attackOdds_1.default)(dependencies, unit, tile);
        if (odds < (0, attackOdds_1.oddsWanted)(dependencies, player, tile)) {
            return -10;
        }
        score += 24 + 40 * odds;
    }
    else {
        if (attack && attackStrength > defenceStrength) {
            score += 24 * (attackStrength - defenceStrength);
        }
        if (attack && attackStrength >= defenceStrength) {
            score += 16;
        }
        // add some jeopardy
        if (attack && attackStrength >= defenceStrength * (2 / 3)) {
            score += 8;
        }
    }
    score += (0, scoreExploration_1.discoverableTilesTerm)(context);
    score += (0, scoreExploration_1.headingForTargetTerm)(context);
    return (0, scoreExploration_1.revisitTerm)(context, score);
};
exports.scoreUnitMove = scoreUnitMove;
exports.default = exports.scoreUnitMove;
//# sourceMappingURL=scoreUnitMove.js.map