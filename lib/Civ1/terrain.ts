// Civ1: which tiles are worth a city, irrigation, a mine or a road, judged by Civ1's terrain and yields, and what
//  each terrain job is worth (`civ1TerrainPolicy`, civ-clone/web-renderer#234), railroads included
//  (civ-clone/web-renderer#349), and clearing or planting terrain and carrying water to a dry tile
//  (civ-clone/web-renderer#353, #383, #386, #426, #428).
import {
  Desert,
  Forest,
  Grassland,
  Hills,
  Jungle,
  Mountains,
  Plains,
  River,
  Swamp,
} from '@civ-clone/civ1-world/Terrains';
import {
  Communism,
  Democracy,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import { Food, Production, Trade } from '@civ-clone/civ1-world/Yields';
import {
  TerrainJob,
  TerrainJobValue,
  TerrainPolicy,
  terrainJobs,
} from '@civ-clone/base-strategy-terrain-work/lib/Unit/terrainWork';
import { Game, Oasis } from '@civ-clone/civ1-world/TerrainFeatures';
import {
  Irrigation,
  Mine,
  Pollution,
  Railroad,
  Road,
} from '@civ-clone/civ1-world/TileImprovements';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import Tile, { IYieldMap } from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import {
  Food as CityFood,
  Production as CityProduction,
} from '@civ-clone/library-city/Yields';
import {
  reduceYield,
  reduceYields,
} from '@civ-clone/core-yield/lib/reduceYields';
import {
  BuildIrrigation,
  BuildMine,
  BuildRailroad,
  BuildRoad,
  ClearForest,
  ClearJungle,
  ClearSwamp,
  CleanPollution,
  PlantForest,
} from '@civ-clone/civ1-unit/Actions';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import { Railroad as RailroadAdvance } from '@civ-clone/civ1-science/Advances';
import UnitAction from '@civ-clone/core-unit/Action';
import Yield, { YieldValue } from '@civ-clone/core-yield/Yield';
import {
  DESPOTISM_PENALTY,
  TRADE_BONUS,
  governmentTileYield,
} from '@civ-clone/civ1-world/lib/governmentTileYield';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import {
  terrainJobTurns,
  terrainMovementCost,
} from '@civ-clone/civ1-unit/Rules/Unit/movementCost';
import PollutionConcern from '@civ-clone/base-leader-personality/Rules/Player/PollutionConcern';
import { product } from '@civ-clone/base-leader-personality/lib/combine';

export const isACityTile = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): boolean =>
  dependencies.cityRegistry
    .getByPlayer(player)
    .some((city) => city.tiles().includes(tile));

// The tiles around each tile, by radius, as `Tile#getSurroundingArea` lists them. The survey asks whether every tile the
//  player knows would make a good city site, every turn, and building a `Tileset` for each of them (two, for those that
//  score well enough) was the larger part of the survey's time (civ-clone/web-renderer#317). The tiles around a tile
//  are fixed by the shape of the map, so each tile's are listed once; what's on them is still read afresh each time.
//  The lists are shared, so not for changing.
const surroundingAreas: Map<number, WeakMap<Tile, Tile[]>> = new Map();

export const surroundingArea = (tile: Tile, radius: number): Tile[] => {
  let byTile = surroundingAreas.get(radius);

  if (!byTile) {
    byTile = new WeakMap();
    surroundingAreas.set(radius, byTile);
  }

  let area = byTile.get(tile);

  if (!area) {
    area = tile.getSurroundingArea(radius).entries();
    byTile.set(tile, area);
  }

  return area;
};

const citySiteWeights: IYieldMap[] = [
  [Food, 4],
  [Production, 2],
  [Trade, 1],
];

// Each tile's `score` as a city site's surroundings weigh it, for each player, kept with the yields it was worked out
//  from: every candidate site within two tiles asks for it again. `Tile#yields` keeps the same list until something
//  that changes them (an improvement, a government, what the player can see) clears it, and the score is worked out
//  afresh from the new one.
const citySiteScores: WeakMap<
  Tile,
  Map<Player | null, [Yield[], number]>
> = new WeakMap();

const citySiteScore = (tile: Tile, player: Player): number => {
  const yields = tile.yields(player);

  let byPlayer = citySiteScores.get(tile);

  if (!byPlayer) {
    byPlayer = new Map();
    citySiteScores.set(tile, byPlayer);
  }

  const cached = byPlayer.get(player);

  if (cached && cached[0] === yields) {
    return cached[1];
  }

  const score = tile.score(player, citySiteWeights);

  byPlayer.set(player, [yields, score]);

  return score;
};

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
    // As `Tileset#score` adds them up, in the same order.
    surroundingArea(tile, 2).reduce(
      (total: number, tile: Tile): number =>
        total + citySiteScore(tile, player),
      0
    ) >= 160 &&
    !surroundingArea(tile, 4).some(
      (tile: Tile): boolean =>
        dependencies.cityRegistry.getByTile(tile) !== null
    )
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

