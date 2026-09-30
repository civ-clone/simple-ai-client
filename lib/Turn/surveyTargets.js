"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.surveyTargets = void 0;
const Memory_1 = require("../Memory");
// Each list is emptied in place, not replaced: `Memory` explains why.
const surveyTargets = (dependencies, player, memory, knowledge) => {
    const { targets } = memory;
    targets.citiesToLiberate.splice(0);
    targets.enemyCitiesToAttack.splice(0);
    targets.enemyUnitsToAttack.splice(0);
    targets.goodSitesForCities.splice(0);
    targets.landTilesToExplore.splice(0);
    targets.seaTilesToExplore.splice(0);
    targets.undefendedCities.splice(0);
    (0, Memory_1.forgetDestroyedUnits)(memory);
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player), 
    // A tile some unit is already heading for isn't offered as a target again.
    claimed = (0, Memory_1.claimedTiles)(memory);
    playerWorld.entries().forEach((playerTile) => {
        const tile = playerTile.tile(), tileCity = dependencies.cityRegistry.getByTile(tile), tileUnits = dependencies.unitRegistry.getBy('tile', tile), existingTarget = claimed.has(tile);
        if (tileCity &&
            tileCity.player() === player &&
            !tileUnits.length &&
            !targets.undefendedCities.includes(tile) &&
            !existingTarget) {
            targets.undefendedCities.push(tile);
        }
        // TODO: when diplomacy exists, check diplomatic status with player
        else if (tileCity &&
            tileCity.player() !== player &&
            tileCity.originalPlayer() === player) {
            targets.citiesToLiberate.push(tile);
        }
        else if (tileCity &&
            tileCity.player() !== player &&
            !targets.enemyCitiesToAttack.includes(tile)) {
            targets.enemyCitiesToAttack.push(tile);
        }
        else if (tileUnits.length &&
            tileUnits.some((unit) => unit.player() !== player) &&
            !targets.enemyUnitsToAttack.includes(tile)) {
            targets.enemyUnitsToAttack.push(tile);
        }
        else if (tile.isLand() &&
            tile
                .getNeighbours()
                .some((tile) => !playerWorld.includes(tile)) &&
            !targets.landTilesToExplore.includes(tile) &&
            !existingTarget) {
            targets.landTilesToExplore.push(tile);
        }
        else if (tile.isWater() &&
            tile
                .getNeighbours()
                .some((tile) => !playerWorld.includes(tile)) &&
            !targets.seaTilesToExplore.includes(tile) &&
            !existingTarget) {
            targets.seaTilesToExplore.push(tile);
        }
        if (knowledge.shouldBuildCity(dependencies, player, tile) &&
            !targets.goodSitesForCities.includes(tile) &&
            !existingTarget) {
            targets.goodSitesForCities.push(tile);
        }
    });
};
exports.surveyTargets = surveyTargets;
exports.default = exports.surveyTargets;
//# sourceMappingURL=surveyTargets.js.map