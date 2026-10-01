// Civ1: the strategy pack `SimpleAIClient` plays with, generic strategies given Civ1's `Knowledge` plus the Civ1 ones,
//  registered into a game's `StrategyRegistry`.
import { Game, defaultGame } from '@civ-clone/core-game';
import Dependencies, { createDependencies } from './lib/Dependencies';
import BuildExplorerShip from './Strategies/City/BuildExplorerShip';
import ChooseGovernment from './Strategies/Civ1/ChooseGovernment';
import ChooseProduction from './Strategies/Civ1/ChooseProduction';
import ChooseResearch from './Strategies/Science/ChooseResearch';
import FoundCapital from './Strategies/Unit/FoundCapital';
import Garrison from './Strategies/Unit/Garrison';
import Knowledge from './lib/Knowledge';
import MissionAndMove from './Strategies/Unit/MissionAndMove';
import NegotiationAnswers from './Strategies/Diplomacy/NegotiationAnswers';
import PreventDisorder from './Strategies/City/PreventDisorder';
import ReviewCities from './Strategies/Turn/ReviewCities';
import StartRevolution from './Strategies/Civ1/StartRevolution';
import Strategy from '@civ-clone/core-strategy/Strategy';
import SurveyTargets from './Strategies/Turn/SurveyTargets';
import TradeRates from './Strategies/Turn/TradeRates';
import UnloadTransport from './Strategies/Unit/UnloadTransport';
import WaitForCarrier from './Strategies/Unit/WaitForCarrier';
import WakeCarrierAircraft from './Strategies/Turn/WakeCarrierAircraft';
import WorkerTurn from './Strategies/Unit/WorkerTurn';
import civ1DisorderPolicy from './lib/Civ1/disorder';
import civ1Knowledge from './lib/Civ1/knowledge';
import civ1TradeRatePolicy from './lib/Civ1/tradeRates';

// The game's registries, as the strategies take them.
export const dependenciesFor = (game: Game): Dependencies =>
  createDependencies({
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

// In the order `SimpleAIClient` has always made its decisions. With no `Priority` rules, the registry keeps this
//  order, so a strategy registered later (another plugin's) comes after all of these unless a `Priority` puts it
//  first.
export const createStrategies = (
  dependencies: Dependencies,
  knowledge: Knowledge = civ1Knowledge
): Strategy[] => [
  // `BeforeTurn`, all of them in turn.
  new SurveyTargets(dependencies, knowledge),
  new ReviewCities(dependencies, knowledge),
  new WakeCarrierAircraft(dependencies, knowledge),
  new StartRevolution(dependencies, knowledge),
  // A unit's turn: the first that handles it wins.
  new WaitForCarrier(dependencies, knowledge),
  new UnloadTransport(dependencies, knowledge),
  new FoundCapital(dependencies, knowledge),
  new WorkerTurn(dependencies, knowledge),
  new Garrison(dependencies, knowledge),
  new MissionAndMove(dependencies, knowledge),
  // The other mandatory choices.
  new BuildExplorerShip(dependencies, knowledge),
  new ChooseProduction(dependencies, knowledge),
  new ChooseResearch(dependencies, knowledge),
  new ChooseGovernment(dependencies, knowledge),
  // `chooseFromList`.
  new NegotiationAnswers(dependencies, knowledge),
  // `AfterTurn`, once the player's units have moved. The rates after the Entertainers, so that luxuries can make up
  //  for the cities they couldn't calm.
  new PreventDisorder(dependencies, knowledge, civ1DisorderPolicy),
  new TradeRates(
    dependencies,
    knowledge,
    civ1DisorderPolicy,
    civ1TradeRatePolicy
  ),
];

export const register = (game: Game): void =>
  game.strategies.register(...createStrategies(dependenciesFor(game)));

// The plugin loader imports each package for this side effect, as it does `registerRules`.
register(defaultGame);

export default register;
