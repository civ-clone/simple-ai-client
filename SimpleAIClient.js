"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAIClient = void 0;
const AvailableSpecialistRegistry_1 = require("@civ-clone/core-city/AvailableSpecialistRegistry");
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
const PlayerTradeRatesRegistry_1 = require("@civ-clone/core-trade-rate/PlayerTradeRatesRegistry");
const TraitRegistry_1 = require("@civ-clone/core-civilization/TraitRegistry");
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const StrategyNoteRegistry_1 = require("@civ-clone/core-strategy/StrategyNoteRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const StrategyRegistry_1 = require("@civ-clone/core-strategy/StrategyRegistry");
const EndTurn_1 = require("@civ-clone/base-player-action-end-turn/EndTurn");
const StrategyAIClient_1 = require("@civ-clone/core-strategy-ai-client/StrategyAIClient");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const core_random_1 = require("@civ-clone/core-random");
const MemoryRegistry_1 = require("./lib/MemoryRegistry");
const orders_1 = require("./lib/Unit/orders");
const buildItemInCity_1 = require("./lib/Civ1/buildItemInCity");
const cityLost_1 = require("./lib/Events/cityLost");
const knowledge_1 = require("./lib/Civ1/knowledge");
const moveUnit_1 = require("./lib/Unit/moveUnit");
const reviewCities_1 = require("./lib/Turn/reviewCities");
const scoreUnitMove_1 = require("./lib/Unit/scoreUnitMove");
const surveyTargets_1 = require("./lib/Turn/surveyTargets");
const unitDestroyed_1 = require("./lib/Events/unitDestroyed");
const wakeCarrierAircraft_1 = require("./lib/Turn/wakeCarrierAircraft");
// For its `ChoiceMetaDataMap` entry, which `chooseFromList` and its callers rely on.
require("./lib/Diplomacy/negotiate");
// Civ1: the computer player. A `StrategyAIClient`, so each turn is the game's strategies at work: `registerStrategies`
//  registers the Civ1 pack (`Strategies/`), and any other plugin's strategies play alongside. What stays here is what
//  the turn loop can't express as a strategy: Civ1's handling of failed, unhandled and runaway actions, and the hooks
//  that `Rules/` call during other players' turns.
class SimpleAIClient extends StrategyAIClient_1.default {
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
    constructor(player, cityRegistry = CityRegistry_1.instance, cityBuildRegistry = CityBuildRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, goodyHutRegistry = GoodyHutRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, engine = Engine_1.instance, clientRegistry = ClientRegistry_1.instance, interactionRegistry = InteractionRegistry_1.instance, turn = Turn_1.instance, randomNumberGenerator = core_random_1.instance, strategyNoteRegistry = StrategyNoteRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, pendingEffectRegistry = core_pending_effect_1.instance, 
    // The game-wide registry, which `registerStrategies` fills with the Civ1 pack. A client given registries of its own
    //  needs a `StrategyRegistry` built over them: `createStrategies(createDependencies({ … }))`.
    strategyRegistry = StrategyRegistry_1.instance) {
        // The generator goes to `core-client`'s `Client`, which holds the one
        // `protected _randomNumberGenerator`. This class declared a second
        // `#randomNumberGenerator` shadowing it, which two `private` fields of the
        // same name cannot express.
        super(player, strategyRegistry, randomNumberGenerator);
        this._knowledge = knowledge_1.default;
        // The specialist, trade rate and trait registries aren't arguments, so that callers passing the others by position
        //  (the arena looks for `strategyRegistry`'s) are unaffected. Only the strategies use them, and those are given the
        //  game's own (`dependenciesFor`).
        this._dependencies = {
            availableSpecialistRegistry: AvailableSpecialistRegistry_1.instance,
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
            playerTradeRatesRegistry: PlayerTradeRatesRegistry_1.instance,
            playerTreasuryRegistry,
            playerWorldRegistry,
            randomNumberGenerator,
            ruleRegistry,
            specialistRegistry: SpecialistRegistry_1.instance,
            strategyNoteRegistry,
            terrainFeatureRegistry,
            tileImprovementRegistry,
            traitRegistry: TraitRegistry_1.instance,
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
    // What the `BeforeTurn` strategies `SurveyTargets`, `ReviewCities` and `WakeCarrierAircraft` do, for a caller that
    //  wants it outside a turn.
    preProcessTurn() {
        (0, surveyTargets_1.default)(this._dependencies, this.player(), this.memory(), this._knowledge);
        (0, reviewCities_1.default)(this._dependencies, this.player(), this.memory(), this._knowledge);
        (0, wakeCarrierAircraft_1.default)(this._dependencies, this.player(), this._knowledge);
    }
    // One unit's failed move shouldn't cost the player the rest of their turn, so log it, stop that unit for this turn
    //  and carry on with the others (civ-clone/web-renderer#79). Anything else fails the turn.
    actionFailed(action, error) {
        const item = action.value();
        if (!(item instanceof Unit_1.default)) {
            throw error;
        }
        console.error(`SimpleAIClient: ${item.constructor.name} ${item.id()} couldn't act and was skipped this turn:`, error);
        (0, orders_1.skipUnit)(this._dependencies, item);
        return true;
    }
    // TODO: Remove this when it's working as expected
    actionLimitReached(action) {
        const item = action.value();
        // Anything thrown here is dealt with here, not left to the base loop, which ends the turn after this hook either
        //  way: a unit that can't even be logged or take `NoOrders` is skipped, as `actionFailed` does, and anything else
        //  fails the turn.
        try {
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
        }
        catch (error) {
            this.actionFailed(action, error);
            return;
        }
        console.error("SimpleAIClient: Couldn't pick an action to do.");
    }
    // The turn ends at the first action no strategy handles, which should be `EndTurn`.
    unhandledAction(action) {
        if (action instanceof EndTurn_1.default) {
            return;
        }
        console.log(`Can't process: '${action.value().constructor.name}'`);
    }
    buildItemInCity(city) {
        (0, buildItemInCity_1.default)(this._dependencies, this.player(), this.memory().targets, city);
    }
    cityLost(city, player, destroyed) {
        (0, cityLost_1.default)(this._dependencies, this.player(), this.memory().targets, city, player, destroyed);
    }
    // `player` is whoever destroyed the unit, or `null`.
    unitDestroyed(unit, player) {
        (0, unitDestroyed_1.default)(this._dependencies, this.player(), this.memory(), unit, player, (city) => this.buildItemInCity(city));
    }
}
exports.SimpleAIClient = SimpleAIClient;
exports.default = SimpleAIClient;
//# sourceMappingURL=SimpleAIClient.js.map