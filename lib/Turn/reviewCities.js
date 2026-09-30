"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewCities = void 0;
const reviewCities = (dependencies, player, targets, knowledge) => dependencies.cityRegistry.getByPlayer(player).forEach((city) => {
    const tileUnits = dependencies.unitRegistry.getByTile(city.tile());
    knowledge.assignWorkers(dependencies, city);
    if (!tileUnits.length && !targets.undefendedCities.includes(city.tile())) {
        targets.undefendedCities.push(city.tile());
    }
});
exports.reviewCities = reviewCities;
exports.default = exports.reviewCities;
//# sourceMappingURL=reviewCities.js.map