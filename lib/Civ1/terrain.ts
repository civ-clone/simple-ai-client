// Civ1: which tiles are worth a city, irrigation, a mine or a road, judged by Civ1's terrain and yields.
import {
  Desert,
  Grassland,
  Hills,
  Mountains,
  Plains,
  River,
} from '@civ-clone/civ1-world/Terrains';
import { Food, Production, Trade } from '@civ-clone/civ1-world/Yields';
import { Game, Oasis } from '@civ-clone/civ1-world/TerrainFeatures';
import { Irrigation, Mine, Road } from '@civ-clone/civ1-world/TileImprovements';
import Dependencies from '../Dependencies';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';

export const isACityTile = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): boolean =>
  dependencies.cityRegistry
    .getByPlayer(player)
    .some((city) => city.tiles().includes(tile));

export const shouldBuildCity = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): boolean => {
  const isEarth = dependencies.engine.option('earth', false),
    hasNoCities = dependencies.cityRegistry.getByPlayer(player).length === 0;

  if (isEarth && hasNoCities) {
    return true;
  }

  const terrainFeatures = dependencies.terrainFeatureRegistry.getByTerrain(
    tile.terrain()
  );

  return (
    (tile.terrain() instanceof Grassland ||
      tile.terrain() instanceof River ||
      tile.terrain() instanceof Plains ||
      terrainFeatures.some(
        (feature: TerrainFeature): boolean => feature instanceof Oasis
      ) ||
      terrainFeatures.some(
        (feature: TerrainFeature): boolean => feature instanceof Game
      )) &&
    tile.getSurroundingArea().score(player, [
      [Food, 4],
      [Production, 2],
      [Trade, 1],
    ]) >= 160 &&
    !tile
      .getSurroundingArea(4)
      .filter(
        (tile: Tile): boolean =>
          dependencies.cityRegistry.getByTile(tile) !== null
      ).length
  );
};

export const shouldIrrigate = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): boolean => {
  return (
    [Desert, Plains, Grassland, River].some(
      (TerrainType) => tile.terrain() instanceof TerrainType
    ) &&
    // TODO: doing this a lot already, need to make improvements a value object with a helper method
    !dependencies.tileImprovementRegistry
      .getByTile(tile)
      .some(
        (improvement: TileImprovement): boolean =>
          improvement instanceof Irrigation
      ) &&
    isACityTile(dependencies, player, tile) &&
    [...tile.getAdjacent(), tile].some(
      (tile: Tile): boolean =>
        tile.terrain() instanceof River ||
        tile.isCoast() ||
        (dependencies.tileImprovementRegistry
          .getByTile(tile)
          .some(
            (improvement: TileImprovement): boolean =>
              improvement instanceof Irrigation
          ) &&
          dependencies.cityRegistry.getByTile(tile) === null)
    )
  );
};

export const shouldMine = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): boolean => {
  return (
    [Hills, Mountains].some(
      (TerrainType: typeof Terrain): boolean =>
        tile.terrain() instanceof TerrainType
    ) &&
    !dependencies.tileImprovementRegistry
      .getByTile(tile)
      .some(
        (improvement: TileImprovement): boolean => improvement instanceof Mine
      ) &&
    isACityTile(dependencies, player, tile)
  );
};

export const shouldRoad = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): boolean => {
  return (
    !dependencies.tileImprovementRegistry
      .getByTile(tile)
      .some(
        (improvement: TileImprovement): boolean => improvement instanceof Road
      ) && isACityTile(dependencies, player, tile)
  );
};