// What each improvement adds to a tile's yields in Civ1, by terrain, under any government, and the extra under
//  Monarchy, Communism, the Republic or Democracy (`advanced`), or under the Republic or Democracy only (`republic`).
//  v474.05 adds the same to a tile under every government, then takes 1 off a yield of more than 2 under Anarchy and
//  Despotism and adds 1 to any trade under the Republic and Democracy (`civ1-world`'s `lib/governmentTileYield`,
//  civ-clone/web-renderer#401). On a tile without a special resource that comes to this: irrigated Grassland or River
//  gives no more food under Despotism, a mined Hills 2 shields more rather than 3, and a road 2 trade under the
//  Republic.
type Gain = { food?: number; shields?: number; trade?: number };

type Improvement = 'irrigation' | 'mine' | 'railroad' | 'road';

const gains: [Improvement, typeof Terrain, Gain, Gain, Gain][] = [
  // [improvement, terrain, any government, advanced, republic]
  ['irrigation', Desert, { food: 1 }, {}, {}],
  ['irrigation', Grassland, {}, { food: 1 }, {}],
  ['irrigation', Hills, { food: 1 }, {}, {}],
  ['irrigation', Plains, { food: 1 }, {}, {}],
  ['irrigation', River, {}, { food: 1 }, {}],
  ['mine', Desert, { shields: 1 }, {}, {}],
  ['mine', Hills, { shields: 2 }, { shields: 1 }, {}],
  ['mine', Mountains, { shields: 1 }, {}, {}],
  ['road', Desert, { trade: 1 }, {}, { trade: 1 }],
  ['road', Grassland, { trade: 1 }, {}, { trade: 1 }],
  ['road', Plains, { trade: 1 }, {}, { trade: 1 }],
];

// The improvement each one replaces: a mine and irrigation can't share a tile.
const replaces: { [K in Improvement]?: Improvement } = {
  irrigation: 'mine',
  mine: 'irrigation',
};

const improvementTypes: {
  [K in Improvement]: typeof TileImprovement;
} = {
  irrigation: Irrigation,
  mine: Mine,
  railroad: Railroad,
  road: Road,
};

// The worker's action for each improvement, whose turns of work come from `civ1-unit`'s `terrainJobTurns`.
const workActions: { [K in Improvement]: typeof UnitAction } = {
  irrigation: BuildIrrigation,
  mine: BuildMine,
  railroad: BuildRailroad,
  road: BuildRoad,
};

// Civ1's terrain changes a worker makes (civ-clone/web-renderer#353, #386): the job, its action, the terrain it's done
//  on and the terrain it leaves. Civ1's own AI never makes them (v474.05's `TerrainModifications` table); this improves
//  on it. Planting Forest has its own conditions (`plantingJobs`, civ-clone/web-renderer#428).
type Conversion = 'clearForest' | 'clearJungle' | 'clearSwamp';

const conversions: [
  Conversion,
  typeof UnitAction,
  (typeof Terrain)[],
  typeof Terrain
][] = [
  ['clearForest', ClearForest, [Forest], Plains],
  ['clearJungle', ClearJungle, [Jungle], Grassland],
  ['clearSwamp', ClearSwamp, [Swamp], Grassland],
];

// Each terrain's own yields, before any feature or improvement, as `civ1-world`'s `TileYield` rules have them: what a
//  terrain change is worth is the difference.
const baseYields: [typeof Terrain, Gain][] = [
  [Forest, { food: 1, shields: 2 }],
  [Grassland, { food: 2 }],
  [Jungle, { food: 1 }],
  [Plains, { food: 1, shields: 1 }],
  [Swamp, { food: 1 }],
];

// Whether `TerrainType` is `BaseType` or one of its kind.
const isA = (TerrainType: typeof Terrain, BaseType: typeof Terrain): boolean =>
  TerrainType === BaseType || TerrainType.prototype instanceof BaseType;

const baseYieldsOf = (TerrainType: typeof Terrain): Gain =>
  baseYields.find(([BaseType]): boolean => isA(TerrainType, BaseType))?.[1] ??
  {};

// How much a point of food, a shield and a point of trade are worth to a city. Food is worth more the less of it the
//  city has to spare (`FOOD_BY_SURPLUS`, from a surplus of 0 or less up; more than its last is `FOOD_SURPLUS`), and
//  shields `SHORT` times as much when it has at most 1 to spare (civ-clone/web-renderer#383).
const FOOD = 2;
const FOOD_BY_SURPLUS = [2, 1.5, 1.25, 1];
const FOOD_SURPLUS = 0.75;
const SHIELDS = 1.5;
const TRADE = 1;
const SHORT = 1.5;
// What irrigation is worth against what its food alone would be, so that workers see to food first
//  (civ-clone/web-renderer#383).
const IRRIGATION = 1.25;
// What improving a tile the city doesn't work yet is worth, against one it does.
const UNWORKED = 0.5;
// What a job is worth for the irrigation it lets a neighbouring tile have, against that irrigation itself
//  (civ-clone/web-renderer#426).
const CHAIN = 0.5;

type Weights = { food: number; shields: number; trade: number };

type Surplus = { food: number; shields: number };

// Worked out once a turn for each city: `city.yields()` isn't cheap.
const surplusCache: WeakMap<City, [number, Surplus]> = new WeakMap();

