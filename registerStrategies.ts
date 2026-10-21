// Civ1: the strategy pack `SimpleAIClient` plays with, generic strategies given Civ1's `Knowledge` plus the Civ1 ones,
//  registered into a game's `StrategyRegistry`.
import Ferry from './Strategies/Unit/Ferry';
import TravelOverseas from './Strategies/Unit/TravelOverseas';
import { Game, defaultGame } from '@civ-clone/core-game';
import Dependencies, {
  dependenciesFor as gameDependencies,
} from '@civ-clone/base-strategy-ai/lib/Dependencies';
import {
  VictoryDependencies,
  createVictoryDependencies,
  victoryDependenciesFor,
} from '@civ-clone/base-strategy-victory/lib/VictoryDependencies';
import civ1ConquestPolicy, {
  conquestProductionPolicy,
} from './lib/Civ1/conquest';
import civ1SpaceRacePolicy, {
  withSpaceshipDefence,
} from './lib/Civ1/spaceRace';
import Campaign from '@civ-clone/base-strategy-victory/Strategies/Unit/Campaign';
import { conquestGoal } from '@civ-clone/base-strategy-victory/lib/Conquest/ConquestPolicy';
import { defaultProductionPolicy } from './lib/Civ1/buildItemInCity';
import { goalFor } from '@civ-clone/base-strategy-victory/lib/goal';
import BuildSpaceship from '@civ-clone/base-strategy-victory/Strategies/City/BuildSpaceship';
import Explore from '@civ-clone/base-strategy-explore/Strategies/Unit/Explore';
import LaunchSpaceship from '@civ-clone/base-strategy-victory/Strategies/Turn/LaunchSpaceship';
import ResearchForGoal from '@civ-clone/base-strategy-victory/Strategies/Science/ResearchForGoal';
import { isCapital } from './lib/Civ1/defence';
import { spaceRaceGoal } from '@civ-clone/base-strategy-victory/lib/Space/SpaceRacePolicy';
import BuildExplorerShip from './Strategies/City/BuildExplorerShip';
import ChooseGovernment from './Strategies/Civ1/ChooseGovernment';
import ChooseProduction from './Strategies/Civ1/ChooseProduction';
import ChooseResearch from './Strategies/Science/ChooseResearch';
import FoundCapital from './Strategies/Unit/FoundCapital';
import Garrison from './Strategies/Unit/Garrison';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import MissionAndMove from './Strategies/Unit/MissionAndMove';
import NegotiationAnswers from './Strategies/Diplomacy/NegotiationAnswers';
import PreventDisorder from './Strategies/City/PreventDisorder';
import ReviewCities from './Strategies/Turn/ReviewCities';
import SpendTreasury from './Strategies/City/SpendTreasury';
import StandDown from './Strategies/Unit/StandDown';
import StartRevolution from './Strategies/Civ1/StartRevolution';
import Strategy from '@civ-clone/core-strategy/Strategy';
import SurveyTargets from './Strategies/Turn/SurveyTargets';
import TerrainWork from '@civ-clone/base-strategy-terrain-work/Strategies/Unit/TerrainWork';
import TradeRates from './Strategies/Turn/TradeRates';
import UnloadTransport from './Strategies/Unit/UnloadTransport';
import WaitForCarrier from './Strategies/Unit/WaitForCarrier';
import WakeCarrierAircraft from './Strategies/Turn/WakeCarrierAircraft';
import WorkerTurn from './Strategies/Unit/WorkerTurn';
import { travelToPathEnd } from './lib/Unit/moveUnit';
import civ1DisorderPolicy from './lib/Civ1/disorder';
import civ1Knowledge from './lib/Civ1/knowledge';
import civ1SpendingPolicy from './lib/Civ1/spending';
import civ1StandDownPolicy from './lib/Civ1/standDown';
import { civ1TerrainPolicy } from './lib/Civ1/terrain';
import civ1TradeRatePolicy from './lib/Civ1/tradeRates';

