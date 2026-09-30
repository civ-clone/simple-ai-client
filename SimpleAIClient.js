"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAIClient = void 0;
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const GoodyHutRegistry_1 = require("@civ-clone/core-goody-hut/GoodyHutRegistry");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
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
const StrategyNoteRegistry_1 = require("@civ-clone/core-strategy/StrategyNoteRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const AIClient_1 = require("@civ-clone/core-ai-client/AIClient");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
const EndTurn_1 = require("@civ-clone/base-player-action-end-turn/EndTurn");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernment_1 = require("@civ-clone/core-government/PlayerGovernment");
const PlayerResearch_1 = require("@civ-clone/core-science/PlayerResearch");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const core_random_1 = require("@civ-clone/core-random");
const government_1 = require("./lib/Civ1/government");
const MemoryRegistry_1 = require("./lib/MemoryRegistry");
const orders_1 = require("./lib/Unit/orders");
const buildItemInCity_1 = require("./lib/Civ1/buildItemInCity");
const chooseNegotiationStep_1 = require("./lib/Diplomacy/chooseNegotiationStep");
const chooseResearch_1 = require("./lib/Science/chooseResearch");
const cityLost_1 = require("./lib/Events/cityLost");
const knowledge_1 = require("./lib/Civ1/knowledge");
const moveUnit_1 = require("./lib/Unit/moveUnit");
const reviewCities_1 = require("./lib/Turn/reviewCities");
const scoreUnitMove_1 = require("./lib/Unit/scoreUnitMove");
const surveyTargets_1 = require("./lib/Turn/surveyTargets");
const takeUnitTurn_1 = require("./lib/Unit/takeUnitTurn");
const unitDestroyed_1 = require("./lib/Events/unitDestroyed");
const waitForCarrier_1 = require("./lib/Unit/waitForCarrier");
const wakeCarrierAircraft_1 = require("./lib/Turn/wakeCarrierAircraft");
// For its `ChoiceMetaDataMap` entry, which `chooseFromList` below and its callers rely on.
require("./lib/Diplomacy/negotiate");
// Civ1: the computer player. It keeps the player's working memory and runs the turn, and hands every decision to the
//  modules in `lib/`: generic ones, given Civ1's judgements through `Knowledge`, and Civ1 ones in `lib/Civ1/`.
class SimpleAIClient extends AIClient_1.default {
    // The player's working memory, which the strategies and the `Rules/` hooks share.
    memory() {
        return this._dependencies.memoryRegistry.memoryFor(this.player());
    }
    // The working memory under the names it had as fields, for tests and debugging that reach in for it.
    get _lastUnitMoves() {
        return this.memory().lastUnitMoves;
    }
    get _unitPathData() {
        return this.memory().unitPathData;
    }
    get _unitTargetData() {
        return this.memory().unitTargetData;
    }
    get _citiesToLiberate() {
        return this.memory().targets.citiesToLiberate;
    }
    get _enemyCitiesToAttack() {
        return this.memory().targets.enemyCitiesToAttack;
    }
    get _enemyUnitsToAttack() {
        return this.memory().targets.enemyUnitsToAttack;
    }
    get _goodSitesForCities() {
        return this.memory().targets.goodSitesForCities;
    }
    get _landTilesToExplore() {
        return this.memory().targets.landTilesToExplore;
    }
    get _seaTilesToExplore() {
        return this.memory().targets.seaTilesToExplore;
    }
    get _undefendedCities() {
        return this.memory().targets.undefendedCities;
    }
    constructor(player, cityRegistry = CityRegistry_1.instance, cityBuildRegistry = CityBuildRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, goodyHutRegistry = GoodyHutRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, engine = Engine_1.instance, clientRegistry = ClientRegistry_1.instance, interactionRegistry = InteractionRegistry_1.instance, turn = Turn_1.instance, randomNumberGenerator = core_random_1.instance, strategyNoteRegistry = StrategyNoteRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, pendingEffectRegistry = core_pending_effect_1.instance) {
        // The generator goes to `core-client`'s `Client`, which holds the one
        // `protected _randomNumberGenerator`. This class declared a second
        // `#randomNumberGenerator` shadowing it, which two `private` fields of the
        // same name cannot express.
        super(player, randomNumberGenerator);
        this._knowledge = knowledge_1.default;
        this._dependencies = {
            cityBuildRegistry,
            cityGrowthRegistry,
            cityRegistry,
            clientRegistry,
            engine,
            goodyHutRegistry,
            interactionRegistry,
            memoryRegistry: MemoryRegistry_1.instance,
            pathFinderRegistry,
            pendingEffectRegistry,
            playerGovernmentRegistry,
            playerResearchRegistry,
            playerTreasuryRegistry,
            playerWorldRegistry,
            randomNumberGenerator,
            ruleRegistry,
            strategyNoteRegistry,
            terrainFeatureRegistry,
            tileImprovementRegistry,
            turn,
            unitImprovementRegistry,
            unitRegistry,
            workedTileRegistry,
        };
    }
    scoreUnitMove(unit, tile) {
        return (0, scoreUnitMove_1.default)(this._dependencies, this.player(), this.memory(), this._knowledge, unit, tile);
    }
    // Not `async`: the promise is handed back as it is, so awaiting this takes the same ticks as awaiting `moveUnit`.
    moveUnit(unit) {
        return (0, moveUnit_1.default)(this._dependencies, this.player(), this.memory(), this._knowledge, unit);
    }
    preProcessTurn() {
        (0, surveyTargets_1.default)(this._dependencies, this.player(), this.memory(), this._knowledge);
        (0, reviewCities_1.default)(this._dependencies, this.player(), this.memory().targets, this._knowledge);
        (0, wakeCarrierAircraft_1.default)(this._dependencies, this.player(), this._knowledge);
    }
    async chooseFromList(meta) {
        if (meta.key() !== 'negotiation.next-step') {
            return super.chooseFromList(meta);
        }
        return (0, chooseNegotiationStep_1.default)(this._dependencies, this.player(), meta);
    }
    takeTurn() {
        return new Promise(async (resolve, reject) => {
            try {
                let loopCheck = 0;
                this.preProcessTurn();
                (0, government_1.startRevolution)(this._dependencies, this.player());
                while (this.player().hasMandatoryActions()) {
                    const action = this.player().mandatoryAction(), item = action.value();
                    try {
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
                                console.log(this._dependencies.unitImprovementRegistry.getByUnit(item));
                            }
                            // Do nothing, but shout about it
                            (0, orders_1.noOrders)(this._dependencies, item);
                            console.error("SimpleAIClient: Couldn't pick an action to do.");
                            break;
                        }
                        if (item instanceof Unit_1.default &&
                            (0, waitForCarrier_1.default)(this._dependencies, this.player(), this._knowledge, item)) {
                            continue;
                        }
                        if (item instanceof Unit_1.default) {
                            const moving = (0, takeUnitTurn_1.default)(this._dependencies, this.player(), this.memory(), this._knowledge, item);
                            if (moving !== null) {
                                await moving;
                            }
                            continue;
                        }
                        if (item instanceof CityBuild_1.default) {
                            this.buildItemInCity(item.city());
                            continue;
                        }
                        if (item instanceof PlayerResearch_1.default) {
                            (0, chooseResearch_1.default)(this._dependencies, item);
                            continue;
                        }
                        if (item instanceof PlayerGovernment_1.default) {
                            (0, government_1.pickGovernment)(this._dependencies, item);
                            continue;
                        }
                        if (action instanceof EndTurn_1.default) {
                            break;
                        }
                        console.log(`Can't process: '${item.constructor.name}'`);
                        break;
                    }
                    catch (e) {
                        if (!(item instanceof Unit_1.default)) {
                            throw e;
                        }
                        // One unit's failed move shouldn't cost the player the rest of their turn, so log it, stop that unit for
                        //  this turn and carry on with the others (civ-clone/web-renderer#79).
                        console.error(`SimpleAIClient: ${item.constructor.name} ${item.id()} couldn't act and was skipped this turn:`, e);
                        (0, orders_1.skipUnit)(this._dependencies, item);
                    }
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
        (0, buildItemInCity_1.default)(this._dependencies, this.player(), this.memory().targets, city);
    }
    cityLost(city, player, destroyed) {
        (0, cityLost_1.default)(this._dependencies, this.player(), this.memory().targets, city, player, destroyed);
    }
    // TODO: `player`, who destroyed the unit, is never used. Kept: #153 changes no play.
    unitDestroyed(unit, player) {
        (0, unitDestroyed_1.default)(this._dependencies, this.player(), unit, (city) => this.buildItemInCity(city));
    }
}
exports.SimpleAIClient = SimpleAIClient;
exports.default = SimpleAIClient;
//# sourceMappingURL=SimpleAIClient.js.map