// The food and shields `city` has to spare this turn.
const surplusFor = (dependencies: Dependencies, city: City): Surplus => {
  const turn = dependencies.turn.value(),
    cached = surplusCache.get(city);

  if (cached && cached[0] === turn) {
    return cached[1];
  }

  const yields = city.yields(),
    surplus = {
      food: reduceYield(yields, CityFood),
      shields: reduceYield(yields, CityProduction),
    };

  surplusCache.set(city, [turn, surplus]);

  return surplus;
};

const weightsCache: WeakMap<City, [number, Weights]> = new WeakMap();

const weightsFor = (dependencies: Dependencies, city: City): Weights => {
  const turn = dependencies.turn.value(),
    cached = weightsCache.get(city);

  if (cached && cached[0] === turn) {
    return cached[1];
  }

  const { food: foodSurplus, shields: shieldSurplus } = surplusFor(
      dependencies,
      city
    ),
    weights = {
      food:
        FOOD *
        (foodSurplus < FOOD_BY_SURPLUS.length
          ? FOOD_BY_SURPLUS[Math.max(0, foodSurplus)]
          : FOOD_SURPLUS),
      shields: SHIELDS * (shieldSurplus <= 1 ? SHORT : 1),
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

const worth = (gain: Gain, weights: Weights): number =>
  (gain.food ?? 0) * weights.food +
  (gain.shields ?? 0) * weights.shields +
  (gain.trade ?? 0) * weights.trade;

// The providers of what the government and pollution did to a square (`civ1-world`), left out to find what it
//  yielded before them.
const governmentSteps = [DESPOTISM_PENALTY, TRADE_BONUS, Pollution.name];

// What a railroad adds to `tile` for `player`, as `civ1-world`'s `YieldModifier` rules and v474.05 have it: half of
//  each yield as it is before the government's steps, rounded down, then those steps and pollution again
//  (civ-clone/web-renderer#401). Under Despotism, a square of 2 gains nothing: its 3 loses 1.
const railroadGain = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): Gain => {
  let government: PlayerGovernment | null = null;

  try {
    government = dependencies.playerGovernmentRegistry.getByPlayer(player);
  } catch (e) {
    government = null;
  }

  const tileYields = tile.yields(player),
    polluted = isPolluted(dependencies, tile),
    gainOfType = (YieldType: typeof Yield): number => {
      const ofType = tileYields.filter(
          (tileYield: Yield): boolean => tileYield instanceof YieldType
        ),
        current = reduceYield(ofType, YieldType),
        before = ofType
          .flatMap((tileYield: Yield) => tileYield.values())
          .filter(
            ([, provider]: YieldValue): boolean =>
              !governmentSteps.includes(provider)
          )
          .reduce(
            (total: number, [value]: YieldValue): number => total + value,
            0
          ),
        withRailroad = governmentTileYield(
          YieldType,
          before + Math.floor(before / 2),
          government
        );

      return (polluted ? Math.ceil(withRailroad / 2) : withRailroad) - current;
    };

  return {
    food: gainOfType(Food),
    shields: gainOfType(Production),
    trade: gainOfType(Trade),
  };
};

// What `improvement` adds to a tile of `TerrainType` under `player`'s government, if anything.
const gainOn = (
  dependencies: Dependencies,
  player: Player,
  TerrainType: typeof Terrain,
  improvement: Improvement
): Gain => {
  const government = dependencies.playerGovernmentRegistry.getByPlayer(player),
    advanced = government.is(Monarchy, Communism, Republic, Democracy),
    republic = government.is(Republic, Democracy),
    row = gains.find(
      ([rowImprovement, RowTerrain]): boolean =>
        rowImprovement === improvement && isA(TerrainType, RowTerrain)
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

const terrainTypeOf = (tile: Tile): typeof Terrain =>
  tile.terrain().constructor as typeof Terrain;

// What `improvement` adds to `tile` under `player`'s government, if anything.
const gainOf = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile,
  improvement: Improvement
): Gain =>
  improvement === 'railroad'
    ? railroadGain(dependencies, player, tile)
    : gainOn(dependencies, player, terrainTypeOf(tile), improvement);

// Whether the player has the Railroad advance.
const knowsRailroad = (dependencies: Dependencies, player: Player): boolean =>
  dependencies.playerResearchRegistry
    .getBy('player', player)
    .some((research: PlayerResearch): boolean =>
      research.completed(RailroadAdvance)
    );

const hasImprovement = (
  dependencies: Dependencies,
  tile: Tile,
  improvement: Improvement
): boolean =>
  dependencies.tileImprovementRegistry
    .getByTile(tile)
    .some(
      (tileImprovement: TileImprovement): boolean =>
        tileImprovement instanceof improvementTypes[improvement]
    );

const hasFeature = (dependencies: Dependencies, tile: Tile): boolean =>
  dependencies.terrainFeatureRegistry.getByTerrain(tile.terrain()).length > 0;

const isCityTile = (dependencies: Dependencies, tile: Tile): boolean =>
  dependencies.cityRegistry.getByTile(tile) !== null;

// Whether `tile` could be irrigated as far as water goes, as `civ1-unit`'s `BuildIrrigation` rule has it: it's a River,
//  or a River, water or an irrigated tile with no city on it is next to it, north, east, south or west.
const waterBeside = (dependencies: Dependencies, tile: Tile): boolean =>
  tile.terrain() instanceof River ||
  tile
    .getAdjacent()
    .some(
      (neighbour: Tile): boolean =>
        neighbour.terrain() instanceof River ||
        neighbour.isWater() ||
        (hasImprovement(dependencies, neighbour, 'irrigation') &&
          !isCityTile(dependencies, neighbour))
    );

// Whether irrigation gives a tile of `TerrainType` anything, under any government.
const irrigable = (TerrainType: typeof Terrain): boolean =>
  gains.some(
    ([improvement, RowTerrain]): boolean =>
      improvement === 'irrigation' && isA(TerrainType, RowTerrain)
  );

// Whether `tile` could carry water to a neighbour, once irrigated: it has water beside it and is irrigable, or a Forest
//  with no feature that would be Plains once cleared (civ-clone/web-renderer#426). Hills only while they have no mine:
//  they're irrigated to carry the water and mined once the neighbour has it (`onlyWaterFor`), but a mine already there
//  isn't given up for it (civ-clone/web-renderer#428).
const couldCarryWater = (dependencies: Dependencies, tile: Tile): boolean =>
  tile.isLand() &&
  !isCityTile(dependencies, tile) &&
  !(
    tile.terrain() instanceof Hills &&
    hasImprovement(dependencies, tile, 'mine')
  ) &&
  waterBeside(dependencies, tile) &&
  (irrigable(terrainTypeOf(tile)) ||
    (tile.terrain() instanceof Forest && !hasFeature(dependencies, tile)));

// The city of the player's that works `tile`, and whether it works it, or else the nearest of its cities that could.
const cityFor = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): [City, boolean] | null => {
  const workedTile = dependencies.workedTileRegistry.getByTile(tile);

  if (workedTile && workedTile.city().player() === player) {
    return [workedTile.city(), true];
  }

  const city = dependencies.cityRegistry
    .getByPlayer(player)
    .filter((city: City): boolean => city.tiles().includes(tile))
    .sort(
      (a: City, b: City): number =>
        a.tile().distanceFrom(tile) - b.tile().distanceFrom(tile)
    )[0];

  return city ? [city, false] : null;
};

// What irrigating `tile` is worth to the city that works (or could work) it, if anything, whether or not it has water
//  beside it yet: 0 for a tile already irrigated, or that no city of the player's could work.
const irrigationWorth = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): number => {
  if (
    isCityTile(dependencies, tile) ||
    hasImprovement(dependencies, tile, 'irrigation')
  ) {
    return 0;
  }

  const found = cityFor(dependencies, player, tile);

  if (!found) {
    return 0;
  }

  const [city, worked] = found,
    weights = weightsFor(dependencies, city),
    gain = add(
      gainOf(dependencies, player, tile, 'irrigation'),
      hasImprovement(dependencies, tile, 'mine')
        ? gainOf(dependencies, player, tile, 'mine')
        : {},
      -1
    );

  return Math.max(
    0,
    (worked ? 1 : UNWORKED) * IRRIGATION * worth(gain, weights)
  );
};

