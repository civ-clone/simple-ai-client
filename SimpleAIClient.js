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
var _SimpleAIClient_isACityTile, _SimpleAIClient_shouldBuildCity, _SimpleAIClient_shouldIrrigate, _SimpleAIClient_shouldMine, _SimpleAIClient_shouldRoad, _SimpleAIClient_lastUnitMoves, _SimpleAIClient_unitPathData, _SimpleAIClient_unitTargetData, _SimpleAIClient_citiesToLiberate, _SimpleAIClient_enemyCitiesToAttack, _SimpleAIClient_enemyUnitsToAttack, _SimpleAIClient_goodSitesForCities, _SimpleAIClient_landTilesToExplore, _SimpleAIClient_seaTilesToExplore, _SimpleAIClient_undefendedCities, _SimpleAIClient_cityRegistry, _SimpleAIClient_cityBuildRegistry, _SimpleAIClient_cityGrowthRegistry, _SimpleAIClient_clientRegistry, _SimpleAIClient_goodyHutRegistry, _SimpleAIClient_interactionRegistry, _SimpleAIClient_pathFinderRegistry, _SimpleAIClient_playerGovernmentRegistry, _SimpleAIClient_playerResearchRegistry, _SimpleAIClient_playerTreasuryRegistry, _SimpleAIClient_playerWorldRegistry, _SimpleAIClient_ruleRegistry, _SimpleAIClient_terrainFeatureRegistry, _SimpleAIClient_tileImprovementRegistry, _SimpleAIClient_turn, _SimpleAIClient_unitImprovementRegistry, _SimpleAIClient_unitRegistry, _SimpleAIClient_engine, _SimpleAIClient_randomNumberGenerator;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAIClient = void 0;
const Yields_1 = require("@civ-clone/core-unit/Yields");
const Actions_1 = require("@civ-clone/civ1-unit/Actions");
const ChoiceMeta_1 = require("@civ-clone/core-client/ChoiceMeta");
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Terrains_1 = require("@civ-clone/civ1-world/Terrains");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const Yields_2 = require("@civ-clone/civ1-world/Yields");
const Types_1 = require("@civ-clone/civ1-unit/Types");
const TerrainFeatures_1 = require("@civ-clone/civ1-world/TerrainFeatures");
const GoodyHutRegistry_1 = require("@civ-clone/core-goody-hut/GoodyHutRegistry");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const TileImprovements_1 = require("@civ-clone/civ1-world/TileImprovements");
const PathFinderRegistry_1 = require("@civ-clone/core-world-path/PathFinderRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const PlayerTreasuryRegistry_1 = require("@civ-clone/core-treasury/PlayerTreasuryRegistry");
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Accept_1 = require("@civ-clone/core-diplomacy/Proposal/Accept");
const AIClient_1 = require("@civ-clone/core-ai-client/AIClient");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
const EndTurn_1 = require("@civ-clone/base-player-action-end-turn/EndTurn");
const ExchangeKnowledge_1 = require("@civ-clone/library-diplomacy/Proposals/ExchangeKnowledge");
const UnitImprovements_1 = require("@civ-clone/civ1-unit/UnitImprovements");
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
const Initiate_1 = require("@civ-clone/core-diplomacy/Negotiation/Initiate");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const Negotiation_1 = require("@civ-clone/core-diplomacy/Negotiation");
const OfferPeace_1 = require("@civ-clone/library-diplomacy/Proposals/OfferPeace");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Path_1 = require("@civ-clone/core-world-path/Path");
const PlayerResearch_1 = require("@civ-clone/core-science/PlayerResearch");
const Resolution_1 = require("@civ-clone/core-diplomacy/Proposal/Resolution");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const Tile_1 = require("@civ-clone/core-world/Tile");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const assignWorkers_1 = require("@civ-clone/civ1-city/lib/assignWorkers");
const Decline_1 = require("@civ-clone/core-diplomacy/Proposal/Decline");
const awaitTimeout = (delay, reason) => new Promise((resolve, reject) => setTimeout(() => (reason === undefined ? resolve() : reject(reason)), delay));
const hasPlayerCity = (tile, player, cityRegistry = CityRegistry_1.instance) => {
    const city = cityRegistry.getByTile(tile);
    if (city === null) {
        return false;
    }
    return city.player() === player;
}, MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION = 15;
class SimpleAIClient extends AIClient_1.default {
    constructor(player, cityRegistry = CityRegistry_1.instance, cityBuildRegistry = CityBuildRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, goodyHutRegistry = GoodyHutRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, engine = Engine_1.instance, clientRegistry = ClientRegistry_1.instance, interactionRegistry = InteractionRegistry_1.instance, turn = Turn_1.instance, randomNumberGenerator = () => Math.random()) {
        super(player);
        _SimpleAIClient_isACityTile.set(this, (tile) => __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f")
            .getByPlayer(this.player())
            .some((city) => city.tiles().includes(tile)));
        _SimpleAIClient_shouldBuildCity.set(this, (tile) => {
            const isEarth = __classPrivateFieldGet(this, _SimpleAIClient_engine, "f").option('earth', false), hasNoCities = __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByPlayer(this.player()).length === 0;
            if (isEarth && hasNoCities) {
                return true;
            }
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
                ]) >= 160 &&
                !tile
                    .getSurroundingArea(4)
                    .filter((tile) => __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByTile(tile) !== null).length);
        });
        _SimpleAIClient_shouldIrrigate.set(this, (tile) => {
            return ([Terrains_1.Desert, Terrains_1.Plains, Terrains_1.Grassland, Terrains_1.River].some((TerrainType) => tile.terrain() instanceof TerrainType) &&
                // TODO: doing this a lot already, need to make improvements a value object with a helper method
                !__classPrivateFieldGet(this, _SimpleAIClient_tileImprovementRegistry, "f")
                    .getByTile(tile)
                    .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
                __classPrivateFieldGet(this, _SimpleAIClient_isACityTile, "f").call(this, tile) &&
                [...tile.getAdjacent(), tile].some((tile) => tile.terrain() instanceof Terrains_1.River ||
                    tile.isCoast() ||
                    (__classPrivateFieldGet(this, _SimpleAIClient_tileImprovementRegistry, "f")
                        .getByTile(tile)
                        .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
                        __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByTile(tile) === null)));
        });
        _SimpleAIClient_shouldMine.set(this, (tile) => {
            return ([Terrains_1.Hills, Terrains_1.Mountains].some((TerrainType) => tile.terrain() instanceof TerrainType) &&
                !__classPrivateFieldGet(this, _SimpleAIClient_tileImprovementRegistry, "f")
                    .getByTile(tile)
                    .some((improvement) => improvement instanceof TileImprovements_1.Mine) &&
                __classPrivateFieldGet(this, _SimpleAIClient_isACityTile, "f").call(this, tile));
        });
        _SimpleAIClient_shouldRoad.set(this, (tile) => {
            return (!__classPrivateFieldGet(this, _SimpleAIClient_tileImprovementRegistry, "f")
                .getByTile(tile)
                .some((improvement) => improvement instanceof TileImprovements_1.Road) && __classPrivateFieldGet(this, _SimpleAIClient_isACityTile, "f").call(this, tile));
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
        _SimpleAIClient_clientRegistry.set(this, void 0);
        _SimpleAIClient_goodyHutRegistry.set(this, void 0);
        _SimpleAIClient_interactionRegistry.set(this, void 0);
        _SimpleAIClient_pathFinderRegistry.set(this, void 0);
        _SimpleAIClient_playerGovernmentRegistry.set(this, void 0);
        _SimpleAIClient_playerResearchRegistry.set(this, void 0);
        _SimpleAIClient_playerTreasuryRegistry.set(this, void 0);
        _SimpleAIClient_playerWorldRegistry.set(this, void 0);
        _SimpleAIClient_ruleRegistry.set(this, void 0);
        _SimpleAIClient_terrainFeatureRegistry.set(this, void 0);
        _SimpleAIClient_tileImprovementRegistry.set(this, void 0);
        _SimpleAIClient_turn.set(this, void 0);
        _SimpleAIClient_unitImprovementRegistry.set(this, void 0);
        _SimpleAIClient_unitRegistry.set(this, void 0);
        _SimpleAIClient_engine.set(this, void 0);
        _SimpleAIClient_randomNumberGenerator.set(this, void 0);
        __classPrivateFieldSet(this, _SimpleAIClient_cityRegistry, cityRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_cityBuildRegistry, cityBuildRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_cityGrowthRegistry, cityGrowthRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_clientRegistry, clientRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_goodyHutRegistry, goodyHutRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_interactionRegistry, interactionRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_pathFinderRegistry, pathFinderRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_playerGovernmentRegistry, playerGovernmentRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_playerResearchRegistry, playerResearchRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_playerTreasuryRegistry, playerTreasuryRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_playerWorldRegistry, playerWorldRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_ruleRegistry, ruleRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_terrainFeatureRegistry, terrainFeatureRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_turn, turn, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_unitImprovementRegistry, unitImprovementRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_tileImprovementRegistry, tileImprovementRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_unitRegistry, unitRegistry, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_engine, engine, "f");
        __classPrivateFieldSet(this, _SimpleAIClient_randomNumberGenerator, randomNumberGenerator, "f");
    }
    scoreUnitMove(unit, tile) {
        const actions = unit.actions(tile), { attack, buildIrrigation, buildMine, buildRoad, captureCity, disembark, embark, fortify, foundCity, noOrders, sneakAttack, } = actions.reduce((object, entity) => ({
            ...object,
            [entity.constructor.name.replace(/^./, (char) => char.toLowerCase())]: entity,
        }), {});
        if (sneakAttack && !this.shouldAttack(sneakAttack.enemy())) {
            return -10;
        }
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
    async moveUnit(unit) {
        let loopCheck = 0;
        while (unit.active() && unit.moves().value() >= 0.1) {
            if (loopCheck++ > 1e3) {
                console.log('SimpleAIClient#moveUnit: loopCheck: aborting');
                console.log(`${unit.player().civilization().name()} ${unit.constructor.name}`);
                console.log(unit.actions());
                console.log(unit.actionsForNeighbours());
                this.noOrders(unit);
                return;
            }
            const path = __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").get(unit);
            if (path) {
                const target = path.shift(), [move] = unit
                    .actions(target)
                    .filter((action) => action instanceof Actions_1.Move);
                if (move instanceof Actions_1.SneakCaptureCity &&
                    !this.shouldAttack(move.enemy())) {
                    __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").delete(unit);
                    continue;
                }
                if (move) {
                    unit.action(move);
                    if (path.length === 0) {
                        __classPrivateFieldGet(this, _SimpleAIClient_unitPathData, "f").delete(unit);
                    }
                    await this.canNegotiate(unit);
                    continue;
                }
                if (path.length > 0) {
                    // restart the loop
                    continue;
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
                Math.floor(__classPrivateFieldGet(this, _SimpleAIClient_randomNumberGenerator, "f").call(this) * 3) - 1)
                .map(([tile]) => tile);
            if (!target) {
                // TODO: could do something a bit more intelligent here
                this.noOrders(unit);
                return;
            }
            const actions = unit.actions(target), [action] = actions, lastMoves = __classPrivateFieldGet(this, _SimpleAIClient_lastUnitMoves, "f").get(unit) || [], currentTarget = __classPrivateFieldGet(this, _SimpleAIClient_unitTargetData, "f").get(unit);
            if (!action ||
                ((action instanceof Actions_1.SneakAttack ||
                    action instanceof Actions_1.SneakCaptureCity) &&
                    !this.shouldAttack(action.enemy()))) {
                // TODO: could do something a bit more intelligent here
                this.noOrders(unit);
                return;
            }
            if (currentTarget === target) {
                __classPrivateFieldGet(this, _SimpleAIClient_unitTargetData, "f").delete(unit);
            }
            lastMoves.push(target);
            __classPrivateFieldGet(this, _SimpleAIClient_lastUnitMoves, "f").set(unit, lastMoves.slice(-50));
            unit.action(action);
        }
        await this.canNegotiate(unit);
        // If we're here, we still have some moves left, lets clear them up.
        // TODO: This might not be necessary, just remove all checks for >= .1 moves left...
        if (unit.moves().value() > 0) {
            this.noOrders(unit);
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
        playerWorld.entries().forEach((playerTile) => {
            const tile = playerTile.tile(), tileCity = __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByTile(tile), tileUnits = __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f").getBy('tile', tile), existingTarget = __classPrivateFieldGet(this, _SimpleAIClient_undefendedCities, "f").includes(tile) &&
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
    async chooseFromList(meta) {
        if (meta.key() !== 'negotiation.next-step') {
            return super.chooseFromList(meta);
        }
        const score = (item) => {
            const aggressive = this.shouldAttack(item.players().filter((player) => player !== this.player())[0]);
            if (aggressive) {
                return item instanceof Decline_1.default ? 10 : -1;
            }
            return item instanceof ExchangeKnowledge_1.default
                ? 30
                : item instanceof OfferPeace_1.default
                    ? 20
                    : item instanceof Accept_1.default
                        ? 10
                        : 0;
        };
        const [topChoice] = meta.choices().sort((actionA, actionB) => {
            return (
            // TODO: This isn't `unknown`...
            score(actionB.value()) -
                score(actionA.value()));
        });
        return topChoice.value();
    }
    takeTurn() {
        return new Promise(async (resolve, reject) => {
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
                        // Do nothing, but shout about it
                        this.noOrders(item);
                        console.error("SimpleAIClient: Couldn't pick an action to do.");
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
                            await this.moveUnit(unit);
                            continue;
                        }
                        // TODO: check for defense values and activate weaker for disband/upgrade/scouting
                        const [cityUnitWithLowerDefence] = tileUnits.filter((tileUnit) => __classPrivateFieldGet(this, _SimpleAIClient_unitImprovementRegistry, "f")
                            .getByUnit(tileUnit)
                            .some((improvement) => improvement instanceof UnitImprovements_1.Fortified) && unit.defence() > tileUnit.defence()), city = __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByTile(tile);
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
                        await this.moveUnit(unit);
                        continue;
                    }
                    if (item instanceof CityBuild_1.default) {
                        this.buildItemInCity(item.city());
                        continue;
                    }
                    if (item instanceof PlayerResearch_1.default) {
                        const available = item.available();
                        if (available.length) {
                            item.research(available[Math.floor(available.length * __classPrivateFieldGet(this, _SimpleAIClient_randomNumberGenerator, "f").call(this))]);
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
            !Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableWonders = available.filter((buildItem) => Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableUnits = availableFiltered.filter((buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item())), randomSelection = availableFiltered[Math.floor(availableFiltered.length * __classPrivateFieldGet(this, _SimpleAIClient_randomNumberGenerator, "f").call(this))].item(), getUnitByYield = (YieldType) => {
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
            cityBuild.build(wonders[Math.floor(__classPrivateFieldGet(this, _SimpleAIClient_randomNumberGenerator, "f").call(this) * wonders.length)]);
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
                .filter((playerTile) => hasPlayerCity(playerTile.tile(), this.player(), __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f")))
                .map((playerTile) => playerTile.tile()));
            __classPrivateFieldGet(this, _SimpleAIClient_enemyUnitsToAttack, "f").push(...playerWorld
                .entries()
                .filter((playerTile) => __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f")
                .getByTile(playerTile.tile())
                .some((unit) => unit.player() === player))
                .map((playerTile) => playerTile.tile()));
            return;
        }
        __classPrivateFieldGet(this, _SimpleAIClient_citiesToLiberate, "f").push(city.tile());
    }
    unitDestroyed(unit, player) {
        const city = __classPrivateFieldGet(this, _SimpleAIClient_cityRegistry, "f").getByTile(unit.tile()), tileUnits = __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f").getByTile(unit.tile());
        if (city && city.player() === this.player() && tileUnits.length < 2) {
            this.buildItemInCity(city);
            __classPrivateFieldGet(this, _SimpleAIClient_playerTreasuryRegistry, "f")
                .getByPlayerAndType(this.player(), Gold_1.default)
                .buy(city);
        }
    }
    async canNegotiate(unit) {
        const surroundingPlayers = Array.from(new Set(unit
            .tile()
            .getNeighbours()
            .flatMap((tile) => __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f")
            .getByTile(tile)
            .map((tileUnit) => tileUnit.player())
            .filter((player) => player !== this.player()))));
        if (surroundingPlayers.length === 0) {
            return;
        }
        await surroundingPlayers
            .filter((player) => __classPrivateFieldGet(this, _SimpleAIClient_interactionRegistry, "f")
            .getByPlayer(player)
            .filter((interaction) => interaction instanceof Negotiation_1.default &&
            interaction.isBetween(player, this.player()))
            .every((interaction) => __classPrivateFieldGet(this, _SimpleAIClient_turn, "f").value() - interaction.when() >
            MIN_NUMBER_OF_TURNS_BEFORE_NEW_NEGOTIATION))
            .reduce((promise, player) => promise.then(() => this.handleNegotiation(player)), Promise.resolve());
    }
    async handleNegotiation(player) {
        const negotiation = new Negotiation_1.default(this.player(), player, __classPrivateFieldGet(this, _SimpleAIClient_ruleRegistry, "f"));
        negotiation.proceed(new Initiate_1.default(this.player(), negotiation, __classPrivateFieldGet(this, _SimpleAIClient_ruleRegistry, "f")));
        while (!negotiation.terminated()) {
            const lastInteraction = negotiation.lastInteraction(), players = lastInteraction !== null
                ? lastInteraction.for()
                : negotiation.players().slice(1);
            await players.reduce(async (promise, player) => promise
                .then(async () => {
                const client = __classPrivateFieldGet(this, _SimpleAIClient_clientRegistry, "f").getByPlayer(player), nextSteps = negotiation.nextSteps(), resultPromise = Promise.race([
                    client.chooseFromList(new ChoiceMeta_1.ChoiceMeta(nextSteps, 'negotiation.next-step', negotiation)),
                    client instanceof AIClient_1.default
                        ? awaitTimeout(500, new Error(`Timeout waiting for ${client.player().id()} (${client.player().civilization().sourceClass().name}) - sent ${nextSteps.length} options`))
                        : new Promise(() => { }),
                ]);
                const interaction = await resultPromise;
                if (!interaction) {
                    return;
                }
                negotiation.proceed(interaction);
                if (interaction instanceof Resolution_1.default) {
                    await interaction.proposal().resolve(interaction);
                }
                // Sleep for a bit to ensure any other async actions have taken place
                await awaitTimeout(20);
            })
                .catch((reason) => console.error(reason)), Promise.resolve());
            if (negotiation.terminated()) {
                break;
            }
        }
        __classPrivateFieldGet(this, _SimpleAIClient_interactionRegistry, "f").register(negotiation);
        return negotiation;
    }
    noOrders(unit) {
        unit.action(new Actions_1.NoOrders(unit.tile(), unit.tile(), unit, __classPrivateFieldGet(this, _SimpleAIClient_ruleRegistry, "f")));
    }
    shouldAttack(player) {
        // TODO: These scores should be cached, at lest for the duration of the Turn...
        const ourPower = __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f")
            .getByPlayer(this.player())
            .reduce((score, unit) => score + unit.attack().value() + unit.defence().value(), 0), enemyPower = __classPrivateFieldGet(this, _SimpleAIClient_unitRegistry, "f")
            .getByPlayer(player)
            .reduce((score, unit) => score + unit.attack().value() + unit.defence().value(), 0), 
        // TODO: use Traits
        // confidence = this.player().civilization().leader()!.traits().some((trait) => trait instanceof Militaristic) ? 1.25 : 0.9;
        confidence = 1;
        return ourPower * confidence >= enemyPower;
    }
}
exports.SimpleAIClient = SimpleAIClient;
_SimpleAIClient_isACityTile = new WeakMap(), _SimpleAIClient_shouldBuildCity = new WeakMap(), _SimpleAIClient_shouldIrrigate = new WeakMap(), _SimpleAIClient_shouldMine = new WeakMap(), _SimpleAIClient_shouldRoad = new WeakMap(), _SimpleAIClient_lastUnitMoves = new WeakMap(), _SimpleAIClient_unitPathData = new WeakMap(), _SimpleAIClient_unitTargetData = new WeakMap(), _SimpleAIClient_citiesToLiberate = new WeakMap(), _SimpleAIClient_enemyCitiesToAttack = new WeakMap(), _SimpleAIClient_enemyUnitsToAttack = new WeakMap(), _SimpleAIClient_goodSitesForCities = new WeakMap(), _SimpleAIClient_landTilesToExplore = new WeakMap(), _SimpleAIClient_seaTilesToExplore = new WeakMap(), _SimpleAIClient_undefendedCities = new WeakMap(), _SimpleAIClient_cityRegistry = new WeakMap(), _SimpleAIClient_cityBuildRegistry = new WeakMap(), _SimpleAIClient_cityGrowthRegistry = new WeakMap(), _SimpleAIClient_clientRegistry = new WeakMap(), _SimpleAIClient_goodyHutRegistry = new WeakMap(), _SimpleAIClient_interactionRegistry = new WeakMap(), _SimpleAIClient_pathFinderRegistry = new WeakMap(), _SimpleAIClient_playerGovernmentRegistry = new WeakMap(), _SimpleAIClient_playerResearchRegistry = new WeakMap(), _SimpleAIClient_playerTreasuryRegistry = new WeakMap(), _SimpleAIClient_playerWorldRegistry = new WeakMap(), _SimpleAIClient_ruleRegistry = new WeakMap(), _SimpleAIClient_terrainFeatureRegistry = new WeakMap(), _SimpleAIClient_tileImprovementRegistry = new WeakMap(), _SimpleAIClient_turn = new WeakMap(), _SimpleAIClient_unitImprovementRegistry = new WeakMap(), _SimpleAIClient_unitRegistry = new WeakMap(), _SimpleAIClient_engine = new WeakMap(), _SimpleAIClient_randomNumberGenerator = new WeakMap();
exports.default = SimpleAIClient;
//# sourceMappingURL=SimpleAIClient.js.map