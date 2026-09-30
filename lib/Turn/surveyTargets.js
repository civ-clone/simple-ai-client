"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.surveyTargets = void 0;
// Each list is emptied in place, not replaced: `Memory` explains why.
const surveyTargets = (dependencies, player, memory, knowledge) => {
    const { targets, unitPathData, unitTargetData } = memory;
    targets.citiesToLiberate.splice(0);
    targets.enemyCitiesToAttack.splice(0);
    targets.enemyUnitsToAttack.splice(0);
    targets.goodSitesForCities.splice(0);
    targets.landTilesToExplore.splice(0);
    targets.seaTilesToExplore.splice(0);
    targets.undefendedCities.splice(0);
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);
    playerWorld.entries().forEach((playerTile) => {
        const tile = playerTile.tile(), tileCity = dependencies.cityRegistry.getByTile(tile), tileUnits = dependencies.unitRegistry.getBy('tile', tile), existingTarget = targets.undefendedCities.includes(tile) &&
            ![
                ...unitTargetData.values(),
                ...[...unitPathData.values()].map((path) => path.end()),
            ].includes(tile);
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
            // TODO(civ-clone/web-renderer#199): missing `!`, so this list is never filled. Kept: #153 changes no play.
            targets.enemyUnitsToAttack.includes(tile)) {
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
            // TODO(civ-clone/web-renderer#199): missing `!`, so this list is never filled. Kept: #153 changes no play.
            targets.seaTilesToExplore.includes(tile) &&
            !existingTarget) {
            targets.seaTilesToExplore.push(tile);
        }
        if (knowledge.shouldBuildCity(dependencies, player, tile) &&
            // TODO: missing `!`, so this list is never filled and no `Settlers` is given a target. Kept: #153 changes no play.
            targets.goodSitesForCities.includes(tile) &&
            !existingTarget) {
            targets.goodSitesForCities.push(tile);
        }
    });
};
exports.surveyTargets = surveyTargets;
exports.default = exports.surveyTargets;
//# sourceMappingURL=surveyTargets.js.map