// The tiles next to `tile`, north, east, south or west, that would be worth irrigating but have no water beside them:
//  irrigating `tile` (or clearing it to irrigate it) would let them have it (civ-clone/web-renderer#426).
const dryNeighbours = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): Tile[] =>
  tile
    .getAdjacent()
    .filter(
      (neighbour: Tile): boolean =>
        neighbour.isLand() &&
        irrigable(terrainTypeOf(neighbour)) &&
        !waterBeside(dependencies, neighbour) &&
        irrigationWorth(dependencies, player, neighbour) > 0
    );

// What carrying water to its dry neighbours is worth from `tile`, as a share of what irrigating them is worth.
const chainWorth = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): number =>
  couldCarryWater(dependencies, tile)
    ? CHAIN *
      dryNeighbours(dependencies, player, tile).reduce(
        (total: number, neighbour: Tile): number =>
          total + irrigationWorth(dependencies, player, neighbour),
        0
      )
    : 0;

// Whether `tile`'s irrigation is the only water a neighbour that's still worth irrigating could have: it isn't to be
//  mined until that neighbour is irrigated.
const onlyWaterFor = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): boolean =>
  tile.getAdjacent().some(
    (neighbour: Tile): boolean =>
      neighbour.isLand() &&
      irrigable(terrainTypeOf(neighbour)) &&
      irrigationWorth(dependencies, player, neighbour) > 0 &&
      !(neighbour.terrain() instanceof River) &&
      neighbour
        .getAdjacent()
        .filter(
          (source: Tile): boolean =>
            source.terrain() instanceof River ||
            source.isWater() ||
            (hasImprovement(dependencies, source, 'irrigation') &&
              !isCityTile(dependencies, source))
        )
        .every((source: Tile): boolean => source === tile)
  );