// In the order `SimpleAIClient` has always made its decisions. With no `Priority` rules, the registry keeps this
//  order, so a strategy registered later (another plugin's) comes after all of these unless a `Priority` puts it
//  first.
//
// The goals a player plays to win by (`base-strategy-victory`): the space race (civ-clone/web-renderer#376) and
//  conquest (civ-clone/web-renderer#377). A capital keeps a defender more while its player's ship is in flight, and a
//  player builds more attackers while it plays for conquest.
export const createStrategies = (
  dependencies: Dependencies,
  civ1: Knowledge = civ1Knowledge,
  victoryDependencies: VictoryDependencies = createVictoryDependencies()
): Strategy[] => {
  const knowledge = withSpaceshipDefence(civ1, victoryDependencies, isCapital),
    spaceRace = spaceRaceGoal(civ1SpaceRacePolicy),
    conquest = conquestGoal(civ1ConquestPolicy),
    goals = [spaceRace, conquest];

  return [
    // `BeforeTurn`, all of them in turn.
    new SurveyTargets(dependencies, knowledge),
    new ReviewCities(dependencies, knowledge),
    new WakeCarrierAircraft(dependencies, knowledge),
    new StartRevolution(dependencies, knowledge),
    // A unit's turn: the first that handles it wins.
    new WaitForCarrier(dependencies, knowledge),
    new UnloadTransport(dependencies, knowledge),
    new Ferry(dependencies, knowledge),
    new TravelOverseas(dependencies, knowledge),
    new FoundCapital(dependencies, knowledge),
    new TerrainWork(
      dependencies,
      knowledge,
      civ1TerrainPolicy,
      travelToPathEnd
    ),
    new WorkerTurn(dependencies, knowledge),
    new Garrison(dependencies, knowledge),
    new MissionAndMove(dependencies, knowledge),
    // The attackers with nothing else to do gather for the campaign, if there is one.
    new Campaign(
      dependencies,
      knowledge,
      conquest,
      goals,
      civ1ConquestPolicy,
      victoryDependencies,
      travelToPathEnd
    ),
    new StandDown(dependencies, knowledge, civ1StandDownPolicy),
    // The other mandatory choices.
    new BuildExplorerShip(dependencies, knowledge),
    new BuildSpaceship(
      dependencies,
      knowledge,
      spaceRace,
      goals,
      civ1SpaceRacePolicy,
      victoryDependencies
    ),
    new ChooseProduction(dependencies, knowledge, (player) =>
      goalFor(goals, dependencies, victoryDependencies, player) === conquest
        ? conquestProductionPolicy
        : defaultProductionPolicy
    ),
    new ResearchForGoal(dependencies, knowledge, goals, victoryDependencies),
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
    // Last: what's left of the treasury once disorder has had its share, and with the rates for the turn ahead set from
    //  the treasury the player earned.
    new SpendTreasury(dependencies, knowledge, civ1SpendingPolicy),
    // Once the turn's parts are on the ship.
    new LaunchSpaceship(
      dependencies,
      knowledge,
      civ1SpaceRacePolicy,
      victoryDependencies
    ),
    // Standing orders for a player's units (`UnitOrder`): it handles none of the computer players' actions, so it
    //  changes nothing they do.
    new Explore(dependencies, knowledge),
  ];
};

// The game's registries, as the strategies take them: `base-strategy-ai`'s, exported from here as it always was, for
//  the callers that import it from here (the arena among them).
export const dependenciesFor = gameDependencies;

export const register = (game: Game): void =>
  game.strategies.register(
    ...createStrategies(
      dependenciesFor(game),
      civ1Knowledge,
      victoryDependenciesFor(game)
    )
  );

// The plugin loader imports each package for this side effect, as it does `registerRules`.
register(defaultGame);

export default register;
