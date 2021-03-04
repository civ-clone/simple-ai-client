"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _shouldBuildCity, _shouldIrrigate, _shouldMine, _shouldRoad, _lastUnitMoves, _unitPathData, _unitTargetData, _citiesToLiberate, _enemyCitiesToAttack, _enemyUnitsToAttack, _goodSitesForCities, _landTilesToExplore, _seaTilesToExplore, _undefendedCities, _cityRegistry, _cityGrowthRegistry, _goodyHutRegistry, _pathFinderRegistry, _playerGovernmentRegistry, _playerResearchRegistry, _playerWorldRegistry, _ruleRegistry, _terrainFeatureRegistry, _tileImprovementRegistry, _unitImprovementRegistry, _unitRegistry;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAIClient = void 0;
const Yields_1 = require("@civ-clone/core-unit/Yields");
const Actions_1 = require("@civ-clone/civ1-unit/Actions");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
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
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const AIClient_1 = require("@civ-clone/core-ai-client/AIClient");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
const UnitImprovements_1 = require("@civ-clone/civ1-unit/UnitImprovements");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Path_1 = require("@civ-clone/core-world-path/Path");
const PlayerResearch_1 = require("@civ-clone/core-science/PlayerResearch");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const Tile_1 = require("@civ-clone/core-world/Tile");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const assignWorkers_1 = require("@civ-clone/civ1-city/lib/assignWorkers");
class SimpleAIClient extends AIClient_1.default {
    constructor(player, cityRegistry = CityRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, goodyHutRegistry = GoodyHutRegistry_1.instance, leaderRegistry = LeaderRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance) {
        super(player, leaderRegistry);
        _shouldBuildCity.set(this, (tile) => {
            const terrainFeatures = __classPrivateFieldGet(this, _terrainFeatureRegistry).getByTerrain(tile.terrain());
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
                    .filter((tile) => __classPrivateFieldGet(this, _cityRegistry).getByTile(tile).length > 0).length);
        });
        _shouldIrrigate.set(this, (tile) => {
            return ([Terrains_1.Desert, Terrains_1.Plains, Terrains_1.Grassland, Terrains_1.River].some((TerrainType) => tile.terrain() instanceof TerrainType) &&
                // TODO: doing this a lot already, need to make improvements a value object with a helper method
                !__classPrivateFieldGet(this, _tileImprovementRegistry).getByTile(tile)
                    .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
                tile
                    .getSurroundingArea()
                    .some((tile) => __classPrivateFieldGet(this, _cityRegistry).getByTile(tile)
                    .some((city) => city.player() === this.player())) &&
                [...tile.getAdjacent(), tile].some((tile) => tile.terrain() instanceof Terrains_1.River ||
                    tile.isCoast() ||
                    (__classPrivateFieldGet(this, _tileImprovementRegistry).getByTile(tile)
                        .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
                        !__classPrivateFieldGet(this, _cityRegistry).getByTile(tile).length)));
        });
        _shouldMine.set(this, (tile) => {
            return ([Terrains_1.Hills, Terrains_1.Mountains].some((TerrainType) => tile.terrain() instanceof TerrainType) &&
                !__classPrivateFieldGet(this, _tileImprovementRegistry).getByTile(tile)
                    .some((improvement) => improvement instanceof TileImprovements_1.Mine) &&
                tile
                    .getSurroundingArea()
                    .some((tile) => __classPrivateFieldGet(this, _cityRegistry).getByTile(tile)
                    .some((city) => city.player() === this.player())));
        });
        _shouldRoad.set(this, (tile) => {
            return (!__classPrivateFieldGet(this, _tileImprovementRegistry).getByTile(tile)
                .some((improvement) => improvement instanceof TileImprovements_1.Road) &&
                tile
                    .getSurroundingArea()
                    .some((tile) => __classPrivateFieldGet(this, _cityRegistry).getByTile(tile)
                    .some((city) => city.player() === this.player())));
        });
        _lastUnitMoves.set(this, new Map());
        _unitPathData.set(this, new Map());
        _unitTargetData.set(this, new Map());
        // TODO: could be `City`/`Unit`s?
        _citiesToLiberate.set(this, []);
        _enemyCitiesToAttack.set(this, []);
        _enemyUnitsToAttack.set(this, []);
        _goodSitesForCities.set(this, []);
        _landTilesToExplore.set(this, []);
        _seaTilesToExplore.set(this, []);
        _undefendedCities.set(this, []);
        _cityRegistry.set(this, void 0);
        _cityGrowthRegistry.set(this, void 0);
        _goodyHutRegistry.set(this, void 0);
        _pathFinderRegistry.set(this, void 0);
        _playerGovernmentRegistry.set(this, void 0);
        _playerResearchRegistry.set(this, void 0);
        _playerWorldRegistry.set(this, void 0);
        _ruleRegistry.set(this, void 0);
        _terrainFeatureRegistry.set(this, void 0);
        _tileImprovementRegistry.set(this, void 0);
        _unitImprovementRegistry.set(this, void 0);
        _unitRegistry.set(this, void 0);
        __classPrivateFieldSet(this, _cityRegistry, cityRegistry);
        __classPrivateFieldSet(this, _cityGrowthRegistry, cityGrowthRegistry);
        __classPrivateFieldSet(this, _goodyHutRegistry, goodyHutRegistry);
        __classPrivateFieldSet(this, _pathFinderRegistry, pathFinderRegistry);
        __classPrivateFieldSet(this, _playerGovernmentRegistry, playerGovernmentRegistry);
        __classPrivateFieldSet(this, _playerResearchRegistry, playerResearchRegistry);
        __classPrivateFieldSet(this, _playerWorldRegistry, playerWorldRegistry);
        __classPrivateFieldSet(this, _ruleRegistry, ruleRegistry);
        __classPrivateFieldSet(this, _terrainFeatureRegistry, terrainFeatureRegistry);
        __classPrivateFieldSet(this, _unitImprovementRegistry, unitImprovementRegistry);
        __classPrivateFieldSet(this, _tileImprovementRegistry, tileImprovementRegistry);
        __classPrivateFieldSet(this, _unitRegistry, unitRegistry);
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
        const goodyHut = __classPrivateFieldGet(this, _goodyHutRegistry).getByTile(tile);
        if (goodyHut !== null) {
            score += 60;
        }
        if ((foundCity && __classPrivateFieldGet(this, _shouldBuildCity).call(this, tile)) ||
            (buildMine && __classPrivateFieldGet(this, _shouldMine).call(this, tile)) ||
            (buildIrrigation && __classPrivateFieldGet(this, _shouldIrrigate).call(this, tile)) ||
            (buildRoad && __classPrivateFieldGet(this, _shouldRoad).call(this, tile))) {
            score += 24;
        }
        const tileUnits = __classPrivateFieldGet(this, _unitRegistry).getByTile(tile)
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
        const playerWorld = __classPrivateFieldGet(this, _playerWorldRegistry).getByPlayer(this.player());
        const discoverableTiles = tile
            .getNeighbours()
            .filter((neighbouringTile) => !playerWorld.includes(neighbouringTile)).length;
        if (discoverableTiles > 0) {
            score += discoverableTiles * 3;
        }
        const target = __classPrivateFieldGet(this, _unitTargetData).get(unit);
        if (target instanceof Tile_1.default &&
            tile.distanceFrom(target) < unit.tile().distanceFrom(target)) {
            score += 14;
        }
        const lastMoves = __classPrivateFieldGet(this, _lastUnitMoves).get(unit) || [];
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
            const path = __classPrivateFieldGet(this, _unitPathData).get(unit);
            if (path) {
                const target = path.shift(), [move] = unit
                    .actions(target)
                    .filter((action) => action instanceof Actions_1.Move);
                if (move) {
                    unit.action(move);
                    if (path.length === 0) {
                        __classPrivateFieldGet(this, _unitPathData).delete(unit);
                    }
                    return;
                }
                if (path.length > 0) {
                    const newPath = Path_1.default.for(unit, unit.tile(), path.end());
                    if (newPath) {
                        __classPrivateFieldGet(this, _unitPathData).set(unit, newPath);
                        // restart the loop
                        continue;
                    }
                }
                __classPrivateFieldGet(this, _unitPathData).delete(unit);
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
            const actions = unit.actions(target), [action] = actions, lastMoves = __classPrivateFieldGet(this, _lastUnitMoves).get(unit) || [], currentTarget = __classPrivateFieldGet(this, _unitTargetData).get(unit);
            if (!action) {
                // TODO: could do something a bit more intelligent here
                unit.action(new Actions_1.NoOrders(unit.tile(), unit.tile(), unit));
                return;
            }
            if (currentTarget === target) {
                __classPrivateFieldGet(this, _unitTargetData).delete(unit);
            }
            lastMoves.push(target);
            __classPrivateFieldGet(this, _lastUnitMoves).set(unit, lastMoves.slice(-50));
            unit.action(action);
        }
        // If we're here, we still have some moves left, lets clear them up.
        // TODO: This might not be necessary, just remove all checks for >= .1 moves left...
        if (unit.moves().value() > 0) {
            unit.action(new Actions_1.NoOrders(unit.tile(), unit.tile(), unit));
        }
    }
    preProcessTurn() {
        __classPrivateFieldGet(this, _citiesToLiberate).splice(0);
        __classPrivateFieldGet(this, _enemyCitiesToAttack).splice(0);
        __classPrivateFieldGet(this, _enemyUnitsToAttack).splice(0);
        __classPrivateFieldGet(this, _goodSitesForCities).splice(0);
        __classPrivateFieldGet(this, _landTilesToExplore).splice(0);
        __classPrivateFieldGet(this, _seaTilesToExplore).splice(0);
        __classPrivateFieldGet(this, _undefendedCities).splice(0);
        const playerWorld = __classPrivateFieldGet(this, _playerWorldRegistry).getByPlayer(this.player());
        playerWorld.entries().forEach((tile) => {
            const [tileCity] = __classPrivateFieldGet(this, _cityRegistry).getByTile(tile), tileUnits = __classPrivateFieldGet(this, _unitRegistry).getBy('tile', tile), existingTarget = __classPrivateFieldGet(this, _undefendedCities).includes(tile) &&
                ![
                    ...__classPrivateFieldGet(this, _unitTargetData).values(),
                    ...[...__classPrivateFieldGet(this, _unitPathData).values()].map((path) => path.end()),
                ].includes(tile);
            if (tileCity &&
                tileCity.player() === this.player() &&
                !tileUnits.length &&
                !__classPrivateFieldGet(this, _undefendedCities).includes(tile) &&
                !existingTarget) {
                __classPrivateFieldGet(this, _undefendedCities).push(tile);
            }
            // TODO: when diplomacy exists, check diplomatic status with player
            else if (tileCity &&
                tileCity.player() !== this.player() &&
                tileCity.originalPlayer() === this.player()) {
                __classPrivateFieldGet(this, _citiesToLiberate).push(tile);
            }
            else if (tileCity &&
                tileCity.player() !== this.player() &&
                !__classPrivateFieldGet(this, _enemyCitiesToAttack).includes(tile)) {
                __classPrivateFieldGet(this, _enemyCitiesToAttack).push(tile);
            }
            else if (tileUnits.length &&
                tileUnits.some((unit) => unit.player() !== this.player()) &&
                __classPrivateFieldGet(this, _enemyUnitsToAttack).includes(tile)) {
                __classPrivateFieldGet(this, _enemyUnitsToAttack).push(tile);
            }
            else if (tile.isLand() &&
                tile
                    .getNeighbours()
                    .some((tile) => !playerWorld.includes(tile)) &&
                !__classPrivateFieldGet(this, _landTilesToExplore).includes(tile) &&
                !existingTarget) {
                __classPrivateFieldGet(this, _landTilesToExplore).push(tile);
            }
            else if (tile.isWater() &&
                tile
                    .getNeighbours()
                    .some((tile) => !playerWorld.includes(tile)) &&
                __classPrivateFieldGet(this, _seaTilesToExplore).includes(tile) &&
                !existingTarget) {
                __classPrivateFieldGet(this, _seaTilesToExplore).push(tile);
            }
            if (__classPrivateFieldGet(this, _shouldBuildCity).call(this, tile) &&
                __classPrivateFieldGet(this, _goodSitesForCities).includes(tile) &&
                !existingTarget) {
                __classPrivateFieldGet(this, _goodSitesForCities).push(tile);
            }
        });
        __classPrivateFieldGet(this, _cityRegistry).getByPlayer(this.player())
            .forEach((city) => {
            const tileUnits = __classPrivateFieldGet(this, _unitRegistry).getByTile(city.tile());
            assignWorkers_1.default(city, __classPrivateFieldGet(this, _playerWorldRegistry), __classPrivateFieldGet(this, _cityGrowthRegistry));
            if (!tileUnits.length &&
                !__classPrivateFieldGet(this, _undefendedCities).includes(city.tile())) {
                __classPrivateFieldGet(this, _undefendedCities).push(city.tile());
            }
        });
    }
    takeTurn() {
        return new Promise((resolve, reject) => {
            try {
                let loopCheck = 0;
                this.preProcessTurn();
                const [playerGovernment] = __classPrivateFieldGet(this, _playerGovernmentRegistry).filter((playerGovernment) => playerGovernment.player() === this.player()), [playerResearch] = __classPrivateFieldGet(this, _playerResearchRegistry).filter((playerScience) => playerScience.player() === this.player());
                if (playerResearch.completed(Advances_1.Monarchy) &&
                    !playerGovernment.is(Governments_1.Monarchy)) {
                    playerGovernment.set(new Governments_1.Monarchy());
                }
                while (this.player().hasMandatoryActions()) {
                    const item = this.player().mandatoryAction().value();
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
                            console.log(__classPrivateFieldGet(this, _unitImprovementRegistry).getByUnit(item));
                        }
                        reject(new Error("SimpleAIClient: Couldn't pick an action to do."));
                        break;
                    }
                    if (item instanceof Unit_1.default) {
                        const unit = item, tile = unit.tile(), target = __classPrivateFieldGet(this, _unitTargetData).get(unit), actions = unit.actions(), { buildIrrigation, buildMine, buildRoad, fortify, foundCity, unload, } = actions.reduce((object, entity) => ({
                            ...object,
                            [entity.constructor.name.replace(/^./, (char) => char.toLowerCase())]: entity,
                        }), {}), tileUnits = __classPrivateFieldGet(this, _unitRegistry).getByTile(tile), lastUnitMoves = __classPrivateFieldGet(this, _lastUnitMoves).get(unit);
                        if (!lastUnitMoves) {
                            __classPrivateFieldGet(this, _lastUnitMoves).set(unit, [unit.tile()]);
                        }
                        if (unit instanceof Types_1.NavalTransport &&
                            unload &&
                            tile.isCoast() &&
                            unit
                                .cargo()
                                .some((unit) => !tile
                                .getNeighbours()
                                .some((tile) => (__classPrivateFieldGet(this, _lastUnitMoves).get(unit) || []).includes(tile)))) {
                            unit.action(unload);
                            unit.setWaiting();
                            // skip out to allow the unloaded units to be moved.
                            continue;
                        }
                        if (unit instanceof Types_1.Worker) {
                            if (foundCity && __classPrivateFieldGet(this, _shouldBuildCity).call(this, tile)) {
                                unit.action(foundCity);
                            }
                            else if (buildIrrigation && __classPrivateFieldGet(this, _shouldIrrigate).call(this, tile)) {
                                unit.action(buildIrrigation);
                            }
                            else if (buildMine && __classPrivateFieldGet(this, _shouldMine).call(this, tile)) {
                                unit.action(buildMine);
                            }
                            else if (buildRoad && __classPrivateFieldGet(this, _shouldRoad).call(this, tile)) {
                                unit.action(buildRoad);
                            }
                            else if (!target && __classPrivateFieldGet(this, _goodSitesForCities).length) {
                                __classPrivateFieldGet(this, _unitTargetData).set(unit, __classPrivateFieldGet(this, _goodSitesForCities).shift());
                            }
                            this.moveUnit(unit);
                            continue;
                        }
                        // TODO: check for defense values and activate weaker for disband/upgrade/scouting
                        const [cityUnitWithLowerDefence] = tileUnits.filter((tileUnit) => __classPrivateFieldGet(this, _unitImprovementRegistry).getByUnit(tileUnit)
                            .some((improvement) => improvement instanceof UnitImprovements_1.Fortified) && unit.defence() > tileUnit.defence()), [city] = __classPrivateFieldGet(this, _cityRegistry).getByTile(tile);
                        if (fortify &&
                            city &&
                            (cityUnitWithLowerDefence ||
                                tileUnits.length <=
                                    Math.ceil(__classPrivateFieldGet(this, _cityGrowthRegistry).getByCity(city).size() / 5))) {
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
                                __classPrivateFieldGet(this, _undefendedCities).length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _undefendedCities).sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _pathFinderRegistry));
                                if (path) {
                                    __classPrivateFieldGet(this, _undefendedCities).splice(__classPrivateFieldGet(this, _undefendedCities).indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _unitPathData).set(unit, path);
                                }
                            }
                            else if (unit.attack().value() > 0 &&
                                __classPrivateFieldGet(this, _citiesToLiberate).length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _citiesToLiberate).filter((tile) => unit instanceof Types_1.Land && tile.isLand())
                                    .sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _pathFinderRegistry));
                                if (path) {
                                    __classPrivateFieldGet(this, _citiesToLiberate).splice(__classPrivateFieldGet(this, _citiesToLiberate).indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _unitPathData).set(unit, path);
                                }
                            }
                            else if (unit.attack().value() > 0 &&
                                __classPrivateFieldGet(this, _enemyUnitsToAttack).length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _enemyUnitsToAttack).filter((tile) => (unit instanceof Types_1.Land && tile.isLand()) ||
                                    (unit instanceof Types_1.Naval && tile.isWater()))
                                    .sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _pathFinderRegistry));
                                if (path) {
                                    __classPrivateFieldGet(this, _enemyUnitsToAttack).splice(__classPrivateFieldGet(this, _enemyUnitsToAttack).indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _unitPathData).set(unit, path);
                                }
                            }
                            else if (unit instanceof Types_1.Land &&
                                unit.attack().value() > 0 &&
                                __classPrivateFieldGet(this, _enemyCitiesToAttack).length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _enemyCitiesToAttack).sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _pathFinderRegistry));
                                if (path) {
                                    __classPrivateFieldGet(this, _enemyCitiesToAttack).splice(__classPrivateFieldGet(this, _enemyCitiesToAttack).indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _unitPathData).set(unit, path);
                                }
                            }
                            else if (unit instanceof Types_1.Land &&
                                __classPrivateFieldGet(this, _landTilesToExplore).length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _landTilesToExplore).sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _pathFinderRegistry));
                                if (path) {
                                    __classPrivateFieldGet(this, _landTilesToExplore).splice(__classPrivateFieldGet(this, _landTilesToExplore).indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _unitPathData).set(unit, path);
                                }
                            }
                            else if (unit instanceof Types_1.Naval &&
                                __classPrivateFieldGet(this, _seaTilesToExplore).length > 0) {
                                const [targetTile] = __classPrivateFieldGet(this, _seaTilesToExplore).sort((a, b) => a.distanceFrom(unit.tile()) -
                                    b.distanceFrom(unit.tile())), path = Path_1.default.for(unit, unit.tile(), targetTile, __classPrivateFieldGet(this, _pathFinderRegistry));
                                if (path) {
                                    __classPrivateFieldGet(this, _seaTilesToExplore).splice(__classPrivateFieldGet(this, _seaTilesToExplore).indexOf(targetTile), 1);
                                    __classPrivateFieldGet(this, _unitPathData).set(unit, path);
                                }
                            }
                        }
                        this.moveUnit(unit);
                        continue;
                    }
                    if (item instanceof CityBuild_1.default) {
                        const cityBuild = item, tile = cityBuild.city().tile(), available = cityBuild.available(), restrictions = [CityImprovements_1.Palace, Units_1.Settlers], availableFiltered = available.filter((entity) => !restrictions.includes(entity)), availableUnits = availableFiltered.filter((entity) => Object.prototype.isPrototypeOf.call(Unit_1.default, entity)), randomSelection = availableFiltered[Math.floor(available.length * Math.random())], getUnitByYield = (YieldType) => {
                            const [[UnitType]] = availableUnits
                                .map((UnitType) => {
                                const unitYield = new YieldType();
                                __classPrivateFieldGet(this, _ruleRegistry).process(Yield_1.BaseYield, UnitType, unitYield);
                                return [UnitType, unitYield];
                            })
                                .sort(([, unitYieldA], [, unitYieldB]) => unitYieldB.value() - unitYieldA.value());
                            return UnitType;
                        }, getDefensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Defence)))(), getOffensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Attack)))();
                        if (!__classPrivateFieldGet(this, _unitRegistry).getByTile(tile).length &&
                            getDefensiveUnit()) {
                            cityBuild.build(getDefensiveUnit());
                            continue;
                        }
                        const cityGrowth = __classPrivateFieldGet(this, _cityGrowthRegistry).getByCity(cityBuild.city());
                        // Always Build Cities
                        if (available.includes(Units_1.Settlers) &&
                            !__classPrivateFieldGet(this, _unitRegistry).getByCity(cityBuild.city())
                                .some((unit) => unit instanceof Units_1.Settlers) &&
                            // TODO: use expansionist leader trait
                            __classPrivateFieldGet(this, _unitRegistry).getByPlayer(this.player())
                                .filter((unit) => unit instanceof Units_1.Settlers)
                                .length < 3 &&
                            cityGrowth.size() > 1) {
                            cityBuild.build(Units_1.Settlers);
                            continue;
                        }
                        if (__classPrivateFieldGet(this, _enemyCitiesToAttack).length > 0 ||
                            __classPrivateFieldGet(this, _enemyUnitsToAttack).length > 4) {
                            cityBuild.build(getOffensiveUnit());
                            continue;
                        }
                        if (__classPrivateFieldGet(this, _undefendedCities).length) {
                            cityBuild.build(getDefensiveUnit());
                            continue;
                        }
                        if (randomSelection) {
                            cityBuild.build(randomSelection);
                        }
                        continue;
                    }
                    if (item instanceof PlayerResearch_1.default) {
                        const available = item.available();
                        if (available.length) {
                            item.research(available[Math.floor(available.length * Math.random())]);
                        }
                        continue;
                    }
                    console.log(`Can't process: '${item.constructor.name}'`);
                    break;
                }
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
exports.SimpleAIClient = SimpleAIClient;
_shouldBuildCity = new WeakMap(), _shouldIrrigate = new WeakMap(), _shouldMine = new WeakMap(), _shouldRoad = new WeakMap(), _lastUnitMoves = new WeakMap(), _unitPathData = new WeakMap(), _unitTargetData = new WeakMap(), _citiesToLiberate = new WeakMap(), _enemyCitiesToAttack = new WeakMap(), _enemyUnitsToAttack = new WeakMap(), _goodSitesForCities = new WeakMap(), _landTilesToExplore = new WeakMap(), _seaTilesToExplore = new WeakMap(), _undefendedCities = new WeakMap(), _cityRegistry = new WeakMap(), _cityGrowthRegistry = new WeakMap(), _goodyHutRegistry = new WeakMap(), _pathFinderRegistry = new WeakMap(), _playerGovernmentRegistry = new WeakMap(), _playerResearchRegistry = new WeakMap(), _playerWorldRegistry = new WeakMap(), _ruleRegistry = new WeakMap(), _terrainFeatureRegistry = new WeakMap(), _tileImprovementRegistry = new WeakMap(), _unitImprovementRegistry = new WeakMap(), _unitRegistry = new WeakMap();
exports.default = SimpleAIClient;
//# sourceMappingURL=SimpleAIClient.js.map