// Whether `tile` could ever have water for irrigation: beside it now, or through a neighbour that could carry it.
const couldHaveWater = (dependencies: Dependencies, tile: Tile): boolean =>
  waterBeside(dependencies, tile) ||
  tile
    .getAdjacent()
    .some((neighbour: Tile): boolean =>
      couldCarryWater(dependencies, neighbour)
    );

// The terrain changes worth making to `tile` (civ-clone/web-renderer#353, #386): Jungle and Swamp with no feature cleared
//  to Grassland on a tile the city works, as only a tile worked for a long time repays 15 turns of work; and Forest with
//  no feature cleared to Plains only when the Plains could then be irrigated (it has water beside it), with that
//  irrigation counted in, on a tile the city works or one that would carry water on to a tile worth irrigating.
const conversionJobs = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile,
  weights: Weights,
  worked: boolean
): TerrainJobValue[] => {
  if (hasFeature(dependencies, tile)) {
    return [];
  }

  const water = waterBeside(dependencies, tile),
    chain = chainWorth(dependencies, player, tile);

  return conversions
    .filter(([, , from]): boolean =>
      from.some(
        (FromType: typeof Terrain): boolean =>
          tile.terrain() instanceof FromType
      )
    )
    .flatMap(([job, Action, , To]): TerrainJobValue[] => {
      if (
        (job === 'clearForest' && !water) ||
        (!worked && (job !== 'clearForest' || chain <= 0))
      ) {
        return [];
      }

      const turns = terrainJobTurns(Action, tile.terrain()) ?? 1,
        // Irrigating the new terrain afterwards, where it could be.
        then =
          water && irrigable(To)
            ? gainOn(dependencies, player, To, 'irrigation')
            : {},
        thenTurns =
          (then.food ?? 0) > 0
            ? terrainJobTurns(BuildIrrigation, new To()) ?? 0
            : 0,
        gain = add(
          add(baseYieldsOf(To), baseYieldsOf(terrainTypeOf(tile)), -1),
          then
        ),
        value =
          (worked ? 1 : UNWORKED) * worth(gain, weights) +
          (job === 'clearForest' ? chain : 0);

      return [
        {
          improvement: job,
          action: job,
          value,
          turns: turns + thenTurns,
        },
      ];
    });
};

// Planting Forest (civ-clone/web-renderer#428): Grassland or Plains with no feature, no irrigation and no mine, and no
//  water near it (`waterNear`), worked by a city with at least `PLANT_FOOD` food to spare and at most `PLANT_SHIELDS`
//  shields. It trades a point of food for shields, which only pays a city with food to spare and few shields.
const PLANT_FOOD = 3;
const PLANT_SHIELDS = 2;

// Whether a source of water for irrigation (a River, the sea, or irrigation on a square with no city) is within
//  `WATER_NEAR` squares of `tile`. Water that close could reach the square later, through one or two squares between
//  irrigated (or a Jungle or Swamp cleared and irrigated), and a Forest with water beside it is one `clearForest` could
//  clear again. Water further off would need three or more squares irrigated for their own worth first, which is rare
//  enough to leave.
const WATER_NEAR = 3;

const waterNear = (dependencies: Dependencies, tile: Tile): boolean =>
  surroundingArea(tile, WATER_NEAR).some(
    (near: Tile): boolean =>
      near.terrain() instanceof River ||
      near.isWater() ||
      (hasImprovement(dependencies, near, 'irrigation') &&
        !isCityTile(dependencies, near))
  );

// How many of the player's workers are planting Forest, or are on their way to, on `city`'s worked tiles other than
//  `tile`: each will take a point of food from the city and add a shield or more, which this turn's surplus doesn't
//  show yet.
const plantingsFor = (
  dependencies: Dependencies,
  player: Player,
  city: City,
  tile: Tile
): number =>
  [
    ...terrainJobs(dependencies.memoryRegistry.memoryFor(player)).values(),
  ].filter(
    (job: TerrainJob): boolean =>
      job.improvement === 'plantForest' &&
      job.tile !== tile &&
      dependencies.workedTileRegistry.getByTile(job.tile)?.city() === city
  ).length;

const plantingJobs = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile,
  city: City,
  weights: Weights
): TerrainJobValue[] => {
  if (
    !(
      tile.terrain() instanceof Grassland || tile.terrain() instanceof Plains
    ) ||
    isCityTile(dependencies, tile) ||
    hasFeature(dependencies, tile) ||
    hasImprovement(dependencies, tile, 'irrigation') ||
    hasImprovement(dependencies, tile, 'mine') ||
    waterNear(dependencies, tile)
  ) {
    return [];
  }

  const surplus = surplusFor(dependencies, city),
    planting = plantingsFor(dependencies, player, city, tile);

  if (
    surplus.food - planting < PLANT_FOOD ||
    surplus.shields + planting > PLANT_SHIELDS
  ) {
    return [];
  }

  // What the square yields now, against what the Forest would: its own yields, and half of each again with a Railroad
  //  (as `railroadGain`). A Road's trade is lost, as Forest has none to add to.
  const [food, shields, trade] = reduceYields(
      tile.yields(player),
      Food,
      Production,
      Trade
    ),
    forest = baseYieldsOf(Forest),
    railroad = hasImprovement(dependencies, tile, 'railroad'),
    withRailroad = (value: number = 0): number =>
      value + (railroad ? Math.floor(value / 2) : 0),
    gain = {
      food: withRailroad(forest.food) - food,
      shields: withRailroad(forest.shields) - shields,
      trade: withRailroad(forest.trade) - trade,
    };

  return [
    {
      improvement: 'plantForest',
      action: 'plantForest',
      value: worth(gain, weights),
      turns: terrainJobTurns(PlantForest, tile.terrain()) ?? 1,
    },
  ];
};

