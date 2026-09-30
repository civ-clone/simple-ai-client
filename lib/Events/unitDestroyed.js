"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitDestroyed = void 0;
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
// `buildItemInCity` is the ruleset's city production, for the same player.
const unitDestroyed = (dependencies, player, unit, buildItemInCity) => {
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