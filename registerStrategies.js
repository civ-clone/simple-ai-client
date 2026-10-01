"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.createStrategies = exports.dependenciesFor = void 0;
// Civ1: the strategy pack `SimpleAIClient` plays with, generic strategies given Civ1's `Knowledge` plus the Civ1 ones,
//  registered into a game's `StrategyRegistry`.
const core_game_1 = require("@civ-clone/core-game");
const Dependencies_1 = require("./lib/Dependencies");
const BuildExplorerShip_1 = require("./Strategies/City/BuildExplorerShip");
const ChooseGovernment_1 = require("./Strategies/Civ1/ChooseGovernment");
const ChooseProduction_1 = require("./Strategies/Civ1/ChooseProduction");
const ChooseResearch_1 = require("./Strategies/Science/ChooseResearch");
const FoundCapital_1 = require("./Strategies/Unit/FoundCapital");
const Garrison_1 = require("./Strategies/Unit/Garrison");
const MissionAndMove_1 = require("./Strategies/Unit/MissionAndMove");
const NegotiationAnswers_1 = require("./Strategies/Diplomacy/NegotiationAnswers");
const PreventDisorder_1 = require("./Strategies/City/PreventDisorder");
const ReviewCities_1 = require("./Strategies/Turn/ReviewCities");
const StandDown_1 = require("./Strategies/Unit/StandDown");
const StartRevolution_1 = require("./Strategies/Civ1/StartRevolution");
const SurveyTargets_1 = require("./Strategies/Turn/SurveyTargets");
const TerrainWork_1 = require("./Strategies/Unit/TerrainWork");
const TradeRates_1 = require("./Strategies/Turn/TradeRates");
const UnloadTransport_1 = require("./Strategies/Unit/UnloadTransport");
const WaitForCarrier_1 = require("./Strategies/Unit/WaitForCarrier");
const WakeCarrierAircraft_1 = require("./Strategies/Turn/WakeCarrierAircraft");
const WorkerTurn_1 = require("./Strategies/Unit/WorkerTurn");
const disorder_1 = require("./lib/Civ1/disorder");
const knowledge_1 = require("./lib/Civ1/knowledge");
const standDown_1 = require("./lib/Civ1/standDown");
const terrain_1 = require("./lib/Civ1/terrain");
const tradeRates_1 = require("./lib/Civ1/tradeRates");
const wantedAdvances_1 = require("./lib/Civ1/wantedAdvances");
// The game's registries, as the strategies take them.
const dependenciesFor = (game) => (0, Dependencies_1.createDependencies)({
    availableSpecialistRegistry: game.availableSpecialists,
    cityBuildRegistry: game.cityBuilds,
    cityGrowthRegistry: game.cityGrowth,
    cityRegistry: game.cities,
    clientRegistry: game.clients,
    engine: game.engine,
    goodyHutRegistry: game.goodyHuts,
    interactionRegistry: game.interactions,
    pathFinderRegistry: game.pathFinders,
    pendingEffectRegistry: game.pendingEffects,
    playerGovernmentRegistry: game.playerGovernments,
    playerResearchRegistry: game.playerResearch,
    playerTradeRatesRegistry: game.playerTradeRates,
    playerTreasuryRegistry: game.playerTreasuries,
    playerWorldRegistry: game.playerWorlds,
    randomNumberGenerator: game.rng,
    ruleRegistry: game.rules,
    specialistRegistry: game.specialists,
    strategyNoteRegistry: game.strategyNotes,
    terrainFeatureRegistry: game.terrainFeatures,
    tileImprovementRegistry: game.tileImprovements,
    traitRegistry: game.traits,
    turn: game.turn,
    unitImprovementRegistry: game.unitImprovements,
    unitRegistry: game.units,
    workedTileRegistry: game.workedTiles,
});
exports.dependenciesFor = dependenciesFor;
// In the order `SimpleAIClient` has always made its decisions. With no `Priority` rules, the registry keeps this
//  order, so a strategy registered later (another plugin's) comes after all of these unless a `Priority` puts it
//  first.
const createStrategies = (dependencies, knowledge = knowledge_1.default) => [
    // `BeforeTurn`, all of them in turn.
    new SurveyTargets_1.default(dependencies, knowledge),
    new ReviewCities_1.default(dependencies, knowledge),
    new WakeCarrierAircraft_1.default(dependencies, knowledge),
    new StartRevolution_1.default(dependencies, knowledge),
    // A unit's turn: the first that handles it wins.
    new WaitForCarrier_1.default(dependencies, knowledge),
    new UnloadTransport_1.default(dependencies, knowledge),
    new FoundCapital_1.default(dependencies, knowledge),
    new TerrainWork_1.default(dependencies, knowledge, terrain_1.civ1TerrainPolicy),
    new WorkerTurn_1.default(dependencies, knowledge),
    new Garrison_1.default(dependencies, knowledge),
    new MissionAndMove_1.default(dependencies, knowledge),
    new StandDown_1.default(dependencies, knowledge, standDown_1.default),
    // The other mandatory choices.
    new BuildExplorerShip_1.default(dependencies, knowledge),
    new ChooseProduction_1.default(dependencies, knowledge),
    new ChooseResearch_1.default(dependencies, knowledge, wantedAdvances_1.default),
    new ChooseGovernment_1.default(dependencies, knowledge),
    // `chooseFromList`.
    new NegotiationAnswers_1.default(dependencies, knowledge),
    // `AfterTurn`, once the player's units have moved. The rates after the Entertainers, so that luxuries can make up
    //  for the cities they couldn't calm.
    new PreventDisorder_1.default(dependencies, knowledge, disorder_1.default),
    new TradeRates_1.default(dependencies, knowledge, disorder_1.default, tradeRates_1.default),
];
exports.createStrategies = createStrategies;
const register = (game) => game.strategies.register(...(0, exports.createStrategies)((0, exports.dependenciesFor)(game)));
exports.register = register;
// The plugin loader imports each package for this side effect, as it does `registerRules`.
(0, exports.register)(core_game_1.defaultGame);
exports.default = exports.register;
//# sourceMappingURL=registerStrategies.js.map