// Routes between the player's cities (civ-clone/web-renderer#384): each city is joined to its `ROUTE_LINKS` nearest
//  cities of the player's within `ROUTE_DISTANCE`, along the cheapest way over land by Civ1's movement costs, which
//  takes a Road already there where it can. A square on a route is worth `ROUTE` more with a Road, and again with a
//  Railroad once the player knows how, as a point of trade would be, whether or not a city works it.
const ROUTE = 1;
const ROUTE_DISTANCE = 10;
const ROUTE_LINKS = 2;
// How far a route may stray from the straight line between its cities, in squares.
const ROUTE_MARGIN = 2;
// What each square of straying costs a step, far less than any move, so that it only decides between equal ways.
const STRAIGHTNESS = 0.001;

// What a step onto `to` from `from` costs by Civ1's movement rules: a third between two squares with a Road, nothing
//  between two with a Railroad, and the terrain's own cost otherwise.
const stepCost = (dependencies: Dependencies, from: Tile, to: Tile): number => {
  if (
    hasImprovement(dependencies, from, 'railroad') &&
    hasImprovement(dependencies, to, 'railroad')
  ) {
    return 0;
  }

  if (
    hasImprovement(dependencies, from, 'road') &&
    hasImprovement(dependencies, to, 'road')
  ) {
    return 1 / 3;
  }

  return terrainMovementCost(to.terrain()) ?? 3;
};

// The squares between `from` and `to` along the cheapest way over land, neither city included, or none if there's no
//  way within `ROUTE_MARGIN` of the straight line. No other city is passed through.
const route = (dependencies: Dependencies, from: Tile, to: Tile): Tile[] => {
  const limit = from.distanceFrom(to) + 2 * ROUTE_MARGIN,
    costs = new Map<Tile, number>([[from, 0]]),
    previous = new Map<Tile, Tile>(),
    open = new Set<Tile>([from]),
    done = new Set<Tile>();

  while (open.size > 0) {
    let current: Tile | null = null;

    open.forEach((tile: Tile): void => {
      if (current === null || costs.get(tile)! < costs.get(current)!) {
        current = tile;
      }
    });

    const tile = current as unknown as Tile;

    if (tile === to) {
      const squares: Tile[] = [];

      for (let step = previous.get(to); step && step !== from; ) {
        squares.unshift(step);
        step = previous.get(step);
      }

      return squares;
    }

    open.delete(tile);
    done.add(tile);

    tile.getNeighbours().forEach((neighbour: Tile): void => {
      if (
        done.has(neighbour) ||
        !neighbour.isLand() ||
        (neighbour !== to && isCityTile(dependencies, neighbour)) ||
        neighbour.distanceFrom(from) + neighbour.distanceFrom(to) > limit
      ) {
        return;
      }

      // Of equally cheap ways, the straightest: a step off the straight line costs a little more.
      const cost =
        costs.get(tile)! +
        stepCost(dependencies, tile, neighbour) +
        STRAIGHTNESS *
          (neighbour.distanceFrom(from) +
            neighbour.distanceFrom(to) -
            from.distanceFrom(to));

      if (!costs.has(neighbour) || cost < costs.get(neighbour)!) {
        costs.set(neighbour, cost);
        previous.set(neighbour, tile);
        open.add(neighbour);
      }
    });
  }

  return [];
};

// Each turn's squares on the routes between each player's cities.
const routesCache: WeakMap<Player, [number, Set<Tile>]> = new WeakMap();

const routeTiles = (dependencies: Dependencies, player: Player): Set<Tile> => {
  const turn = dependencies.turn.value(),
    cached = routesCache.get(player);

  if (cached && cached[0] === turn) {
    return cached[1];
  }

  const cities = dependencies.cityRegistry.getByPlayer(player),
    linked = new Set<string>(),
    tiles = new Set<Tile>();

  cities.forEach((city: City, index: number): void =>
    cities
      .map((other: City, otherIndex: number): [City, number] => [
        other,
        otherIndex,
      ])
      .filter(
        ([other]): boolean =>
          other !== city &&
          other.tile().distanceFrom(city.tile()) <= ROUTE_DISTANCE
      )
      .sort(
        ([a], [b]): number =>
          a.tile().distanceFrom(city.tile()) -
          b.tile().distanceFrom(city.tile())
      )
      .slice(0, ROUTE_LINKS)
      .forEach(([other, otherIndex]): void => {
        const key = [index, otherIndex].sort((a, b) => a - b).join(':');

        if (linked.has(key)) {
          return;
        }

        linked.add(key);

        route(dependencies, city.tile(), other.tile()).forEach(
          (tile: Tile): void => {
            tiles.add(tile);
          }
        );
      })
  );

  routesCache.set(player, [turn, tiles]);

  return tiles;
};

