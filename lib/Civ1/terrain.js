"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1TerrainPolicy = exports.shouldRoad = exports.shouldMine = exports.shouldIrrigate = exports.shouldBuildCity = exports.surroundingArea = exports.isACityTile = void 0;
// Civ1: which tiles are worth a city, irrigation, a mine or a road, judged by Civ1's terrain and yields, and what
//  each terrain job is worth (`civ1TerrainPolicy`, civ-clone/web-renderer#234), railroads included
//  (civ-clone/web-renderer#349), and clearing or planting terrain and carrying water to a dry tile
//  (civ-clone/web-renderer#353, #383, #386, #426, #428).
const Terrains_1 = require("@civ-clone/civ1-world/Terrains");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const Yields_1 = require("@civ-clone/civ1-world/Yields");
const terrainWork_1 = require("@civ-clone/base-strategy-terrain-work/lib/Unit/terrainWork");
const TerrainFeatures_1 = require("@civ-clone/civ1-world/TerrainFeatures");
const TileImprovements_1 = require("@civ-clone/civ1-world/TileImprovements");
const Yields_2 = require("@civ-clone/library-city/Yields");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const Actions_1 = require("@civ-clone/civ1-unit/Actions");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const governmentTileYield_1 = require("@civ-clone/civ1-world/lib/governmentTileYield");
const movementCost_1 = require("@civ-clone/civ1-unit/Rules/Unit/movementCost");
const PollutionConcern_1 = require("@civ-clone/base-leader-personality/Rules/Player/PollutionConcern");
const combine_1 = require("@civ-clone/base-leader-personality/lib/combine");
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
    ['mine', Terrains_1.Desert, { shields: 1 }, {}, {}],
    ['mine', Terrains_1.Hills, { shields: 2 }, { shields: 1 }, {}],
    ['mine', Terrains_1.Mountains, { shields: 1 }, {}, {}],
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
const surplusCache = new WeakMap();
// The food and shields `city` has to spare this turn.
const surplusFor = (dependencies, city) => {
    const turn = dependencies.turn.value(), cached = surplusCache.get(city);
    if (cached && cached[0] === turn) {
        return cached[1];
    }
    const yields = city.yields(), surplus = {
        food: (0, reduceYields_1.reduceYield)(yields, Yields_2.Food),
        shields: (0, reduceYields_1.reduceYield)(yields, Yields_2.Production),
    };
    surplusCache.set(city, [turn, surplus]);
    return surplus;
};
const weightsCache = new WeakMap();
const weightsFor = (dependencies, city) => {
    const turn = dependencies.turn.value(), cached = weightsCache.get(city);
    if (cached && cached[0] === turn) {
        return cached[1];
    }
    const { food: foodSurplus, shields: shieldSurplus } = surplusFor(dependencies, city), weights = {
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
// The providers of what the government and pollution did to a square (`civ1-world`), left out to find what it
//  yielded before them.
const governmentSteps = [governmentTileYield_1.DESPOTISM_PENALTY, governmentTileYield_1.TRADE_BONUS, TileImprovements_1.Pollution.name];
// What a railroad adds to `tile` for `player`, as `civ1-world`'s `YieldModifier` rules and v474.05 have it: half of
//  each yield as it is before the government's steps, rounded down, then those steps and pollution again
//  (civ-clone/web-renderer#401). Under Despotism, a square of 2 gains nothing: its 3 loses 1.
const railroadGain = (dependencies, player, tile) => {
    let government = null;
    try {
        government = dependencies.playerGovernmentRegistry.getByPlayer(player);
    }
    catch (e) {
        government = null;
    }
    const tileYields = tile.yields(player), polluted = isPolluted(dependencies, tile), gainOfType = (YieldType) => {
        const ofType = tileYields.filter((tileYield) => tileYield instanceof YieldType), current = (0, reduceYields_1.reduceYield)(ofType, YieldType), before = ofType
            .flatMap((tileYield) => tileYield.values())
            .filter(([, provider]) => !governmentSteps.includes(provider))
            .reduce((total, [value]) => total + value, 0), withRailroad = (0, governmentTileYield_1.governmentTileYield)(YieldType, before + Math.floor(before / 2), government);
        return (polluted ? Math.ceil(withRailroad / 2) : withRailroad) - current;
    };
    return {
        food: gainOfType(Yields_1.Food),
        shields: gainOfType(Yields_1.Production),
        trade: gainOfType(Yields_1.Trade),
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
    ? railroadGain(dependencies, player, tile)
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
//  with no feature that would be Plains once cleared (civ-clone/web-renderer#426). Hills only while they have no mine:
//  they're irrigated to carry the water and mined once the neighbour has it (`onlyWaterFor`), but a mine already there
//  isn't given up for it (civ-clone/web-renderer#428).
const couldCarryWater = (dependencies, tile) => tile.isLand() &&
    !isCityTile(dependencies, tile) &&
    !(tile.terrain() instanceof Terrains_1.Hills &&
        hasImprovement(dependencies, tile, 'mine')) &&
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
const waterNear = (dependencies, tile) => (0, exports.surroundingArea)(tile, WATER_NEAR).some((near) => near.terrain() instanceof Terrains_1.River ||
    near.isWater() ||
    (hasImprovement(dependencies, near, 'irrigation') &&
        !isCityTile(dependencies, near)));
// How many of the player's workers are planting Forest, or are on their way to, on `city`'s worked tiles other than
//  `tile`: each will take a point of food from the city and add a shield or more, which this turn's surplus doesn't
//  show yet.
const plantingsFor = (dependencies, player, city, tile) => [
    ...(0, terrainWork_1.terrainJobs)(dependencies.memoryRegistry.memoryFor(player)).values(),
].filter((job) => {
    var _a;
    return job.improvement === 'plantForest' &&
        job.tile !== tile &&
        ((_a = dependencies.workedTileRegistry.getByTile(job.tile)) === null || _a === void 0 ? void 0 : _a.city()) === city;
}).length;
const plantingJobs = (dependencies, player, tile, city, weights) => {
    var _a;
    if (!(tile.terrain() instanceof Terrains_1.Grassland || tile.terrain() instanceof Terrains_1.Plains) ||
        isCityTile(dependencies, tile) ||
        hasFeature(dependencies, tile) ||
        hasImprovement(dependencies, tile, 'irrigation') ||
        hasImprovement(dependencies, tile, 'mine') ||
        waterNear(dependencies, tile)) {
        return [];
    }
    const surplus = surplusFor(dependencies, city), planting = plantingsFor(dependencies, player, city, tile);
    if (surplus.food - planting < PLANT_FOOD ||
        surplus.shields + planting > PLANT_SHIELDS) {
        return [];
    }
    // What the square yields now, against what the Forest would: its own yields, and half of each again with a Railroad
    //  (as `railroadGain`). A Road's trade is lost, as Forest has none to add to.
    const [food, shields, trade] = (0, reduceYields_1.reduceYields)(tile.yields(player), Yields_1.Food, Yields_1.Production, Yields_1.Trade), forest = baseYieldsOf(Terrains_1.Forest), railroad = hasImprovement(dependencies, tile, 'railroad'), withRailroad = (value = 0) => value + (railroad ? Math.floor(value / 2) : 0), gain = {
        food: withRailroad(forest.food) - food,
        shields: withRailroad(forest.shields) - shields,
        trade: withRailroad(forest.trade) - trade,
    };
    return [
        {
            improvement: 'plantForest',
            action: 'plantForest',
            value: worth(gain, weights),
            turns: (_a = (0, movementCost_1.terrainJobTurns)(Actions_1.PlantForest, tile.terrain())) !== null && _a !== void 0 ? _a : 1,
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
const stepCost = (dependencies, from, to) => {
    var _a;
    if (hasImprovement(dependencies, from, 'railroad') &&
        hasImprovement(dependencies, to, 'railroad')) {
        return 0;
    }
    if (hasImprovement(dependencies, from, 'road') &&
        hasImprovement(dependencies, to, 'road')) {
        return 1 / 3;
    }
    return (_a = (0, movementCost_1.terrainMovementCost)(to.terrain())) !== null && _a !== void 0 ? _a : 3;
};
// The squares between `from` and `to` along the cheapest way over land, neither city included, or none if there's no
//  way within `ROUTE_MARGIN` of the straight line. No other city is passed through.
const route = (dependencies, from, to) => {
    const limit = from.distanceFrom(to) + 2 * ROUTE_MARGIN, costs = new Map([[from, 0]]), previous = new Map(), open = new Set([from]), done = new Set();
    while (open.size > 0) {
        let current = null;
        open.forEach((tile) => {
            if (current === null || costs.get(tile) < costs.get(current)) {
                current = tile;
            }
        });
        const tile = current;
        if (tile === to) {
            const squares = [];
            for (let step = previous.get(to); step && step !== from;) {
                squares.unshift(step);
                step = previous.get(step);
            }
            return squares;
        }
        open.delete(tile);
        done.add(tile);
        tile.getNeighbours().forEach((neighbour) => {
            if (done.has(neighbour) ||
                !neighbour.isLand() ||
                (neighbour !== to && isCityTile(dependencies, neighbour)) ||
                neighbour.distanceFrom(from) + neighbour.distanceFrom(to) > limit) {
                return;
            }
            // Of equally cheap ways, the straightest: a step off the straight line costs a little more.
            const cost = costs.get(tile) +
                stepCost(dependencies, tile, neighbour) +
                STRAIGHTNESS *
                    (neighbour.distanceFrom(from) +
                        neighbour.distanceFrom(to) -
                        from.distanceFrom(to));
            if (!costs.has(neighbour) || cost < costs.get(neighbour)) {
                costs.set(neighbour, cost);
                previous.set(neighbour, tile);
                open.add(neighbour);
            }
        });
    }
    return [];
};
// Each turn's squares on the routes between each player's cities.
const routesCache = new WeakMap();
const routeTiles = (dependencies, player) => {
    const turn = dependencies.turn.value(), cached = routesCache.get(player);
    if (cached && cached[0] === turn) {
        return cached[1];
    }
    const cities = dependencies.cityRegistry.getByPlayer(player), linked = new Set(), tiles = new Set();
    cities.forEach((city, index) => cities
        .map((other, otherIndex) => [
        other,
        otherIndex,
    ])
        .filter(([other]) => other !== city &&
        other.tile().distanceFrom(city.tile()) <= ROUTE_DISTANCE)
        .sort(([a], [b]) => a.tile().distanceFrom(city.tile()) -
        b.tile().distanceFrom(city.tile()))
        .slice(0, ROUTE_LINKS)
        .forEach(([other, otherIndex]) => {
        const key = [index, otherIndex].sort((a, b) => a - b).join(':');
        if (linked.has(key)) {
            return;
        }
        linked.add(key);
        route(dependencies, city.tile(), other.tile()).forEach((tile) => {
            tiles.add(tile);
        });
    }));
    routesCache.set(player, [turn, tiles]);
    return tiles;
};
// The jobs on a route square for the route alone (civ-clone/web-renderer#384): a Road, then a Railroad once the
//  player knows how.
const routeJobs = (dependencies, player, tile) => {
    var _a, _b;
    if (!hasImprovement(dependencies, tile, 'road')) {
        return [
            {
                improvement: 'road',
                value: ROUTE,
                turns: (_a = (0, movementCost_1.terrainJobTurns)(Actions_1.BuildRoad, tile.terrain())) !== null && _a !== void 0 ? _a : 1,
            },
        ];
    }
    return knowsRailroad(dependencies, player) &&
        !hasImprovement(dependencies, tile, 'railroad')
        ? [
            {
                improvement: 'railroad',
                value: ROUTE,
                turns: (_b = (0, movementCost_1.terrainJobTurns)(Actions_1.BuildRailroad, tile.terrain())) !== null && _b !== void 0 ? _b : 1,
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
const isPolluted = (dependencies, tile) => dependencies.tileImprovementRegistry
    .getByTile(tile)
    .some((improvement) => improvement instanceof TileImprovements_1.Pollution);
// Each turn's count of polluted squares around each player's cities.
const pollutedCache = new WeakMap();
const pollutedCount = (dependencies, player) => {
    const turn = dependencies.turn.value(), cached = pollutedCache.get(player);
    if (cached && cached[0] === turn) {
        return cached[1];
    }
    const count = new Set(dependencies.cityRegistry
        .getByPlayer(player)
        .flatMap((city) => city.tiles().entries())
        .filter((tile) => isPolluted(dependencies, tile))).size;
    pollutedCache.set(player, [turn, count]);
    return count;
};
const pollutionJobs = (dependencies, player, tile, weights, factor) => {
    var _a;
    if (!isPolluted(dependencies, tile)) {
        return [];
    }
    const [food, shields, trade] = (0, reduceYields_1.reduceYields)(tile
        .yields(player)
        .filter((tileYield) => tileYield
        .values()
        .some(([, provider]) => provider === TileImprovements_1.Pollution.name)), Yields_1.Food, Yields_1.Production, Yields_1.Trade), lost = { food: -food, shields: -shields, trade: -trade };
    return [
        {
            improvement: 'cleanPollution',
            action: 'cleanPollution',
            value: (0, combine_1.product)(dependencies.ruleRegistry, PollutionConcern_1.default, player) *
                (factor * worth(lost, weights) +
                    POLLUTED +
                    POLLUTION_SPREAD *
                        Math.max(0, pollutedCount(dependencies, player) - 1)),
            turns: (_a = (0, movementCost_1.terrainJobTurns)(Actions_1.CleanPollution, tile.terrain())) !== null && _a !== void 0 ? _a : 1,
        },
    ];
};
// Each turn's tiles a worker of each player may be sent to: its cities' tiles, the tiles next to any of them that
//  could carry water to one worth irrigating that has none (civ-clone/web-renderer#426), and the squares on the routes
//  between its cities (civ-clone/web-renderer#384), which can be outside every city's tiles.
const tilesCache = new WeakMap();
// Civ1's terrain jobs for `TerrainWork`: irrigation, mines, roads, and railroads on roads once the player has the
//  Railroad advance, where they add food, shields or trade, weighed by what the city that works (or could work) the
//  tile is short of, for a worker's turns of work. Irrigation comes first, the more so for a city short of food
//  (civ-clone/web-renderer#383); Jungle, Swamp and Forest are cleared where that pays (civ-clone/web-renderer#353,
//  #386), and Forest planted where a city has food to spare and no water is near (civ-clone/web-renderer#428); a
//  tile that could carry water to a neighbour worth irrigating is worth part of that irrigation too, Hills with no mine
//  among them (civ-clone/web-renderer#426, #428); a square on a route between cities is worth a Road and a Railroad
//  (civ-clone/web-renderer#384), and once the player knows Railroad a Road is worth the Railroad it allows
//  (civ-clone/web-renderer#385); and pollution is cleaned up (civ-clone/web-renderer#366).
exports.civ1TerrainPolicy = {
    jobs: (dependencies, player, tile) => {
        var _a, _b, _c;
        const found = cityFor(dependencies, player, tile), chain = chainWorth(dependencies, player, tile), onRoute = routeTiles(dependencies, player).has(tile);
        // A tile no city of the player's could work is only worth what it would carry water to, and its route.
        if (!found) {
            const routed = onRoute ? routeJobs(dependencies, player, tile) : [];
            if (chain <= 0) {
                return routed;
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
                    ...routed,
                ];
            }
            return hasImprovement(dependencies, tile, 'irrigation')
                ? routed
                : [
                    {
                        improvement: 'irrigation',
                        value: chain,
                        turns: (_c = (0, movementCost_1.terrainJobTurns)(Actions_1.BuildIrrigation, tile.terrain())) !== null && _c !== void 0 ? _c : 1,
                    },
                    ...routed,
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
                var _a, _b;
                const replaced = replaces[improvement], gain = add(gainOf(dependencies, player, tile, improvement), replaced && has(replaced)
                    ? gainOf(dependencies, player, tile, replaced)
                    : {}, -1), turns = (_a = (0, movementCost_1.terrainJobTurns)(workActions[improvement], tile.terrain())) !== null && _a !== void 0 ? _a : 1, 
                // A Road is worth the Railroad it allows, once the player knows how, for the turns of both.
                railroad = improvement === 'road' && knowsRailroad(dependencies, player)
                    ? factor *
                        worth(railroadGain(dependencies, player, tile), weights)
                    : 0;
                return {
                    improvement,
                    value: factor *
                        worth(gain, weights) *
                        (improvement === 'irrigation' ? IRRIGATION : 1) +
                        (improvement === 'irrigation' ? chain : 0) +
                        ((improvement === 'road' || improvement === 'railroad') && onRoute
                            ? ROUTE
                            : 0) +
                        railroad,
                    turns: turns +
                        (railroad > 0
                            ? (_b = (0, movementCost_1.terrainJobTurns)(Actions_1.BuildRailroad, tile.terrain())) !== null && _b !== void 0 ? _b : 0
                            : 0),
                };
            }),
            ...conversionJobs(dependencies, player, tile, weights, worked),
            ...(worked
                ? plantingJobs(dependencies, player, tile, city, weights)
                : []),
            ...pollutionJobs(dependencies, player, tile, weights, factor),
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
        routeTiles(dependencies, player).forEach((tile) => {
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
    workersWanted: (dependencies, player) => Math.floor(dependencies.cityRegistry.getByPlayer(player).length / 6),
};
//# sourceMappingURL=terrain.js.map