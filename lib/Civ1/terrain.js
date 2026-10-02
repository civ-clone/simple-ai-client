"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1TerrainPolicy = exports.shouldRoad = exports.shouldMine = exports.shouldIrrigate = exports.shouldBuildCity = exports.isACityTile = void 0;
// Civ1: which tiles are worth a city, irrigation, a mine or a road, judged by Civ1's terrain and yields, and what
//  each terrain job is worth (`civ1TerrainPolicy`, civ-clone/web-renderer#234).
const Terrains_1 = require("@civ-clone/civ1-world/Terrains");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const Yields_1 = require("@civ-clone/civ1-world/Yields");
const TerrainFeatures_1 = require("@civ-clone/civ1-world/TerrainFeatures");
const TileImprovements_1 = require("@civ-clone/civ1-world/TileImprovements");
const Yields_2 = require("@civ-clone/library-city/Yields");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const movementCost_1 = require("@civ-clone/civ1-unit/Rules/Unit/movementCost");
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
    road: TileImprovements_1.Road,
};
// A worker's turns of work for each improvement, times the terrain's movement cost (`civ1-unit`'s `MovementCost`).
const workTurns = {
    irrigation: 2,
    mine: 3,
    road: 1,
};
// How much a point of food, a shield and a point of trade are worth to a city, and `SHORT` times as much for food or
//  shields when the city has at most 1 to spare.
const FOOD = 2;
const SHIELDS = 1.5;
const TRADE = 1;
const SHORT = 1.5;
// What improving a tile the city doesn't work yet is worth, against one it does.
const UNWORKED = 0.5;
// Worked out once a turn for each city: `city.yields()` isn't cheap.
const weightsCache = new WeakMap();
const weightsFor = (dependencies, city) => {
    const turn = dependencies.turn.value(), cached = weightsCache.get(city);
    if (cached && cached[0] === turn) {
        return cached[1];
    }
    const yields = city.yields(), weights = {
        food: FOOD * ((0, reduceYields_1.reduceYield)(yields, Yields_2.Food) <= 1 ? SHORT : 1),
        shields: SHIELDS * ((0, reduceYields_1.reduceYield)(yields, Yields_2.Production) <= 1 ? SHORT : 1),
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
// What `improvement` adds to `tile` under `player`'s government, if anything.
const gainOf = (dependencies, player, tile, improvement) => {
    const government = dependencies.playerGovernmentRegistry.getByPlayer(player), advanced = government.is(Governments_1.Monarchy, Governments_1.Communism, Governments_1.Republic, Governments_1.Democracy), republic = government.is(Governments_1.Republic, Governments_1.Democracy), row = gains.find(([rowImprovement, TerrainType]) => rowImprovement === improvement && tile.terrain() instanceof TerrainType);
    if (!row) {
        return {};
    }
    const [, , always, ifAdvanced, ifRepublic] = row;
    return add(add(always, advanced ? ifAdvanced : {}), republic ? ifRepublic : {});
};
// Civ1's terrain jobs for `TerrainWork`: irrigation, mines and roads where they add food, shields or trade, weighed by
//  what the city that works (or could work) the tile is short of, for a worker's turns of work.
exports.civ1TerrainPolicy = {
    jobs: (dependencies, player, tile) => {
        var _a;
        const workedTile = dependencies.workedTileRegistry.getByTile(tile), workedBy = workedTile && workedTile.city().player() === player
            ? workedTile.city()
            : null, city = workedBy !== null && workedBy !== void 0 ? workedBy : dependencies.cityRegistry
            .getByPlayer(player)
            .filter((city) => city.tiles().includes(tile))
            .sort((a, b) => a.tile().distanceFrom(tile) - b.tile().distanceFrom(tile))[0];
        if (!city) {
            return [];
        }
        const existing = dependencies.tileImprovementRegistry.getByTile(tile), has = (improvement) => existing.some((tileImprovement) => tileImprovement instanceof improvementTypes[improvement]), weights = weightsFor(dependencies, city), cost = (_a = (0, movementCost_1.terrainMovementCost)(tile.terrain())) !== null && _a !== void 0 ? _a : 1;
        return ['irrigation', 'mine', 'road']
            .filter((improvement) => !has(improvement))
            .map((improvement) => {
            var _a, _b, _c;
            const replaced = replaces[improvement], gain = add(gainOf(dependencies, player, tile, improvement), replaced && has(replaced)
                ? gainOf(dependencies, player, tile, replaced)
                : {}, -1);
            return {
                improvement,
                value: (workedBy ? 1 : UNWORKED) *
                    (((_a = gain.food) !== null && _a !== void 0 ? _a : 0) * weights.food +
                        ((_b = gain.shields) !== null && _b !== void 0 ? _b : 0) * weights.shields +
                        ((_c = gain.trade) !== null && _c !== void 0 ? _c : 0) * weights.trade),
                turns: workTurns[improvement] * cost,
            };
        })
            .filter(({ value }) => value > 0);
    },
    // One for every eight cities. These don't count towards the Settlers a player builds for founding cities
    //  (`isFoundingSettlers` in `buildItemInCity`); any more on terrain jobs do. While they all counted, players founded a
    //  city fewer by turn 300 with one for every six, and three fewer with one for every three. Without them counting, one
    //  for every four or six gave more improved tiles but no more trade or population, and one for every four explored
    //  less (civ-clone/web-renderer#234).
    workersWanted: (dependencies, player) => Math.floor(dependencies.cityRegistry.getByPlayer(player).length / 8),
};
//# sourceMappingURL=terrain.js.map