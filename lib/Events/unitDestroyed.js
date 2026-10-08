"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitDestroyed = void 0;
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
const Memory_1 = require("@civ-clone/base-strategy-ai/lib/Memory");
// `by` is the player whose unit destroyed `unit`, or `null`. `buildItemInCity` is the ruleset's city production, for
//  the same player.
const unitDestroyed = (dependencies, player, memory, unit, by, buildItemInCity) => {
    const { enemyUnitsToAttack } = memory.targets;
    (0, Memory_1.forgetUnit)(memory, unit);
    // Like `cityLost`'s revenge: the attacker's units where ours fell, or next to it, are worth going after.
    if (by && by !== player) {
        [unit.tile(), ...unit.tile().getNeighbours()]
            .filter((tile) => !enemyUnitsToAttack.includes(tile) &&
            dependencies.unitRegistry
                .getByTile(tile)
                .some((tileUnit) => tileUnit.player() === by))
            .forEach((tile) => enemyUnitsToAttack.push(tile));
    }
    const city = dependencies.cityRegistry.getByTile(unit.tile()), tileUnits = dependencies.unitRegistry.getByTile(unit.tile());
    if (city && city.player() === player && tileUnits.length < 2) {
        buildItemInCity(city);
        dependencies.playerTreasuryRegistry
            .getByPlayerAndType(player, Gold_1.default)
            .buy(city);
    }
};
exports.unitDestroyed = unitDestroyed;
exports.default = exports.unitDestroyed;
//# sourceMappingURL=unitDestroyed.js.map