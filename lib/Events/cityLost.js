"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cityLost = void 0;
const hasPlayerCity = (tile, player, cityRegistry) => {
    const city = cityRegistry.getByTile(tile);
    if (city === null) {
        return false;
    }
    return city.player() === player;
};
// `by` is the player that took or destroyed `city`, or `null` if nobody did.
const cityLost = (dependencies, player, targets, city, by, destroyed) => {
    // Can't retaliate against ourselves, we deserved it...
    if (!by) {
        return;
    }
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);
    if (destroyed) {
        // REVENGE!
        targets.enemyCitiesToAttack.push(...playerWorld
            .entries()
            .filter((playerTile) => hasPlayerCity(playerTile.tile(), by, dependencies.cityRegistry))
            .map((playerTile) => playerTile.tile()));
        targets.enemyUnitsToAttack.push(...playerWorld
            .entries()
            .filter((playerTile) => dependencies.unitRegistry
            .getByTile(playerTile.tile())
            .some((unit) => unit.player() === by))
            .map((playerTile) => playerTile.tile()));
        return;
    }
    targets.citiesToLiberate.push(city.tile());
};
exports.cityLost = cityLost;
exports.default = exports.cityLost;
//# sourceMappingURL=cityLost.js.map