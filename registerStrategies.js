"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.dependenciesFor = exports.createStrategies = void 0;
// Civ1: the strategy pack `SimpleAIClient` plays with, generic strategies given Civ1's `Knowledge` plus the Civ1 ones,
//  registered into a game's `StrategyRegistry`.
const Ferry_1 = require("./Strategies/Unit/Ferry");
const TravelOverseas_1 = require("./Strategies/Unit/TravelOverseas");
const core_game_1 = require("@civ-clone/core-game");
const Dependencies_1 = require("@civ-clone/base-strategy-ai/lib/Dependencies");
const VictoryDependencies_1 = require("@civ-clone/base-strategy-victory/lib/VictoryDependencies");
const spaceRace_1 = require("./lib/Civ1/spaceRace");
const BuildSpaceship_1 = require("@civ-clone/base-strategy-victory/Strategies/City/BuildSpaceship");
const Explore_1 = require("@civ-clone/base-strategy-explore/Strategies/Unit/Explore");
const LaunchSpaceship_1 = require("@civ-clone/base-strategy-victory/Strategies/Turn/LaunchSpaceship");
const ResearchForGoal_1 = require("@civ-clone/base-strategy-victory/Strategies/Science/ResearchForGoal");
const defence_1 = require("./lib/Civ1/defence");
const SpaceRacePolicy_1 = require("@civ-clone/base-strategy-victory/lib/Space/SpaceRacePolicy");
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
const SpendTreasury_1 = require("./Strategies/City/SpendTreasury");
const StandDown_1 = require("./Strategies/Unit/StandDown");
const StartRevolution_1 = require("./Strategies/Civ1/StartRevolution");
const SurveyTargets_1 = require("./Strategies/Turn/SurveyTargets");
const TerrainWork_1 = require("@civ-clone/base-strategy-terrain-work/Strategies/Unit/TerrainWork");
const TradeRates_1 = require("./Strategies/Turn/TradeRates");
const UnloadTransport_1 = require("./Strategies/Unit/UnloadTransport");
const WaitForCarrier_1 = require("./Strategies/Unit/WaitForCarrier");
const WakeCarrierAircraft_1 = require("./Strategies/Turn/WakeCarrierAircraft");
const WorkerTurn_1 = require("./Strategies/Unit/WorkerTurn");
const moveUnit_1 = require("./lib/Unit/moveUnit");
const disorder_1 = require("./lib/Civ1/disorder");
const knowledge_1 = require("./lib/Civ1/knowledge");
const spending_1 = require("./lib/Civ1/spending");
const standDown_1 = require("./lib/Civ1/standDown");
const terrain_1 = require("./lib/Civ1/terrain");
const tradeRates_1 = require("./lib/Civ1/tradeRates");
// In the order `SimpleAIClient` has always made its decisions. With no `Priority` rules, the registry keeps this
//  order, so a strategy registered later (another plugin's) comes after all of these unless a `Priority` puts it
//  first.
//
// The goals a player plays to win by (`base-strategy-victory`): the space race (civ-clone/web-renderer#376). A capital
//  keeps a defender more while its player's ship is in flight.
const createStrategies = (dependencies, civ1 = knowledge_1.default, victoryDependencies = (0, VictoryDependencies_1.createVictoryDependencies)()) => {
    const knowledge = (0, spaceRace_1.withSpaceshipDefence)(civ1, victoryDependencies, defence_1.isCapital), spaceRace = (0, SpaceRacePolicy_1.spaceRaceGoal)(spaceRace_1.default), goals = [spaceRace];
    return [
        // `BeforeTurn`, all of them in turn.
        new SurveyTargets_1.default(dependencies, knowledge),
        new ReviewCities_1.default(dependencies, knowledge),
        new WakeCarrierAircraft_1.default(dependencies, knowledge),
        new StartRevolution_1.default(dependencies, knowledge),
        // A unit's turn: the first that handles it wins.
        new WaitForCarrier_1.default(dependencies, knowledge),
        new UnloadTransport_1.default(dependencies, knowledge),
        new Ferry_1.default(dependencies, knowledge),
        new TravelOverseas_1.default(dependencies, knowledge),
        new FoundCapital_1.default(dependencies, knowledge),
        new TerrainWork_1.default(dependencies, knowledge, terrain_1.civ1TerrainPolicy, moveUnit_1.travelToPathEnd),
        new WorkerTurn_1.default(dependencies, knowledge),
        new Garrison_1.default(dependencies, knowledge),
        new MissionAndMove_1.default(dependencies, knowledge),
        new StandDown_1.default(dependencies, knowledge, standDown_1.default),
        // The other mandatory choices.
        new BuildExplorerShip_1.default(dependencies, knowledge),
        new BuildSpaceship_1.default(dependencies, knowledge, spaceRace, goals, spaceRace_1.default, victoryDependencies),
        new ChooseProduction_1.default(dependencies, knowledge),
        new ResearchForGoal_1.default(dependencies, knowledge, goals, victoryDependencies),
        new ChooseResearch_1.default(dependencies, knowledge),
        new ChooseGovernment_1.default(dependencies, knowledge),
        // `chooseFromList`.
        new NegotiationAnswers_1.default(dependencies, knowledge),
        // `AfterTurn`, once the player's units have moved. The rates after the Entertainers, so that luxuries can make up
        //  for the cities they couldn't calm.
        new PreventDisorder_1.default(dependencies, knowledge, disorder_1.default),
        new TradeRates_1.default(dependencies, knowledge, disorder_1.default, tradeRates_1.default),
        // Last: what's left of the treasury once disorder has had its share, and with the rates for the turn ahead set from
        //  the treasury the player earned.
        new SpendTreasury_1.default(dependencies, knowledge, spending_1.default),
        // Once the turn's parts are on the ship.
        new LaunchSpaceship_1.default(dependencies, knowledge, spaceRace_1.default, victoryDependencies),
        // Standing orders for a player's units (`UnitOrder`): it handles none of the computer players' actions, so it
        //  changes nothing they do.
        new Explore_1.default(dependencies, knowledge),
    ];
};
exports.createStrategies = createStrategies;
// The game's registries, as the strategies take them: `base-strategy-ai`'s, exported from here as it always was, for
//  the callers that import it from here (the arena among them).
exports.dependenciesFor = Dependencies_1.dependenciesFor;
const register = (game) => game.strategies.register(...(0, exports.createStrategies)((0, exports.dependenciesFor)(game), knowledge_1.default, (0, VictoryDependencies_1.victoryDependenciesFor)(game)));
exports.register = register;
// The plugin loader imports each package for this side effect, as it does `registerRules`.
(0, exports.register)(core_game_1.defaultGame);
exports.default = exports.register;
//# sourceMappingURL=registerStrategies.js.map