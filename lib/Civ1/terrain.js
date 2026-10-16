"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1TerrainPolicy = exports.shouldRoad = exports.shouldMine = exports.shouldIrrigate = exports.shouldBuildCity = exports.surroundingArea = exports.isACityTile = void 0;
// Civ1: which tiles are worth a city, irrigation, a mine or a road, judged by Civ1's terrain and yields, and what
//  each terrain job is worth (`civ1TerrainPolicy`, civ-clone/web-renderer#234), railroads included
//  (civ-clone/web-renderer#349), and clearing or planting terrain and carrying water to a dry tile
//  (civ-clone/web-renderer#353, #383, #386, #426).
const Terrains_1 = require("@civ-clone/civ1-world/Terrains");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const Yields_1 = require("@civ-clone/civ1-world/Yields");
const TerrainFeatures_1 = require("@civ-clone/civ1-world/TerrainFeatures");
const TileImprovements_1 = require("@civ-clone/civ1-world/TileImprovements");
const Yields_2 = require("@civ-clone/library-city/Yields");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const Actions_1 = require("@civ-clone/civ1-unit/Actions");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const movementCost_1 = require("@civ-clone/civ1-unit/Rules/Unit/movementCost");
const isACityTile = (dependencies, player, tile) => dependencies.cityRegistry
    .getByPlayer(player)
    .some((city) => city.tiles().includes(tile));
