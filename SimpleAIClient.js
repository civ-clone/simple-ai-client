"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SimpleAIClient_shouldBuildCity, _SimpleAIClient_shouldIrrigate, _SimpleAIClient_shouldMine, _SimpleAIClient_shouldRoad, _SimpleAIClient_lastUnitMoves, _SimpleAIClient_unitPathData, _SimpleAIClient_unitTargetData, _SimpleAIClient_citiesToLiberate, _SimpleAIClient_enemyCitiesToAttack, _SimpleAIClient_enemyUnitsToAttack, _SimpleAIClient_goodSitesForCities, _SimpleAIClient_landTilesToExplore, _SimpleAIClient_seaTilesToExplore, _SimpleAIClient_undefendedCities, _SimpleAIClient_cityRegistry, _SimpleAIClient_cityBuildRegistry, _SimpleAIClient_cityGrowthRegistry, _SimpleAIClient_goodyHutRegistry, _SimpleAIClient_pathFinderRegistry, _SimpleAIClient_playerGovernmentRegistry, _SimpleAIClient_playerResearchRegistry, _SimpleAIClient_playerTreasuryRegistry, _SimpleAIClient_playerWorldRegistry, _SimpleAIClient_ruleRegistry, _SimpleAIClient_terrainFeatureRegistry, _SimpleAIClient_tileImprovementRegistry, _SimpleAIClient_unitImprovementRegistry, _SimpleAIClient_unitRegistry;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAIClient = void 0;
const Yields_1 = require("@civ-clone/core-unit/Yields");
const Actions_1 = require("@civ-clone/civ1-unit/Actions");
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Terrains_1 = require("@civ-clone/civ1-world/Terrains");
const Yields_2 = require("@civ-clone/civ1-world/Yields");
const Types_1 = require("@civ-clone/civ1-unit/Types");
const TerrainFeatures_1 = require("@civ-clone/civ1-world/TerrainFeatures");
const GoodyHutRegistry_1 = require("@civ-clone/core-goody-hut/GoodyHutRegistry");
const TileImprovements_1 = require("@civ-clone/civ1-world/TileImprovements");
const LeaderRegistry_1 = require("@civ-clone/core-civilization/LeaderRegistry");
const PathFinderRegistry_1 = require("@civ-clone/core-world-path/PathFinderRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const PlayerTreasuryRegistry_1 = require("@civ-clone/core-treasury/PlayerTreasuryRegistry");
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const AIClient_1 = require("@civ-clone/core-ai-client/AIClient");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
const EndTurn_1 = require("@civ-clone/base-player-action-end-turn/EndTurn");
const UnitImprovements_1 = require("@civ-clone/civ1-unit/UnitImprovements");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Path_1 = require("@civ-clone/core-world-path/Path");
const PlayerResearch_1 = require("@civ-clone/core-science/PlayerResearch");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const Tile_1 = require("@civ-clone/core-world/Tile");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const assignWorkers_1 = require("@civ-clone/civ1-city/lib/assignWorkers");
class SimpleAIClient extends AIClient_1.default {
    constructor(player, cityRegistry = CityRegistry_1.instance, cityBuildRegistry = CityBuildRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, goodyHutRegistry = GoodyHutRegistry_1.instance, leaderRegistry = LeaderRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance) {
        super(player, leaderRegistry);
        _SimpleAIClient_shouldBuildCity.set(this, (tile) => {
            const terrainFeatures = __classPrivateFieldGet(this, _SimpleAIClient_terrainFeatureRegistry, "f").getByTerrain(tile.terrain());
            return ((tile.terrain() instanceof Terrains_1.Grassland ||
                tile.terrain() instanceof Terrains_1.River ||
                tile.terrain() instanceof Terrains_1.Plains ||
                terrainFeatures.some((feature) => feature instanceof TerrainFeatures_1.Oasis) ||
                terrainFeatures.some((feature) => feature instanceof TerrainFeatures_1.Game)) &&
                tile.getSurroundingArea().score(this.player(), [
                    [Yields_2.Food, 4],
                    [Yields_2.Production, 2],
                    [Yields_2.Trade, 1],
                ]) >= 180 &&
                !tile
                    .getSurroundingArea(4)
                    .filter((tile) => __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByTile(tile).length > 0).length);
        });
        _SimpleAIClient_shouldIrrigate.set(this, (tile) => {
            return ([Terrains_1.Desert, Terrains_1.Plains, Terrains_1.Grassland, Terrains_1.River].some((TerrainType) => tile.terrain() instanceof TerrainType) &&
                // TODO: doing this a lot already, need to make improvements a value object with a helper method
                !__classPrivateFieldGet(this, _SimpleAIClient_tileImprovementRegistry, "f")
                    .getByTile(tile)
                    .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
                tile
                    .getSurroundingArea()
                    .some((tile) => __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f")
                    .getByTile(tile)
                    .some((city) => city.player() === this.player())) &&
                [...tile.getAdjacent(), tile].some((tile) => tile.terrain() instanceof Terrains_1.River ||
                    tile.isCoast() ||
                    (__classPrivateFieldGet(this, _SimpleAIClient_tileImprovementRegistry, "f")
                        .getByTile(tile)
                        .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
                        !__classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByTile(tile).length)));
        });
        _SimpleAIClient_shouldMine.set(this, (tile) => {
            return ([Terrains_1.Hills, Terrains_1.Mountains].some((TerrainType) => tile.terrain() instanceof TerrainType) &&
                !__classPrivateFieldGet(this, _SimpleAIClient_tileImprovementRegistry, "f")
                    .getByTile(tile)
                    .some((improvement) => improvement instanceof TileImprovements_1.Mine) &&
                tile
                    .getSurroundingArea()
                    .some((tile) => __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f")
                    .getByTile(tile)
                    .some((city) => city.player() === this.player())));
        });
        _SimpleAIClient_shouldRoad.set(this, (tile) => {
            return (!__classPrivateFieldGet(this, _SimpleAIClient_tileImprovementRegistry, "f")
                .getByTile(tile)
                .some((improvement) => improvement instanceof TileImprovements_1.Road) &&
                tile
                    .getSurroundingArea()
                    .some((tile) => __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f")
                    .getByTile(tile)
                    .some((city) => city.player() === this.player())));
        });
        _SimpleAIClient_lastUnitMoves.set(this, new Map());
        _SimpleAIClient_unitPathData.set(this, new Map());
        _SimpleAIClient_unitTargetData.set(this, new Map());
        // TODO: could be `City`/`Unit`s?
        _SimpleAIClient_citiesToLiberate.set(this, []);
        _SimpleAIClient_enemyCitiesToAttack.set(this, []);
        _SimpleAIClient_enemyUnitsToAttack.set(this, []);
        _SimpleAIClient_goodSitesForCities.set(this, []);
        _SimpleAIClient_landTilesToExplore.set(this, []);
        _SimpleAIClient_seaTilesToExplore.set(this, []);
        _SimpleAIClient_undefendedCities.set(this, []);
        _SimpleAIClient_cityRegistry.set(this, void 0);
        _SimpleAIClient_cityBuildRegistry.set(this, void 0);
        _SimpleAIClient_cityGrowthRegistry.set(this, void 0);
        _SimpleAIClient_goodyHutRegistry.set(this, void 0);
        _SimpleAIClient_pathFinderRegistry.set(this, void 0);
        _SimpleAIClient_playerGovernmentRegistry.set(this, void 0);
        _SimpleAIClient_playerResearchRegistry.set(this, void 0);
        _SimpleAIClient_playerTreasuryRegistry.set(this, void 0);
        _SimpleAIClient_playerWorldRegistry.set(this, void 0);
        _SimpleAIClient_ruleRegistry.set(this, void 0);
        _SimpleAIClient_terrainFeatureRegistry.set(this, void 0);
        _SimpleAIClient_tileImprovementRegistry.set(this, void 0);
        _SimpleAIClient_unitImprovementRegistry.set(this, void 0);
        _SimpleAIClient_unitRegistry.set(this, void 0);
        __classPrivateFieldSet(this, _SimpleAIClient_cityRegistry, cityRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_cityBuildRegistry, cityBuildRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_cityGrowthRegistry, cityGrowthRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_goodyHutRegistry, goodyHutRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_pathFinderRegistry, pathFinderRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_playerGovernmentRegistry, playerGovernmentRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_playerResearchRegistry, playerResearchRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_playerTreasuryRegistry, playerTreasuryRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_playerWorldRegistry, playerWorldRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_ruleRegistry, ruleRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_terrainFeatureRegistry, terrainFeatureRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_unitImprovementRegistry, unitImprovementRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_tileImprovementRegistry, tileImprovementRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_unitRegistry, unitRegistry, "f");
    }
    scoreUnitMove(unit, tile) {
        const actions = unit.actions(tile), { attack, buildIrrigation, buildMine, buildRoad, captureCity, disembark, embark, fortify, foundCity, noOrders, } = actions.reduce((object, entity) => ({
            ...object,
            [entity.constructor.name.replace(/^./, (char) => char.toLowerCase())]: entity,
        }), {});
        if (!actions.length ||
            (actions.length === 1 && noOrders) ||
            (unit instanceof Types_1.Fortifiable &&
                actions.length === 2 &&
                fortify &&
                noOrders)) {
            return -1;
        }
        let score = 0;
        const goodyHut = __classPrivateFieldGet(this, _SimpleAIClient_goodyHutRegistry, "f").getByTile(tile);
        if (goodyHut !== null) {
            score += 60;
        }
        if ((foundCity && __classPrivateFieldGet(this, _SimpleAIClient_shouldBuildCity, "f").call(this, tile)) ||
            (buildMine && __classPrivateFieldGet(this, _SimpleAIClient_shouldMine, "f").call(this, tile)) ||
            (buildIrrigation && __classPrivateFieldGet(this, _SimpleAIClient_shouldIrrigate, "f").call(this, tile)) ||
            (buildRoad && __classPrivateFieldGet(this, _SimpleAIClient_shouldRoad, "f").call(this, tile))) {
            score += 24;
        }
        const tileUnits = __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f")
            .getByTile(tile)
            .sort((a, b) => b.defence().value() - a.defence().value()), [defender] = tileUnits, ourUnitsOnTile = tileUnits.some((unit) => unit.player() === this.player());
        if (unit instanceof Types_1.NavalTransport &&
            unit.hasCapacity() &&
            tileUnits.length &&
            ourUnitsOnTile) {
            score += 10;
        }
        if (unit instanceof Types_1.NavalTransport &&
            unit.hasCargo() &&
            tile.isCoast() &&
            tile.isWater()) {
            score += 16;
        }
        if (embark) {
            score += 16;
        }
        // TODO: move to far off continents
        if (disembark /* && tile.continentId !== unit.departureContinentId*/) {
            score += 16;
        }
        if (captureCity) {
            score += 100;
        }
        // TODO: weight attacking dependent on leader's personality
        if (attack && unit.attack() > defender.defence()) {
            score += 24 * (unit.attack().value() - defender.defence().value());
        }
        if (attack && unit.attack().value() >= defender.defence().value()) {
            score += 16;
        }
        // add some jeopardy
        if (attack &&
            unit.attack().value() >= defender.defence().value() * (2 / 3)) {
            score += 8;
        }
        const playerWorld = __classPrivateFieldGet(this, _SimpleAIClient_playerWorldRegistry, "f").getByPlayer(this.player());
        const discoverableTiles = tile
            .getNeighbours()
            .filter((neighbouringTile) => !playerWorld.includes(neighbouringTile)).length;
        if (discoverableTiles > 0) {
            score += discoverableTiles * 3;
        }
        const target = __classPrivateFieldGet(this, _SimpleAIClient_unitTargetData, "f").get(unit);
        if (target instanceof Tile_1.default &&
            tile.distanceFrom(target) < unit.tile().distanceFrom(target)) {
            score += 14;
        }
        const lastMoves = __classPrivateFieldGet(this, _SimpleAIClient_lastUnitMoves, "f").get(unit) || [];
        if (!lastMoves.includes(tile)) {
            score *= 4;
        }
        return score;
    }
    moveUnit(unit) {
        let loopCheck = 0;
        while (unit.active() && unit.moves().value() >= 0.1) {
            if (loopCheck++ > 1e3) {
                console.log('SimpleAIClient#moveUnit: loopCheck: aborting');
                console.log(`${unit.player().civilization().name()} ${unit.constructor.name}`);
                console.log(unit.actions());
                console.log(unit.actionsForNeighbours());
                unit.action(new Actions_1.NoOrders(unit.tile(), unit.tile(), unit));
                return;
            }
            const path = __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").get(unit);
            if (path) {
                const target = path.shift(), [move] = unit
                    .actions(target)
                    .filter((action) => action instanceof Actions_1.Move);
                if (move) {
                    unit.action(move);
                    if (path.length === 0) {
                        __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").delete(unit);
                    }
                    return;
                }
                if (path.length > 0) {
                    const newPath = Path_1.default.for(unit, unit.tile(), path.end());
                    if (newPath) {
                        __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").set(unit, newPath);
                        // restart the loop
                        continue;
                    }
                }
                __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").delete(unit);
            }
            const [target] = unit
                .tile()
                .getNeighbours()
                .map((tile) => [
                tile,
                this.scoreUnitMove(unit, tile),
            ])
                .filter(([, score]) => score > -1)
                .sort(([, a], [, b]) => b - a ||
                // if there's no difference, sort randomly
                Math.floor(Math.random() * 3) - 1)
                .map(([tile]) => tile);
            if (!target) {
                // TODO: could do something a bit more intelligent here
                unit.action(new Actions_1.NoOrders(unit.tile(), unit.tile(), unit));
                return;
            }
            const actions = unit.actions(target), [action] = actions, lastMoves = __classPrivateFieldGet(this, _SimpleAIClient_lastUnitMoves, "f").get(unit) || [], currentTarget = __classPrivateFieldGet(this, _SimpleAIClient_unitTargetData, "f").get(unit);
            if (!action) {
                // TODO: could do something a bit more intelligent here
                unit.action(new Actions_1.NoOrders(unit.tile(), unit.tile(), unit));
                return;
            }
            if (currentTarget === target) {
                __classPrivateFieldGet(this, _SimpleAIClient_unitTargetData, "f").delete(unit);
            }
            lastMoves.push(target);
            __classPrivateFieldGet(this, _SimpleAIClient_lastUnitMoves, "f").set(unit, lastMoves.slice(-50));
            unit.action(action);
        }
        // If we're here, we still have some moves left, lets clear them up.
        // TODO: This might not be necessary, just remove all checks for >= .1 moves left...
        if (unit.moves().value() > 0) {
            unit.action(new Actions_1.NoOrders(unit.tile(), unit.tile(), unit));
        }
    }
    preProcessTurn() {
        __classPrivateFieldGet(this, _SimpleAIClient_citiesToLiberate, "f").splice(0);
        __classPrivateFieldGet(this, _SimpleAIClient_enemyCitiesToAttack, "f").splice(0);
        __classPrivateFieldGet(this, _SimpleAIClient_enemyUnitsToAttack, "f").splice(0);
        __classPrivateFieldGet(this, _SimpleAIClient_goodSitesForCities, "f").splice(0);
        __classPrivateFieldGet(this, _SimpleAIClient_landTilesToExplore, "f").splice(0);
        __classPrivateFieldGet(this, _SimpleAIClient_seaTilesToExplore, "f").splice(0);
        __classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").splice(0);
        const playerWorld = __classPrivateFieldGet(this, _SimpleAIClient_playerWorldRegistry, "f").getByPlayer(this.player());
        playerWorld.entries().forEach((tile) => {
            const [tileCity] = __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByTile(tile), tileUnits = __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f").getBy('tile', tile), existingTarget = __classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").includes(tile) &&
                ![
                    ...__classPrivateFieldGet(this, _SimpleAIClient_unitTargetData, "f").values(),
                    ...[...__classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").values()].map((path) => path.end()),
                ].includes(tile);
            if (tileCity &&
                tileCity.player() === this.player() &&
                !tileUnits.length &&
                !__classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").includes(tile) &&
                !existingTarget) {
                __classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").push(tile);
            }
            // TODO: when diplomacy exists, check diplomatic status with player
            else if (tileCity &&
                tileCity.player() !== this.player() &&
                tileCity.originalPlayer() === this.player()) {
                __classPrivateFieldGet(this, _SimpleAIClient_citiesToLiberate, "f").push(tile);
            }
            else if (tileCity &&
                tileCity.player() !== this.player() &&
                !__classPrivateFieldGet(this, _SimpleAIClient_enemyCitiesToAttack, "f").includes(tile)) {
                __classPrivateFieldGet(this, _SimpleAIClient_enemyCitiesToAttack, "f").push(tile);
            }
            else if (tileUnits.length &&
                tileUnits.some((unit) => unit.player() !== this.player()) &&
                __classPrivateFieldGet(this, _SimpleAIClient_enemyUnitsToAttack, "f").includes(tile)) {
                __classPrivateFieldGet(this, _SimpleAIClient_enemyUnitsToAttack, "f").push(tile);
            }
            else if (tile.isLand() &&
                tile
                    .getNeighbours()
                    .some((tile) => !playerWorld.includes(tile)) &&
                !__classPrivateFieldGet(this, _SimpleAIClient_landTilesToExplore, "f").includes(tile) &&
                !existingTarget) {
                __classPrivateFieldGet(this, _SimpleAIClient_landTilesToExplore, "f").push(tile);
            }
            else if (tile.isWater() &&
                tile
                    .getNeighbours()
                    .some((tile) => !playerWorld.includes(tile)) &&
                __classPrivateFieldGet(this, _SimpleAIClient_seaTilesToExplore, "f").includes(tile) &&
                !existingTarget) {
                __classPrivateFieldGet(this, _SimpleAIClient_seaTilesToExplore, "f").push(tile);
            }
            if (__classPrivateFieldGet(this, _SimpleAIClient_shouldBuildCity, "f").call(this, tile) &&
                __classPrivateFieldGet(this, _SimpleAIClient_goodSitesForCities, "f").includes(tile) &&
                !existingTarget) {
                __classPrivateFieldGet(this, _SimpleAIClient_goodSitesForCities, "f").push(tile);
            }
        });
        __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f")
            .getByPlayer(this.player())
            .forEach((city) => {
            const tileUnits = __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f").getByTile(city.tile());
            (0, assignWorkers_1.default)(city, __classPrivateFieldGet(this, _SimpleAIClient_playerWorldRegistry, "f"), __classPrivateFieldGet(this, _SimpleAIClient_cityGrowthRegistry, "f"));
            if (!tileUnits.length &&
                !__classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").includes(city.tile())) {
                __classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").push(city.tile());
            }
        });
    }
    takeTurn() {
        return new Promise((resolve, reject) => {
            try {
                let loopCheck = 0;
                this.preProcessTurn();
                const [playerGovernment] = __classPrivateFieldGet(this, _SimpleAIClient_playerGovernmentRegistry, "f").filter((playerGovernment) => playerGovernment.player() === this.player()), [playerResearch] = __classPrivateFieldGet(this, _SimpleAIClient_playerResearchRegistry, "f").filter((playerScience) => playerScience.player() === this.player());
                if (playerResearch.completed(Advances_1.Monarchy) &&
                    !playerGovernment.is(Governments_1.Monarchy)) {
                    playerGovernment.set(new Governments_1.Monarchy());
                }
                while (this.player().hasMandatoryActions()) {
                    const action = this.player().mandatoryAction(), item = action.value();
                    // TODO: Remove this when it's working as expected
                    if (loopCheck++ > 1e3) {
                        // TODO: raise warning - notification?
                        console.log('');
                        console.log('');
                        console.log(item);
                        if (item instanceof Unit_1.default) {
                            console.log(item.actions());
                            item
                                .tile()
                                .getNeighbours()
                                .forEach((tile) => console.log(item.actions(tile)));
                            console.log(item.active());
                            console.log(item.busy());
                            console.log(item.moves().value());
                            console.log(__classPrivateFieldGet(this, _SimpleAIClient_unitImprovementRegistry, "f").getByUnit(item));
                        }
                        reject(new Error("SimpleAIClient: Couldn't pick an action to do."));
                        break;
                    }
                    if (item instanceof Unit_1.default) {
                        const unit = item, tile = unit.tile(), target = __classPrivateFieldGet(this, _SimpleAIClient_unitTargetData, "f").get(unit), actions = unit.actions(), { buildIrrigation, buildMine, buildRoad, fortify, foundCity, unload, } = actions.reduce((object, entity) => ({
                            ...object,
                            [entity.constructor.name.replace(/^./, (char) => char.toLowerCase())]: entity,
                        }), {}), tileUnits = __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f").getByTile(tile), lastUnitMoves = __classPrivateFieldGet(this, _SimpleAIClient_lastUnitMoves, "f").get(unit);
                        if (!lastUnitMoves) {
                            __classPrivateFieldGet(this, _SimpleAIClient_lastUnitMoves, "f").set(unit, [unit.tile()]);
                        }
                        if (unit instanceof Types_1.NavalTransport &&
                            unload &&
                            tile.isCoast() &&
                            unit
                                .cargo()
                                .some((unit) => !tile
                                .getNeighbours()
                                .some((tile) => (__classPrivateFieldGet(this, _SimpleAIClient_lastUnitMoves, "f").get(unit) || []).includes(tile)))) {
                            unit.action(unload);
                            unit.setWaiting();
                            // skip out to allow the unloaded units to be moved.
                            continue;
                        }
                        if (unit instanceof Types_1.Worker) {
                            if (foundCity && __classPrivateFieldGet(this, _SimpleAIClient_shouldBuildCity, "f").call(this, tile)) {
                                unit.action(foundCity);
                            }
                            else if (buildIrrigation && __classPrivateFieldGet(this, _SimpleAIClient_shouldIrrigate, "f").call(this, tile)) {
                                unit.action(buildIrrigation);
                            }
                            else if (buildMine && __classPrivateFieldGet(this, _SimpleAIClient_shouldMine, "f").call(this, tile)) {
                                unit.action(buildMine);
                            }
                            else if (buildRoad && __classPrivateFieldGet(this, _SimpleAIClient_shouldRoad, "f").call(this, tile)) {
                                unit.action(buildRoad);
                            }
                            else if (!target && __classPrivateFieldGet(this, _SimpleAIClient_goodSitesForCities, "f").length) {
                                __classPrivateFieldGet(this, _SimpleAIClient_unitTargetData, "f").set(unit, __classPrivateFieldGet(this, _SimpleAIClient_goodSitesForCities, "f").shift());
                            }
                            this.moveUnit(unit);
                            continue;
                        }
                        // TODO: check for defense values and activate weaker for disband/upgrade/scouting
                        const [cityUnitWithLowerDefence] = tileUnits.filter((tileUnit) => __classPrivateFieldGet(this, _SimpleAIClient_unitImprovementRegistry, "f")
                            .getByUnit(tileUnit)
                            .some((improvement) => improvement instanceof UnitImprovements_1.Fortified) && unit.defence() > tileUnit.defence()), [city] = __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByTile(tile);
                        if (fortify &&
                            city &&
                            (cityUnitWithLowerDefence ||
                                tileUnits.length <=
                                    Math.ceil(__classPrivateFieldGet(this, _SimpleAIClient_cityGrowthRegistry, "f").getByCity(city).size() / 5))) {
                            unit.action(fortify);
                            if (cityUnitWithLowerDefence) {
                                cityUnitWithLowerDefence.activate();
                            }
                            continue;
                        }
                        if (!target) {
                            // TODO: all the repetition - sort this.
                            if (unit instanceof Types_1.Fortifiable &&
                                unit.defence().value() > 0 &&
                                __classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _SimpleAIClient_pathFinderRegistry, "f"));
                                if (path) {
                                    __classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").splice(__classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").set(unit, path);
                                }
                            }
                            else if (unit.attack().value() > 0 &&
                                __classPrivateFieldGet(this, _SimpleAIClient_citiesToLiberate, "f").length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _SimpleAIClient_citiesToLiberate, "f")
                                    .filter((tile) => unit instanceof Types_1.Land && tile.isLand())
                                    .sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _SimpleAIClient_pathFinderRegistry, "f"));
                                if (path) {
                                    __classPrivateFieldGet(this, _SimpleAIClient_citiesToLiberate, "f").splice(__classPrivateFieldGet(this, _SimpleAIClient_citiesToLiberate, "f").indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").set(unit, path);
                                }
                            }
                            else if (unit.attack().value() > 0 &&
                                __classPrivateFieldGet(this, _SimpleAIClient_enemyUnitsToAttack, "f").length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _SimpleAIClient_enemyUnitsToAttack, "f")
                                    .filter((tile) => (unit instanceof Types_1.Land && tile.isLand()) ||
                                    (unit instanceof Types_1.Naval && tile.isWater()))
                                    .sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _SimpleAIClient_pathFinderRegistry, "f"));
                                if (path) {
                                    __classPrivateFieldGet(this, _SimpleAIClient_enemyUnitsToAttack, "f").splice(__classPrivateFieldGet(this, _SimpleAIClient_enemyUnitsToAttack, "f").indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").set(unit, path);
                                }
                            }
                            else if (unit instanceof Types_1.Land &&
                                unit.attack().value() > 0 &&
                                __classPrivateFieldGet(this, _SimpleAIClient_enemyCitiesToAttack, "f").length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _SimpleAIClient_enemyCitiesToAttack, "f").sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _SimpleAIClient_pathFinderRegistry, "f"));
                                if (path) {
                                    __classPrivateFieldGet(this, _SimpleAIClient_enemyCitiesToAttack, "f").splice(__classPrivateFieldGet(this, _SimpleAIClient_enemyCitiesToAttack, "f").indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").set(unit, path);
                                }
                            }
                            else if (unit instanceof Types_1.Land &&
                                __classPrivateFieldGet(this, _SimpleAIClient_landTilesToExplore, "f").length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _SimpleAIClient_landTilesToExplore, "f").sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _SimpleAIClient_pathFinderRegistry, "f"));
                                if (path) {
                                    __classPrivateFieldGet(this, _SimpleAIClient_landTilesToExplore, "f").splice(__classPrivateFieldGet(this, _SimpleAIClient_landTilesToExplore, "f").indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").set(unit, path);
                                }
                            }
                            else if (unit instanceof Types_1.Naval &&
                                __classPrivateFieldGet(this, _SimpleAIClient_seaTilesToExplore, "f").length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _SimpleAIClient_seaTilesToExplore, "f").sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _SimpleAIClient_pathFinderRegistry, "f"));
                                if (path) {
                                    __classPrivateFieldGet(this, _SimpleAIClient_seaTilesToExplore, "f").splice(__classPrivateFieldGet(this, _SimpleAIClient_seaTilesToExplore, "f").indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").set(unit, path);
                                }
                            }
                        }
                        this.moveUnit(unit);
                        continue;
                    }
                    if (item instanceof CityBuild_1.default) {
                        this.buildItemInCity(item.city());
                        continue;
                    }
                    if (item instanceof PlayerResearch_1.default) {
                        const available = item.available();
                        if (available.length) {
                            item.research(available[Math.floor(available.length * Math.random())]);
                        }
                        continue;
                    }
                    if (action instanceof EndTurn_1.default) {
                        break;
                    }
                    console.log(`Can't process: '${item.constructor.name}'`);
                    break;
                }
                resolve();
            }
            catch (e) {
                if (typeof e === 'string') {
                    reject(new Error(e));
                    return;
                }
                if (e instanceof Error) {
                    reject(e);
                    return;
                }
                reject(new Error(`An unknown error occurred: ${e}`));
            }
        });
    }
    buildItemInCity(city) {
        const tile = city.tile(), cityBuild = __classPrivateFieldGet(this, _SimpleAIClient_cityBuildRegistry, "f").getByCity(city), tileUnits = __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f").getByTile(tile), available = cityBuild.available(), restrictions = [CityImprovements_1.Palace, Units_1.Settlers], availableFiltered = available.filter((buildItem) => !restrictions.includes(buildItem.item()) &&
            // TODO: Add auto-wonders or have more logic around this
            !Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableWonders = available.filter((buildItem) => Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableUnits = availableFiltered.filter((buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item())), randomSelection = availableFiltered[Math.floor(availableFiltered.length * Math.random())].item(), getUnitByYield = (YieldType) => {
            const [[UnitType]] = availableUnits
                .map((buildItem) => {
                const UnitType = buildItem.item(), unitYield = new YieldType();
                __classPrivateFieldGet(this, _SimpleAIClient_ruleRegistry, "f").process(Yield_1.BaseYield, UnitType, unitYield);
                return [UnitType, unitYield];
            })
                .sort(([, unitYieldA], [, unitYieldB]) => unitYieldB.value() - unitYieldA.value());
            return UnitType;
        }, getDefensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Defence)))(), getOffensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Attack)))();
        if (__classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f").getByTile(tile).length < 2 && getDefensiveUnit()) {
            cityBuild.build(getDefensiveUnit());
            return;
        }
        const cityGrowth = __classPrivateFieldGet(this, _SimpleAIClient_cityGrowthRegistry, "f").getByCity(cityBuild.city());
        // Always Build Cities
        if (available.some((buildItem) => buildItem.item() === Units_1.Settlers) &&
            !__classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f")
                .getByCity(cityBuild.city())
                .some((unit) => unit instanceof Units_1.Settlers) &&
            // TODO: use expansionist leader trait
            __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f")
                .getByPlayer(this.player())
                .filter((unit) => unit instanceof Units_1.Settlers).length < 3 &&
            cityGrowth.size() > 1) {
            cityBuild.build(Units_1.Settlers);
            return;
        }
        if (__classPrivateFieldGet(this, _SimpleAIClient_citiesToLiberate, "f").length > 0 ||
            __classPrivateFieldGet(this, _SimpleAIClient_enemyCitiesToAttack, "f").length > 0 ||
            __classPrivateFieldGet(this, _SimpleAIClient_enemyUnitsToAttack, "f").length > 4) {
            cityBuild.build(getOffensiveUnit());
            return;
        }
        if (tileUnits.filter((unit) => __classPrivateFieldGet(this, _SimpleAIClient_unitImprovementRegistry, "f")
            .getByUnit(unit)
            .filter((improvement) => improvement instanceof UnitImprovements_1.Fortified)).length < 2 ||
            __classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").length) {
            cityBuild.build(getDefensiveUnit());
            return;
        }
        // If we have resources to burn, build a wonder
        if (cityBuild
            .city()
            .yields()
            .filter((cityYield) => cityYield instanceof Yields_2.Production)
            .some((cityYield) => cityYield.value() > 4)) {
            const wonders = availableWonders.map((cityBuild) => cityBuild.item());
            cityBuild.build(wonders[Math.floor(Math.random() * wonders.length)]);
        }
        if (randomSelection) {
            cityBuild.build(randomSelection);
        }
    }
    cityLost(city, player, destroyed) {
        // Can't retaliate against ourselves, we deserved it...
        if (!player) {
            return;
        }
        const playerWorld = __classPrivateFieldGet(this, _SimpleAIClient_playerWorldRegistry, "f").getByPlayer(this.player());
        if (destroyed) {
            // REVENGE!
            __classPrivateFieldGet(this, _SimpleAIClient_enemyCitiesToAttack, "f").push(...playerWorld
                .entries()
                .filter((tile) => __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f")
                .getByTile(tile)
                .some((city) => city.player() === player)));
            __classPrivateFieldGet(this, _SimpleAIClient_enemyUnitsToAttack, "f").push(...playerWorld
                .entries()
                .filter((tile) => __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f")
                .getByTile(tile)
                .some((unit) => unit.player() === player)));
            return;
        }
        __classPrivateFieldGet(this, _SimpleAIClient_citiesToLiberate, "f").push(city.tile());
    }
    unitDestroyed(unit, player) {
        const [city] = __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByTile(unit.tile()), tileUnits = __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f").getByTile(unit.tile());
        if (city && city.player() === this.player() && tileUnits.length < 2) {
            this.buildItemInCity(city);
            __classPrivateFieldGet(this, _SimpleAIClient_playerTreasuryRegistry, "f").getByPlayer(this.player()).buy(city);
        }
    }
}
exports.SimpleAIClient = SimpleAIClient;
_SimpleAIClient_shouldBuildCity = new WeakMap(), _SimpleAIClient_shouldIrrigate = new WeakMap(), _SimpleAIClient_shouldMine = new WeakMap(), _SimpleAIClient_shouldRoad = new WeakMap(), _SimpleAIClient_lastUnitMoves = new WeakMap(), _SimpleAIClient_unitPathData = new WeakMap(), _SimpleAIClient_unitTargetData = new WeakMap(), _SimpleAIClient_citiesToLiberate = new WeakMap(), _SimpleAIClient_enemyCitiesToAttack = new WeakMap(), _SimpleAIClient_enemyUnitsToAttack = new WeakMap(), _SimpleAIClient_goodSitesForCities = new WeakMap(), _SimpleAIClient_landTilesToExplore = new WeakMap(), _SimpleAIClient_seaTilesToExplore = new WeakMap(), _SimpleAIClient_undefendedCities = new WeakMap(), _SimpleAIClient_cityRegistry = new WeakMap(), _SimpleAIClient_cityBuildRegistry = new WeakMap(), _SimpleAIClient_cityGrowthRegistry = new WeakMap(), _SimpleAIClient_goodyHutRegistry = new WeakMap(), _SimpleAIClient_pathFinderRegistry = new WeakMap(), _SimpleAIClient_playerGovernmentRegistry = new WeakMap(), _SimpleAIClient_playerResearchRegistry = new WeakMap(), _SimpleAIClient_playerTreasuryRegistry = new WeakMap(), _SimpleAIClient_playerWorldRegistry = new WeakMap(), _SimpleAIClient_ruleRegistry = new WeakMap(), _SimpleAIClient_terrainFeatureRegistry = new WeakMap(), _SimpleAIClient_tileImprovementRegistry = new WeakMap(), _SimpleAIClient_unitImprovementRegistry = new WeakMap(), _SimpleAIClient_unitRegistry = new WeakMap();
exports.default = SimpleAIClient;
//# sourceMappingURL=SimpleAIClient.js.map