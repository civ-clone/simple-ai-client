"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreUnitMove = void 0;
// Generic: how good a move to `tile` looks for `unit`, for the move executor's greedy step. Below 0 rules it out. The
//  exploring terms are `base-strategy-explore`'s, added in the order they always were around the others.
const overseas_1 = require("./overseas");
const scoreExploration_1 = require("@civ-clone/base-strategy-explore/lib/Unit/scoreExploration");
const Types_1 = require("@civ-clone/library-unit/Types");
const actionLookup_1 = require("@civ-clone/base-strategy-ai/lib/actionLookup");
const strength_1 = require("@civ-clone/core-unit/strength");
const scoreUnitMove = (dependencies, player, memory, knowledge, unit, tile) => {
    const actions = unit.actions(tile), lookup = (0, actionLookup_1.default)(actions), { attack, buildIrrigation, buildMine, buildRoad, captureCity, disembark, embark, foundCity, } = lookup, sneakAttack = lookup.sneakAttack;
    // A computer player keeps its treaties (`breaksTreaty`).
    if (sneakAttack) {
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
    if (unit instanceof Types_1.NavalTransport &&
        unit.hasCapacity() &&
        tileUnits.length &&
        ourUnitsOnTile) {
        score += 10;
    }
    if (unit instanceof Types_1.NavalTransport &&
        unit.hasCargo() &&
        tile.isCoast() &&
        tile.isWater()) {
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
    score += (0, scoreExploration_1.discoverableTilesTerm)(context);
    score += (0, scoreExploration_1.headingForTargetTerm)(context);
    return (0, scoreExploration_1.revisitTerm)(context, score);
};
exports.scoreUnitMove = scoreUnitMove;
exports.default = exports.scoreUnitMove;
//# sourceMappingURL=scoreUnitMove.js.map