"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldRoad = exports.shouldMine = exports.shouldIrrigate = exports.shouldBuildCity = exports.isACityTile = void 0;
// Civ1: which tiles are worth a city, irrigation, a mine or a road, judged by Civ1's terrain and yields.
const Terrains_1 = require("@civ-clone/civ1-world/Terrains");
const Yields_1 = require("@civ-clone/civ1-world/Yields");
const TerrainFeatures_1 = require("@civ-clone/civ1-world/TerrainFeatures");
const TileImprovements_1 = require("@civ-clone/civ1-world/TileImprovements");
const isACityTile = (dependencies, player, tile) => dependencies.cityRegistry
    .getByPlayer(player)
    .some((city) => city.tiles().includes(tile));
exports.isACityTile = isACityTile;
const shouldBuildCity = (dependencies, player, tile) => {
    const isEarth = dependencies.engine.option('earth', false), hasNoCities = dependencies.cityRegistry.getByPlayer(player).length === 0;
    if (isEarth && hasNoCities) {
        return true;
    }
    const terrainFeatures = dependencies.terrainFeatureRegistry.getByTerrain(tile.terrain());
    return ((tile.terrain() instanceof Terrains_1.Grassland ||
        tile.terrain() instanceof Terrains_1.River ||
        tile.terrain() instanceof Terrains_1.Plains ||
        terrainFeatures.some((feature) => feature instanceof TerrainFeatures_1.Oasis) ||
        terrainFeatures.some((feature) => feature instanceof TerrainFeatures_1.Game)) &&
        tile.getSurroundingArea().score(player, [
            [Yields_1.Food, 4],
            [Yields_1.Production, 2],
            [Yields_1.Trade, 1],
        ]) >= 160 &&
        !tile
            .getSurroundingArea(4)
            .filter((tile) => dependencies.cityRegistry.getByTile(tile) !== null).length);
};
exports.shouldBuildCity = shouldBuildCity;
const shouldIrrigate = (dependencies, player, tile) => {
    return ([Terrains_1.Desert, Terrains_1.Plains, Terrains_1.Grassland, Terrains_1.River].some((TerrainType) => tile.terrain() instanceof TerrainType) &&
        // TODO: doing this a lot already, need to make improvements a value object with a helper method
        !dependencies.tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
        (0, exports.isACityTile)(dependencies, player, tile) &&
        [...tile.getAdjacent(), tile].some((tile) => tile.terrain() instanceof Terrains_1.River ||
            tile.isCoast() ||
            (dependencies.tileImprovementRegistry
                .getByTile(tile)
                .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
                dependencies.cityRegistry.getByTile(tile) === null)));
};
exports.shouldIrrigate = shouldIrrigate;
const shouldMine = (dependencies, player, tile) => {
    return ([Terrains_1.Hills, Terrains_1.Mountains].some((TerrainType) => tile.terrain() instanceof TerrainType) &&
        !dependencies.tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvement instanceof TileImprovements_1.Mine) &&
        (0, exports.isACityTile)(dependencies, player, tile));
};
exports.shouldMine = shouldMine;
const shouldRoad = (dependencies, player, tile) => {
    return (!dependencies.tileImprovementRegistry
        .getByTile(tile)
        .some((improvement) => improvement instanceof TileImprovements_1.Road) && (0, exports.isACityTile)(dependencies, player, tile));
};
exports.shouldRoad = shouldRoad;
//# sourceMappingURL=terrain.js.map