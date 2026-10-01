// Civ1: which tiles are worth a city, irrigation, a mine or a road, judged by Civ1's terrain and yields, and what
//  each terrain job is worth (`civ1TerrainPolicy`, civ-clone/web-renderer#234).
import {
  Desert,
  Grassland,
  Hills,
  Mountains,
  Plains,
  River,
} from '@civ-clone/civ1-world/Terrains';
import {
  Communism,
  Democracy,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import { Food, Production, Trade } from '@civ-clone/civ1-world/Yields';
import {
  TerrainImprovement,
  TerrainJobValue,
  TerrainPolicy,
} from '../Unit/terrainWork';
import { Game, Oasis } from '@civ-clone/civ1-world/TerrainFeatures';
import { Irrigation, Mine, Road } from '@civ-clone/civ1-world/TileImprovements';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import {
  Food as CityFood,
  Production as CityProduction,
} from '@civ-clone/library-city/Yields';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import { terrainMovementCost } from '@civ-clone/civ1-unit/Rules/Unit/movementCost';

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

// What each improvement adds to a tile's yields in Civ1, by terrain, as `civ1-world`'s `Yield` rules have it: under any
//  government, and the extra under Monarchy, Communism, the Republic or Democracy (`advanced`), or under the Republic
//  or Democracy only (`republic`). Under Despotism, an irrigated Grassland or River tile gives no more food.
type Gain = { food?: number; shields?: number; trade?: number };

const gains: [TerrainImprovement, typeof Terrain, Gain, Gain, Gain][] = [
  // [improvement, terrain, any government, advanced, republic]
  ['irrigation', Desert, { food: 1 }, {}, {}],
  ['irrigation', Grassland, {}, { food: 1 }, {}],
  ['irrigation', Hills, { food: 1 }, {}, {}],
  ['irrigation', Plains, { food: 1 }, {}, {}],
  ['irrigation', River, {}, { food: 1 }, {}],
  ['mine', Desert, { shields: 1 }, { shields: 1 }, {}],
  ['mine', Hills, { shields: 2 }, { shields: 1 }, {}],
  ['mine', Mountains, { shields: 1 }, { shields: 1 }, {}],
  ['road', Desert, { trade: 1 }, {}, { trade: 1 }],
  ['road', Grassland, { trade: 1 }, {}, { trade: 1 }],
  ['road', Plains, { trade: 1 }, {}, { trade: 1 }],
];

// The improvement each one replaces: a mine and irrigation can't share a tile.
const replaces: { [K in TerrainImprovement]?: TerrainImprovement } = {
  irrigation: 'mine',
  mine: 'irrigation',
};

const improvementTypes: {
  [K in TerrainImprovement]: typeof TileImprovement;
} = {
  irrigation: Irrigation,
  mine: Mine,
  road: Road,
};

// A worker's turns of work for each improvement, times the terrain's movement cost (`civ1-unit`'s `MovementCost`).
const workTurns: { [K in TerrainImprovement]: number } = {
  irrigation: 2,
  mine: 3,
  road: 1,
};

// How much a point of food, a shield and a point of trade are worth to a city, more of what it's short of.
const FOOD = 2;
const SHIELDS = 1.5;
const TRADE = 1;
const SHORT = 1.5;
// What improving a tile the city doesn't work yet is worth, against one it does.
const UNWORKED = 0.5;

type Weights = { food: number; shields: number; trade: number };

// Worked out once a turn for each city: `city.yields()` isn't cheap.
const weightsCache: WeakMap<City, [number, Weights]> = new WeakMap();

const weightsFor = (dependencies: Dependencies, city: City): Weights => {
  const turn = dependencies.turn.value(),
    cached = weightsCache.get(city);

  if (cached && cached[0] === turn) {
    return cached[1];
  }

  const yields = city.yields(),
    weights = {
      food: FOOD * (reduceYield(yields, CityFood) <= 1 ? SHORT : 1),
      shields: SHIELDS * (reduceYield(yields, CityProduction) <= 1 ? SHORT : 1),
      trade: TRADE,
    };

  weightsCache.set(city, [turn, weights]);

  return weights;
};

const add = (total: Gain, gain: Gain, sign: number = 1): Gain => ({
  food: (total.food ?? 0) + sign * (gain.food ?? 0),
  shields: (total.shields ?? 0) + sign * (gain.shields ?? 0),
  trade: (total.trade ?? 0) + sign * (gain.trade ?? 0),
});

// What `improvement` adds to `tile` under `player`'s government, if anything.
const gainOf = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile,
  improvement: TerrainImprovement
): Gain => {
  const government = dependencies.playerGovernmentRegistry.getByPlayer(player),
    advanced = government.is(Monarchy, Communism, Republic, Democracy),
    republic = government.is(Republic, Democracy),
    row = gains.find(
      ([rowImprovement, TerrainType]): boolean =>
        rowImprovement === improvement && tile.terrain() instanceof TerrainType
    );

  if (!row) {
    return {};
  }

  const [, , always, ifAdvanced, ifRepublic] = row;

  return add(
    add(always, advanced ? ifAdvanced : {}),
    republic ? ifRepublic : {}
  );
};

// Civ1's terrain jobs for `TerrainWork`: irrigation, mines and roads where they add food, shields or trade, weighed by
//  what the city that works (or could work) the tile is short of, for a worker's turns of work.
export const civ1TerrainPolicy: TerrainPolicy = {
  jobs: (dependencies, player, tile) => {
    const workedTile = dependencies.workedTileRegistry.getByTile(tile),
      workedBy =
        workedTile && workedTile.city().player() === player
          ? workedTile.city()
          : null,
      city =
        workedBy ??
        dependencies.cityRegistry
          .getByPlayer(player)
          .filter((city: City): boolean => city.tiles().includes(tile))
          .sort(
            (a: City, b: City): number =>
              a.tile().distanceFrom(tile) - b.tile().distanceFrom(tile)
          )[0];

    if (!city) {
      return [];
    }

    const existing = dependencies.tileImprovementRegistry.getByTile(tile),
      has = (improvement: TerrainImprovement): boolean =>
        existing.some(
          (tileImprovement: TileImprovement): boolean =>
            tileImprovement instanceof improvementTypes[improvement]
        ),
      weights = weightsFor(dependencies, city),
      cost = terrainMovementCost(tile.terrain()) ?? 1;

    return (['irrigation', 'mine', 'road'] as TerrainImprovement[])
      .filter((improvement: TerrainImprovement): boolean => !has(improvement))
      .map((improvement: TerrainImprovement): TerrainJobValue => {
        const replaced = replaces[improvement],
          gain = add(
            gainOf(dependencies, player, tile, improvement),
            replaced && has(replaced)
              ? gainOf(dependencies, player, tile, replaced)
              : {},
            -1
          );

        return {
          improvement,
          value:
            (workedBy ? 1 : UNWORKED) *
            ((gain.food ?? 0) * weights.food +
              (gain.shields ?? 0) * weights.shields +
              (gain.trade ?? 0) * weights.trade),
          turns: workTurns[improvement] * cost,
        };
      })
      .filter(({ value }: TerrainJobValue): boolean => value > 0);
  },
  // One for every eight cities. Settlers on terrain jobs count towards the three Settlers a player builds at most
  //  (`buildItemInCity`), so each is one fewer settling: with one for every six, players founded a city fewer by turn
  //  300; with one for every three, three fewer.
  workersWanted: (dependencies, player) =>
    Math.floor(dependencies.cityRegistry.getByPlayer(player).length / 8),
};