// The jobs on a route square for the route alone (civ-clone/web-renderer#384): a Road, then a Railroad once the
//  player knows how.
const routeJobs = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): TerrainJobValue[] => {
  if (!hasImprovement(dependencies, tile, 'road')) {
    return [
      {
        improvement: 'road',
        value: ROUTE,
        turns: terrainJobTurns(BuildRoad, tile.terrain()) ?? 1,
      },
    ];
  }

  return knowsRailroad(dependencies, player) &&
    !hasImprovement(dependencies, tile, 'railroad')
    ? [
        {
          improvement: 'railroad',
          value: ROUTE,
          turns: terrainJobTurns(BuildRailroad, tile.terrain()) ?? 1,
        },
      ]
    : [];
};

// Cleaning up pollution (civ-clone/web-renderer#366): a polluted square is worth what the pollution takes from it (half
//  of each of its yields, by Civ1's rule), weighed for the city as any other job, plus `POLLUTED` for the square
//  itself and `POLLUTION_SPREAD` for each other polluted square of the player's: the more there are, the nearer global
//  warming (civ-clone/web-renderer#365). All of it times how much the player's leader minds pollution
//  (`PollutionConcern`).
const POLLUTED = 1;
const POLLUTION_SPREAD = 0.25;

const isPolluted = (dependencies: Dependencies, tile: Tile): boolean =>
  dependencies.tileImprovementRegistry
    .getByTile(tile)
    .some(
      (improvement: TileImprovement): boolean =>
        improvement instanceof Pollution
    );

// Each turn's count of polluted squares around each player's cities.
const pollutedCache: WeakMap<Player, [number, number]> = new WeakMap();

const pollutedCount = (dependencies: Dependencies, player: Player): number => {
  const turn = dependencies.turn.value(),
    cached = pollutedCache.get(player);

  if (cached && cached[0] === turn) {
    return cached[1];
  }

  const count = new Set<Tile>(
    dependencies.cityRegistry
      .getByPlayer(player)
      .flatMap((city: City): Tile[] => city.tiles().entries())
      .filter((tile: Tile): boolean => isPolluted(dependencies, tile))
  ).size;

  pollutedCache.set(player, [turn, count]);

  return count;
};

const pollutionJobs = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile,
  weights: Weights,
  factor: number
): TerrainJobValue[] => {
  if (!isPolluted(dependencies, tile)) {
    return [];
  }

  const [food, shields, trade] = reduceYields(
      tile
        .yields(player)
        .filter((tileYield: Yield): boolean =>
          tileYield
            .values()
            .some(([, provider]): boolean => provider === Pollution.name)
        ),
      Food,
      Production,
      Trade
    ),
    lost = { food: -food, shields: -shields, trade: -trade };

  return [
    {
      improvement: 'cleanPollution',
      action: 'cleanPollution',
      value:
        product(dependencies.ruleRegistry, PollutionConcern, player) *
        (factor * worth(lost, weights) +
          POLLUTED +
          POLLUTION_SPREAD *
            Math.max(0, pollutedCount(dependencies, player) - 1)),
      turns: terrainJobTurns(CleanPollution, tile.terrain()) ?? 1,
    },
  ];
};

// Each turn's tiles a worker of each player may be sent to: its cities' tiles, the tiles next to any of them that
//  could carry water to one worth irrigating that has none (civ-clone/web-renderer#426), and the squares on the routes
//  between its cities (civ-clone/web-renderer#384), which can be outside every city's tiles.
const tilesCache: WeakMap<Player, [number, Tile[]]> = new WeakMap();

