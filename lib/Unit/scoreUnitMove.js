"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreUnitMove = void 0;
// Generic: how good a move to `tile` looks for `unit`, for the move executor's greedy step. Below 0 rules it out.
const Types_1 = require("@civ-clone/library-unit/Types");
const Tile_1 = require("@civ-clone/core-world/Tile");
const actionLookup_1 = require("../actionLookup");
const shouldAttack_1 = require("../shouldAttack");
const reachable_1 = require("./reachable");
const scoreUnitMove = (dependencies, player, memory, knowledge, unit, tile) => {
    const actions = unit.actions(tile), { attack, buildIrrigation, buildMine, buildRoad, captureCity, disembark, embark, fortify, foundCity, noOrders, sneakAttack, } = (0, actionLookup_1.default)(actions);
    if (sneakAttack && !(0, shouldAttack_1.default)(dependencies, player, sneakAttack.enemy())) {
        return -10;
    }
    const [firstAction] = actions;
    if (firstAction &&
        !knowledge.canReturnAfter(dependencies, player, unit, firstAction)) {
        return -1;
    }
    if (!actions.length ||
        (actions.length === 1 && noOrders) ||
        (unit instanceof Types_1.Fortifiable && actions.length === 2 && fortify && noOrders)) {
        return -1;
    }
    let score = 0;
    const goodyHut = dependencies.goodyHutRegistry.getByTile(tile);
    if (goodyHut !== null) {
        score += 60;
    }
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
    // TODO: weight attacking dependent on leader's personality
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
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player), canEnter = (0, reachable_1.terrainFor)(unit);
    // Only the unknown tiles the unit could go on to: the sea a land unit can see across would count for ever, as a
    //  coast it could never reach (civ-clone/web-renderer#230).
    const discoverableTiles = tile
        .getNeighbours()
        .filter((neighbouringTile) => !playerWorld.includes(neighbouringTile) &&
        (canEnter === null || canEnter(neighbouringTile))).length;
    if (discoverableTiles > 0) {
        score += discoverableTiles * 3;
    }
    const target = memory.unitTargetData.get(unit);
    if (target instanceof Tile_1.default &&
        tile.distanceFrom(target) < unit.tile().distanceFrom(target)) {
        score += 14;
    }
    const lastMoves = memory.lastUnitMoves.get(unit) || [];
    if (!lastMoves.includes(tile)) {
        score *= 4;
    }
    return score;
};
exports.scoreUnitMove = scoreUnitMove;
exports.default = exports.scoreUnitMove;
//# sourceMappingURL=scoreUnitMove.js.map