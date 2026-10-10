"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreUnitMove = void 0;
// Generic: how good a move to `tile` looks for `unit`, for the move executor's greedy step. Below 0 rules it out. The
//  exploring terms are `base-strategy-explore`'s, added in the order they always were around the others.
const scoreExploration_1 = require("@civ-clone/base-strategy-explore/lib/Unit/scoreExploration");
const Types_1 = require("@civ-clone/library-unit/Types");
const actionLookup_1 = require("@civ-clone/base-strategy-ai/lib/actionLookup");
const shouldAttack_1 = require("../shouldAttack");
const scoreUnitMove = (dependencies, player, memory, knowledge, unit, tile) => {
    const actions = unit.actions(tile), lookup = (0, actionLookup_1.default)(actions), { attack, buildIrrigation, buildMine, buildRoad, captureCity, disembark, embark, foundCity, } = lookup, sneakAttack = lookup.sneakAttack;
    if (sneakAttack && !(0, shouldAttack_1.default)(dependencies, player, sneakAttack.enemy())) {
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
    const tileUnits = dependencies.unitRegistry
        .getByTile(tile)
        .sort((a, b) => b.defence().value() - a.defence().value()), [defender] = tileUnits, ourUnitsOnTile = tileUnits.some((unit) => unit.player() === player);
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
    if (embark) {
        score += 16;
    }
    // TODO: move to far off continents
    if (disembark /* && tile.continentId !== unit.departureContinentId*/) {
        score += 16;
    }
    if (captureCity) {
        score += 100;
    }
    // The leader's personality decides whether to fight at all (`shouldAttack`), not how keen a fight looks here.
    if (attack && unit.attack().value() > defender.defence().value()) {
        score += 24 * (unit.attack().value() - defender.defence().value());
    }
    if (attack && unit.attack().value() >= defender.defence().value()) {
        score += 16;
    }
    // add some jeopardy
    if (attack && unit.attack().value() >= defender.defence().value() * (2 / 3)) {
        score += 8;
    }
    score += (0, scoreExploration_1.discoverableTilesTerm)(context);
    score += (0, scoreExploration_1.headingForTargetTerm)(context);
    return (0, scoreExploration_1.revisitTerm)(context, score);
};
exports.scoreUnitMove = scoreUnitMove;
exports.default = exports.scoreUnitMove;
//# sourceMappingURL=scoreUnitMove.js.map