// Civ1's terrain jobs for `TerrainWork`: irrigation, mines, roads, and railroads on roads once the player has the
//  Railroad advance, where they add food, shields or trade, weighed by what the city that works (or could work) the
//  tile is short of, for a worker's turns of work. Irrigation comes first, the more so for a city short of food
//  (civ-clone/web-renderer#383); Jungle, Swamp and Forest are cleared where that pays (civ-clone/web-renderer#353,
//  #386), and Forest planted where a city has food to spare and no water is near (civ-clone/web-renderer#428); a
//  tile that could carry water to a neighbour worth irrigating is worth part of that irrigation too, Hills with no mine
//  among them (civ-clone/web-renderer#426, #428); a square on a route between cities is worth a Road and a Railroad
//  (civ-clone/web-renderer#384), and once the player knows Railroad a Road is worth the Railroad it allows
//  (civ-clone/web-renderer#385); and pollution is cleaned up (civ-clone/web-renderer#366).
export const civ1TerrainPolicy: TerrainPolicy = {
  jobs: (dependencies, player, tile) => {
    const found = cityFor(dependencies, player, tile),
      chain = chainWorth(dependencies, player, tile),
      onRoute = routeTiles(dependencies, player).has(tile);

    // A tile no city of the player's could work is only worth what it would carry water to, and its route.
    if (!found) {
      const routed = onRoute ? routeJobs(dependencies, player, tile) : [];

      if (chain <= 0) {
        return routed;
      }

      if (tile.terrain() instanceof Forest) {
        return [
          {
            improvement: 'clearForest',
            action: 'clearForest',
            value: chain,
            turns:
              (terrainJobTurns(ClearForest, tile.terrain()) ?? 1) +
              (terrainJobTurns(BuildIrrigation, new Plains()) ?? 0),
          },
          ...routed,
        ];
      }

      return hasImprovement(dependencies, tile, 'irrigation')
        ? routed
        : [
            {
              improvement: 'irrigation',
              value: chain,
              turns: terrainJobTurns(BuildIrrigation, tile.terrain()) ?? 1,
            },
            ...routed,
          ];
    }

    const [city, worked] = found,
      factor = worked ? 1 : UNWORKED,
      weights = weightsFor(dependencies, city),
      has = (improvement: Improvement): boolean =>
        hasImprovement(dependencies, tile, improvement);

    return [
      ...(['irrigation', 'mine', 'railroad', 'road'] as Improvement[])
        .filter(
          (improvement: Improvement): boolean =>
            !has(improvement) &&
            (improvement !== 'railroad' ||
              (has('road') && knowsRailroad(dependencies, player))) &&
            // Irrigation that's the only water a neighbour worth irrigating could have stays until it's irrigated, and
            //  a dry tile that water could reach isn't mined first if irrigating it would be worth more.
            (improvement !== 'mine' ||
              (has('irrigation')
                ? !onlyWaterFor(dependencies, player, tile)
                : waterBeside(dependencies, tile) ||
                  !couldHaveWater(dependencies, tile) ||
                  IRRIGATION *
                    worth(
                      gainOf(dependencies, player, tile, 'irrigation'),
                      weights
                    ) <=
                    worth(gainOf(dependencies, player, tile, 'mine'), weights)))
        )
        .map((improvement: Improvement): TerrainJobValue => {
          const replaced = replaces[improvement],
            gain = add(
              gainOf(dependencies, player, tile, improvement),
              replaced && has(replaced)
                ? gainOf(dependencies, player, tile, replaced)
                : {},
              -1
            ),
            turns =
              terrainJobTurns(workActions[improvement], tile.terrain()) ?? 1,
            // A Road is worth the Railroad it allows, once the player knows how, for the turns of both.
            railroad =
              improvement === 'road' && knowsRailroad(dependencies, player)
                ? factor *
                  worth(railroadGain(dependencies, player, tile), weights)
                : 0;

          return {
            improvement,
            value:
              factor *
                worth(gain, weights) *
                (improvement === 'irrigation' ? IRRIGATION : 1) +
              (improvement === 'irrigation' ? chain : 0) +
              ((improvement === 'road' || improvement === 'railroad') && onRoute
                ? ROUTE
                : 0) +
              railroad,
            turns:
              turns +
              (railroad > 0
                ? terrainJobTurns(BuildRailroad, tile.terrain()) ?? 0
                : 0),
          };
        }),
      ...conversionJobs(dependencies, player, tile, weights, worked),
      ...(worked
        ? plantingJobs(dependencies, player, tile, city, weights)
        : []),
      ...pollutionJobs(dependencies, player, tile, weights, factor),
    ].filter(({ value }: TerrainJobValue): boolean => value > 0);
  },
  tiles: (dependencies, player) => {
    const turn = dependencies.turn.value(),
      cached = tilesCache.get(player);

    if (cached && cached[0] === turn) {
      return cached[1];
    }

    const cityTiles = new Set<Tile>(
        dependencies.cityRegistry
          .getByPlayer(player)
          .flatMap((city: City): Tile[] => city.tiles().entries())
      ),
      tiles = new Set<Tile>(cityTiles);

    cityTiles.forEach((tile: Tile): void => {
      if (
        !tile.isLand() ||
        !irrigable(terrainTypeOf(tile)) ||
        waterBeside(dependencies, tile)
      ) {
        return;
      }

      tile.getAdjacent().forEach((neighbour: Tile): void => {
        if (
          !cityTiles.has(neighbour) &&
          couldCarryWater(dependencies, neighbour)
        ) {
          tiles.add(neighbour);
        }
      });
    });

    routeTiles(dependencies, player).forEach((tile: Tile): void => {
      tiles.add(tile);
    });

    const list = [...tiles];

    tilesCache.set(player, [turn, list]);

    return list;
  },
  // One for every six cities. These don't count towards the Settlers a player builds for founding cities
  //  (`isFoundingSettlers` in `buildItemInCity`); any more on terrain jobs do. While they all counted, players founded a
  //  city fewer by turn 300 with one for every six, and three fewer with one for every three. Without them counting, and
  //  with Roads between cities to build, one for every six gave more trade, irrigation, Roads and linked cities than one
  //  for every eight on one set of seeds, and more linked cities on another, with nothing worse; one for every four
  //  founded fewer cities (civ-clone/web-renderer#234).
  workersWanted: (dependencies, player) =>
    Math.floor(dependencies.cityRegistry.getByPlayer(player).length / 6),
};