exports.isACityTile = isACityTile;
// The tiles around each tile, by radius, as `Tile#getSurroundingArea` lists them. The survey asks whether every tile the
//  player knows would make a good city site, every turn, and building a `Tileset` for each of them (two, for those that
//  score well enough) was the larger part of the survey's time (civ-clone/web-renderer#317). The tiles around a tile
//  are fixed by the shape of the map, so each tile's are listed once; what's on them is still read afresh each time.
//  The lists are shared, so not for changing.
const surroundingAreas = new Map();
const surroundingArea = (tile, radius) => {
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
exports.surroundingArea = surroundingArea;
const citySiteWeights = [
    [Yields_1.Food, 4],
    [Yields_1.Production, 2],
    [Yields_1.Trade, 1],
];
// Each tile's `score` as a city site's surroundings weigh it, for each player, kept with the yields it was worked out
//  from: every candidate site within two tiles asks for it again. `Tile#yields` keeps the same list until something
//  that changes them (an improvement, a government, what the player can see) clears it, and the score is worked out
//  afresh from the new one.
const citySiteScores = new WeakMap();
const citySiteScore = (tile, player) => {
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
        // As `Tileset#score` adds them up, in the same order.
        (0, exports.surroundingArea)(tile, 2).reduce((total, tile) => total + citySiteScore(tile, player), 0) >= 160 &&
        !(0, exports.surroundingArea)(tile, 4).some((tile) => dependencies.cityRegistry.getByTile(tile) !== null));
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
const gains = [
    // [improvement, terrain, any government, advanced, republic]
    ['irrigation', Terrains_1.Desert, { food: 1 }, {}, {}],
    ['irrigation', Terrains_1.Grassland, {}, { food: 1 }, {}],
    ['irrigation', Terrains_1.Hills, { food: 1 }, {}, {}],
    ['irrigation', Terrains_1.Plains, { food: 1 }, {}, {}],
    ['irrigation', Terrains_1.River, {}, { food: 1 }, {}],
    ['mine', Terrains_1.Desert, { shields: 1 }, { shields: 1 }, {}],
    ['mine', Terrains_1.Hills, { shields: 2 }, { shields: 1 }, {}],
    ['mine', Terrains_1.Mountains, { shields: 1 }, { shields: 1 }, {}],
    ['road', Terrains_1.Desert, { trade: 1 }, {}, { trade: 1 }],
    ['road', Terrains_1.Grassland, { trade: 1 }, {}, { trade: 1 }],
    ['road', Terrains_1.Plains, { trade: 1 }, {}, { trade: 1 }],
];
// The improvement each one replaces: a mine and irrigation can't share a tile.
const replaces = {
    irrigation: 'mine',
    mine: 'irrigation',
};
const improvementTypes = {
    irrigation: TileImprovements_1.Irrigation,
    mine: TileImprovements_1.Mine,
    railroad: TileImprovements_1.Railroad,
    road: TileImprovements_1.Road,
};
// The worker's action for each improvement, whose turns of work come from `civ1-unit`'s `terrainJobTurns`.
const workActions = {
    irrigation: Actions_1.BuildIrrigation,
    mine: Actions_1.BuildMine,
    railroad: Actions_1.BuildRailroad,
    road: Actions_1.BuildRoad,
};
const conversions = [
    ['clearForest', Actions_1.ClearForest, [Terrains_1.Forest], Terrains_1.Plains],
    ['clearJungle', Actions_1.ClearJungle, [Terrains_1.Jungle], Terrains_1.Grassland],
    ['clearSwamp', Actions_1.ClearSwamp, [Terrains_1.Swamp], Terrains_1.Grassland],
];
// Each terrain's own yields, before any feature or improvement, as `civ1-world`'s `TileYield` rules have them: what a
//  terrain change is worth is the difference.
const baseYields = [
    [Terrains_1.Forest, { food: 1, shields: 2 }],
    [Terrains_1.Grassland, { food: 2 }],
    [Terrains_1.Jungle, { food: 1 }],
    [Terrains_1.Plains, { food: 1, shields: 1 }],
    [Terrains_1.Swamp, { food: 1 }],
];
// Whether `TerrainType` is `BaseType` or one of its kind.
const isA = (TerrainType, BaseType) => TerrainType === BaseType || TerrainType.prototype instanceof BaseType;
const baseYieldsOf = (TerrainType) => {
    var _a, _b;
    return (_b = (_a = baseYields.find(([BaseType]) => isA(TerrainType, BaseType))) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : {};
};
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
// Worked out once a turn for each city: `city.yields()` isn't cheap.
const weightsCache = new WeakMap();
const weightsFor = (dependencies, city) => {
    const turn = dependencies.turn.value(), cached = weightsCache.get(city);
    if (cached && cached[0] === turn) {
        return cached[1];
    }
    const yields = city.yields(), foodSurplus = (0, reduceYields_1.reduceYield)(yields, Yields_2.Food), shieldSurplus = (0, reduceYields_1.reduceYield)(yields, Yields_2.Production), weights = {
        food: FOOD *
            (foodSurplus < FOOD_BY_SURPLUS.length
                ? FOOD_BY_SURPLUS[Math.max(0, foodSurplus)]
                : FOOD_SURPLUS),
        shields: SHIELDS * (shieldSurplus <= 1 ? SHORT : 1),
        trade: TRADE,
    };
    weightsCache.set(city, [turn, weights]);
    return weights;
};
const add = (total, gain, sign = 1) => {
    var _a, _b, _c, _d, _e, _f;
    return ({
        food: ((_a = total.food) !== null && _a !== void 0 ? _a : 0) + sign * ((_b = gain.food) !== null && _b !== void 0 ? _b : 0),
        shields: ((_c = total.shields) !== null && _c !== void 0 ? _c : 0) + sign * ((_d = gain.shields) !== null && _d !== void 0 ? _d : 0),
        trade: ((_e = total.trade) !== null && _e !== void 0 ? _e : 0) + sign * ((_f = gain.trade) !== null && _f !== void 0 ? _f : 0),
    });
};
const worth = (gain, weights) => {
    var _a, _b, _c;
    return ((_a = gain.food) !== null && _a !== void 0 ? _a : 0) * weights.food +
        ((_b = gain.shields) !== null && _b !== void 0 ? _b : 0) * weights.shields +
        ((_c = gain.trade) !== null && _c !== void 0 ? _c : 0) * weights.trade;
};
// What a railroad adds to `tile` for `player`: half of each of its yields, rounded down, as `civ1-world`'s
//  `YieldModifier` rules and v474.05 have it.
const railroadGain = (player, tile) => {
    const [food, shields, trade] = (0, reduceYields_1.reduceYields)(tile.yields(player), Yields_1.Food, Yields_1.Production, Yields_1.Trade);
    return {
        food: Math.floor(food / 2),
        shields: Math.floor(shields / 2),
        trade: Math.floor(trade / 2),
    };
};
// What `improvement` adds to a tile of `TerrainType` under `player`'s government, if anything.
const gainOn = (dependencies, player, TerrainType, improvement) => {
    const government = dependencies.playerGovernmentRegistry.getByPlayer(player), advanced = government.is(Governments_1.Monarchy, Governments_1.Communism, Governments_1.Republic, Governments_1.Democracy), republic = government.is(Governments_1.Republic, Governments_1.Democracy), row = gains.find(([rowImprovement, RowTerrain]) => rowImprovement === improvement && isA(TerrainType, RowTerrain));
    if (!row) {
        return {};
    }
    const [, , always, ifAdvanced, ifRepublic] = row;
    return add(add(always, advanced ? ifAdvanced : {}), republic ? ifRepublic : {});
};
const terrainTypeOf = (tile) => tile.terrain().constructor;
// What `improvement` adds to `tile` under `player`'s government, if anything.
const gainOf = (dependencies, player, tile, improvement) => improvement === 'railroad'
    ? railroadGain(player, tile)
    : gainOn(dependencies, player, terrainTypeOf(tile), improvement);
// Whether the player has the Railroad advance.
const knowsRailroad = (dependencies, player) => dependencies.playerResearchRegistry
    .getBy('player', player)
    .some((research) => research.completed(Advances_1.Railroad));
const hasImprovement = (dependencies, tile, improvement) => dependencies.tileImprovementRegistry
    .getByTile(tile)
    .some((tileImprovement) => tileImprovement instanceof improvementTypes[improvement]);
const hasFeature = (dependencies, tile) => dependencies.terrainFeatureRegistry.getByTerrain(tile.terrain()).length > 0;
const isCityTile = (dependencies, tile) => dependencies.cityRegistry.getByTile(tile) !== null;
// Whether `tile` could be irrigated as far as water goes, as `civ1-unit`'s `BuildIrrigation` rule has it: it's a River,
//  or a River, water or an irrigated tile with no city on it is next to it, north, east, south or west.
const waterBeside = (dependencies, tile) => tile.terrain() instanceof Terrains_1.River ||
    tile
        .getAdjacent()
        .some((neighbour) => neighbour.terrain() instanceof Terrains_1.River ||
        neighbour.isWater() ||
        (hasImprovement(dependencies, neighbour, 'irrigation') &&
            !isCityTile(dependencies, neighbour)));
// Whether irrigation gives a tile of `TerrainType` anything, under any government.
const irrigable = (TerrainType) => gains.some(([improvement, RowTerrain]) => improvement === 'irrigation' && isA(TerrainType, RowTerrain));
// Whether `tile` could carry water to a neighbour, once irrigated: it has water beside it and is irrigable, or a Forest
//  with no feature that would be Plains once cleared (civ-clone/web-renderer#426). Not Hills: irrigating them to carry
//  water took workers from their mines, and the arena had fewer mines and no more food for it.
const couldCarryWater = (dependencies, tile) => tile.isLand() &&
    !isCityTile(dependencies, tile) &&
    !(tile.terrain() instanceof Terrains_1.Hills) &&
    waterBeside(dependencies, tile) &&
    (irrigable(terrainTypeOf(tile)) ||
        (tile.terrain() instanceof Terrains_1.Forest && !hasFeature(dependencies, tile)));
// The city of the player's that works `tile`, and whether it works it, or else the nearest of its cities that could.
const cityFor = (dependencies, player, tile) => {
    const workedTile = dependencies.workedTileRegistry.getByTile(tile);
    if (workedTile && workedTile.city().player() === player) {
        return [workedTile.city(), true];
    }
    const city = dependencies.cityRegistry
        .getByPlayer(player)
        .filter((city) => city.tiles().includes(tile))
        .sort((a, b) => a.tile().distanceFrom(tile) - b.tile().distanceFrom(tile))[0];
    return city ? [city, false] : null;
};
// What irrigating `tile` is worth to the city that works (or could work) it, if anything, whether or not it has water
//  beside it yet: 0 for a tile already irrigated, or that no city of the player's could work.
const irrigationWorth = (dependencies, player, tile) => {
    if (isCityTile(dependencies, tile) ||
        hasImprovement(dependencies, tile, 'irrigation')) {
        return 0;
    }
    const found = cityFor(dependencies, player, tile);
    if (!found) {
        return 0;
    }
    const [city, worked] = found, weights = weightsFor(dependencies, city), gain = add(gainOf(dependencies, player, tile, 'irrigation'), hasImprovement(dependencies, tile, 'mine')
        ? gainOf(dependencies, player, tile, 'mine')
        : {}, -1);
    return Math.max(0, (worked ? 1 : UNWORKED) * IRRIGATION * worth(gain, weights));
};
// The tiles next to `tile`, north, east, south or west, that would be worth irrigating but have no water beside them:
//  irrigating `tile` (or clearing it to irrigate it) would let them have it (civ-clone/web-renderer#426).
const dryNeighbours = (dependencies, player, tile) => tile
    .getAdjacent()
    .filter((neighbour) => neighbour.isLand() &&
    irrigable(terrainTypeOf(neighbour)) &&
    !waterBeside(dependencies, neighbour) &&
    irrigationWorth(dependencies, player, neighbour) > 0);
// What carrying water to its dry neighbours is worth from `tile`, as a share of what irrigating them is worth.
const chainWorth = (dependencies, player, tile) => couldCarryWater(dependencies, tile)
    ? CHAIN *
        dryNeighbours(dependencies, player, tile).reduce((total, neighbour) => total + irrigationWorth(dependencies, player, neighbour), 0)
    : 0;
// Whether `tile`'s irrigation is the only water a neighbour that's still worth irrigating could have: it isn't to be
//  mined until that neighbour is irrigated.
const onlyWaterFor = (dependencies, player, tile) => tile.getAdjacent().some((neighbour) => neighbour.isLand() &&
    irrigable(terrainTypeOf(neighbour)) &&
    irrigationWorth(dependencies, player, neighbour) > 0 &&
    !(neighbour.terrain() instanceof Terrains_1.River) &&
    neighbour
        .getAdjacent()
        .filter((source) => source.terrain() instanceof Terrains_1.River ||
        source.isWater() ||
        (hasImprovement(dependencies, source, 'irrigation') &&
            !isCityTile(dependencies, source)))
        .every((source) => source === tile));
// Whether `tile` could ever have water for irrigation: beside it now, or through a neighbour that could carry it.
const couldHaveWater = (dependencies, tile) => waterBeside(dependencies, tile) ||
    tile
        .getAdjacent()
        .some((neighbour) => couldCarryWater(dependencies, neighbour));
// The terrain changes worth making to `tile` (civ-clone/web-renderer#353, #386): Jungle and Swamp with no feature cleared
//  to Grassland on a tile the city works, as only a tile worked for a long time repays 15 turns of work; and Forest with
//  no feature cleared to Plains only when the Plains could then be irrigated (it has water beside it), with that
//  irrigation counted in, on a tile the city works or one that would carry water on to a tile worth irrigating.
const conversionJobs = (dependencies, player, tile, weights, worked) => {
    if (hasFeature(dependencies, tile)) {
        return [];
    }
    const water = waterBeside(dependencies, tile), chain = chainWorth(dependencies, player, tile);
    return conversions
        .filter(([, , from]) => from.some((FromType) => tile.terrain() instanceof FromType))
        .flatMap(([job, Action, , To]) => {
        var _a, _b, _c;
        if ((job === 'clearForest' && !water) ||
            (!worked && (job !== 'clearForest' || chain <= 0))) {
            return [];
        }
        const turns = (_a = (0, movementCost_1.terrainJobTurns)(Action, tile.terrain())) !== null && _a !== void 0 ? _a : 1, 
        // Irrigating the new terrain afterwards, where it could be.
        then = water && irrigable(To)
            ? gainOn(dependencies, player, To, 'irrigation')
            : {}, thenTurns = ((_b = then.food) !== null && _b !== void 0 ? _b : 0) > 0
            ? (_c = (0, movementCost_1.terrainJobTurns)(Actions_1.BuildIrrigation, new To())) !== null && _c !== void 0 ? _c : 0
            : 0, gain = add(add(baseYieldsOf(To), baseYieldsOf(terrainTypeOf(tile)), -1), then), value = (worked ? 1 : UNWORKED) * worth(gain, weights) +
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
// Each turn's tiles a worker of each player may be sent to: its cities' tiles, and the tiles next to any of them that
//  could carry water to one worth irrigating that has none (civ-clone/web-renderer#426), which can be outside every
//  city's tiles.
const tilesCache = new WeakMap();
// Civ1's terrain jobs for `TerrainWork`: irrigation, mines, roads, and railroads on roads once the player has the
//  Railroad advance, where they add food, shields or trade, weighed by what the city that works (or could work) the
//  tile is short of, for a worker's turns of work. Irrigation comes first, the more so for a city short of food
//  (civ-clone/web-renderer#383); Jungle, Swamp and Forest are cleared where that pays (civ-clone/web-renderer#353,
//  #386); and a tile that could carry water to a neighbour worth irrigating is worth part
//  of that irrigation too (civ-clone/web-renderer#426).
exports.civ1TerrainPolicy = {
    jobs: (dependencies, player, tile) => {
        var _a, _b, _c;
        const found = cityFor(dependencies, player, tile), chain = chainWorth(dependencies, player, tile);
        // A tile no city of the player's could work is only worth what it would carry water to.
        if (!found) {
            if (chain <= 0) {
                return [];
            }
            if (tile.terrain() instanceof Terrains_1.Forest) {
                return [
                    {
                        improvement: 'clearForest',
                        action: 'clearForest',
                        value: chain,
                        turns: ((_a = (0, movementCost_1.terrainJobTurns)(Actions_1.ClearForest, tile.terrain())) !== null && _a !== void 0 ? _a : 1) +
                            ((_b = (0, movementCost_1.terrainJobTurns)(Actions_1.BuildIrrigation, new Terrains_1.Plains())) !== null && _b !== void 0 ? _b : 0),
                    },
                ];
            }
            return hasImprovement(dependencies, tile, 'irrigation')
                ? []
                : [
                    {
                        improvement: 'irrigation',
                        value: chain,
                        turns: (_c = (0, movementCost_1.terrainJobTurns)(Actions_1.BuildIrrigation, tile.terrain())) !== null && _c !== void 0 ? _c : 1,
                    },
                ];
        }
        const [city, worked] = found, factor = worked ? 1 : UNWORKED, weights = weightsFor(dependencies, city), has = (improvement) => hasImprovement(dependencies, tile, improvement);
        return [
            ...['irrigation', 'mine', 'railroad', 'road']
                .filter((improvement) => !has(improvement) &&
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
                                worth(gainOf(dependencies, player, tile, 'irrigation'), weights) <=
                                worth(gainOf(dependencies, player, tile, 'mine'), weights))))
                .map((improvement) => {
                var _a;
                const replaced = replaces[improvement], gain = add(gainOf(dependencies, player, tile, improvement), replaced && has(replaced)
                    ? gainOf(dependencies, player, tile, replaced)
                    : {}, -1);
                return {
                    improvement,
                    value: factor *
                        worth(gain, weights) *
                        (improvement === 'irrigation' ? IRRIGATION : 1) +
                        (improvement === 'irrigation' ? chain : 0),
                    turns: (_a = (0, movementCost_1.terrainJobTurns)(workActions[improvement], tile.terrain())) !== null && _a !== void 0 ? _a : 1,
                };
            }),
            ...conversionJobs(dependencies, player, tile, weights, worked),
        ].filter(({ value }) => value > 0);
    },
    tiles: (dependencies, player) => {
        const turn = dependencies.turn.value(), cached = tilesCache.get(player);
        if (cached && cached[0] === turn) {
            return cached[1];
        }
        const cityTiles = new Set(dependencies.cityRegistry
            .getByPlayer(player)
            .flatMap((city) => city.tiles().entries())), tiles = new Set(cityTiles);
        cityTiles.forEach((tile) => {
            if (!tile.isLand() ||
                !irrigable(terrainTypeOf(tile)) ||
                waterBeside(dependencies, tile)) {
                return;
            }
            tile.getAdjacent().forEach((neighbour) => {
                if (!cityTiles.has(neighbour) &&
                    couldCarryWater(dependencies, neighbour)) {
                    tiles.add(neighbour);
                }
            });
        });
        const list = [...tiles];
        tilesCache.set(player, [turn, list]);
        return list;
    },
    // One for every eight cities. These don't count towards the Settlers a player builds for founding cities
    //  (`isFoundingSettlers` in `buildItemInCity`); any more on terrain jobs do. While they all counted, players founded a
    //  city fewer by turn 300 with one for every six, and three fewer with one for every three. Without them counting, one
    //  for every four or six gave more improved tiles but no more trade or population, and one for every four explored
    //  less (civ-clone/web-renderer#234).
    workersWanted: (dependencies, player) => Math.floor(dependencies.cityRegistry.getByPlayer(player).length / 8),
};
//# sourceMappingURL=terrain.js.map