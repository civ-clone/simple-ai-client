"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewCities = void 0;
const Memory_1 = require("@civ-clone/base-strategy-ai/lib/Memory");
const reviewCities = (dependencies, player, memory, knowledge) => {
    const { targets } = memory, 
    // A city some unit is already heading for to defend it isn't offered again.
    claimed = (0, Memory_1.claimedTiles)(memory);
    dependencies.cityRegistry.getByPlayer(player).forEach((city) => {
        const tileUnits = dependencies.unitRegistry.getByTile(city.tile());
        knowledge.assignWorkers(dependencies, city);
        if (!tileUnits.length &&
            !targets.undefendedCities.includes(city.tile()) &&
            !claimed.has(city.tile())) {
            targets.undefendedCities.push(city.tile());
        }
    });
};
exports.reviewCities = reviewCities;
exports.default = exports.reviewCities;
//# sourceMappingURL=reviewCities.js.map