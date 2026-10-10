import {
  AbrahamLincoln,
  ElizabethI,
  GenghisKhan,
  MahatmaGandhi,
} from '@civ-clone/civ1-civilization/Leaders';
import { Despotism, Monarchy } from '@civ-clone/civ1-government/Governments';
import { Irrigation, Road } from '@civ-clone/civ1-world/TileImprovements';
import { Luxuries, Research, Tax } from '@civ-clone/civ1-trade-rate/TradeRates';
import AfterTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn';
import { CIVIL_DISORDER } from '@civ-clone/civ1-city-happiness/lib/cityStatus';
import {
  CeremonialBurial,
  NuclearPower,
  Recycling,
  Robotics,
} from '@civ-clone/civ1-science/Advances';
import City from '@civ-clone/core-city/City';
import Civilization from '@civ-clone/core-civilization/Civilization';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { Game } from '@civ-clone/core-game/Game';
import Leader from '@civ-clone/core-civilization/Leader';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import { PendingEffect } from '@civ-clone/core-pending-effect';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import PreventDisorder from '../Strategies/City/PreventDisorder';
import Tile from '@civ-clone/core-world/Tile';
import { TraitRegistry } from '@civ-clone/core-civilization/TraitRegistry';
import TradeRates from '../Strategies/Turn/TradeRates';
import cityHappinessRules from '@civ-clone/civ1-city-happiness/registerRules';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import civ1DisorderPolicy from '../lib/Civ1/disorder';
import civ1Knowledge from '../lib/Civ1/knowledge';
import civ1TradeRatePolicy from '../lib/Civ1/tradeRates';
import { createStrategies, dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import { inDisorder } from '../lib/City/disorder';
import { instance as memoryRegistryInstance } from '@civ-clone/base-strategy-ai/lib/MemoryRegistry';
import { personalityRules } from '@civ-clone/civ1-civilization/registerPersonality';
import registerTraits from '@civ-clone/civ1-civilization/registerTraits';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import tradeRateRules from '@civ-clone/civ1-trade-rate/registerRules';
import treasuryRules from '@civ-clone/civ1-treasury/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

type SetUp = {
  city: City;
  dependencies: Dependencies;
  game: Game;
  memory: Memory;
  player: Player;
  // `PreventDisorder` then `TradeRates`, as `StrategyAIClient` offers `AfterTurn` at the end of the player's turn.
  afterTurn: () => Promise<void>;
  // `TradeRates` alone.
  tradeRates: () => Promise<void>;
};

// One Civ1 player led by `leader`, on turn `turn`, with one city of `size` in the middle of a 5x5 map of Grassland
//  with a road on every tile, under Monarchy, so a city of 6 or more has an unhappy citizen for each citizen over 5,
//  and only Entertainers and luxuries to calm them. With `irrigated`, every tile gives 3 food; without, 2.
const setUp = async ({
  irrigated = true,
  leader = ElizabethI,
  rates = [5, 4, 1],
  size = 7,
  turn = 5,
}: {
  irrigated?: boolean;
  leader?: typeof Leader;
  // Science, tax and luxuries, in tenths.
  rates?: [number, number, number];
  size?: number;
  turn?: number;
} = {}): Promise<SetUp> => {
  const game = new Game();

  game.availableGovernments.register(Despotism, Monarchy);
  game.availableTradeRates.register(Luxuries, Research, Tax);
  registerTraits(game.traits);
  game.rules.register(...personalityRules(game.traits));

  cityRules(game);
  cityHappinessRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  tradeRateRules(game);
  treasuryRules(game);
  worldRules(game);

  while (game.turn.value() < turn) {
    game.turn.increment();
  }

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      '25G',
      5,
      5
    ),
    player = new Player(game.rules),
    playerResearch = new PlayerResearch(player, game.advances, game.rules),
    CivilizationType =
      leader.civilization() as unknown as new () => Civilization,
    civilization = new CivilizationType();

  civilization.setLeader(
    new (leader as unknown as new (registry: TraitRegistry) => Leader)(
      game.traits
    )
  );
  player.setCivilization(civilization);

  game.playerResearch.register(playerResearch);
  playerResearch.addAdvance(CeremonialBurial);
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerWorlds.getByPlayer(player).register(...world.entries());
  game.playerGovernments.getByPlayer(player).set(new Monarchy());
  game.playerTradeRates.getByPlayer(player).setAll([
    [Research, rates[0] * 10],
    [Tax, rates[1] * 10],
    [Luxuries, rates[2] * 10],
  ]);

  world.entries().forEach((tile: Tile): void => {
    game.tileImprovements.register(new Road(tile));

    if (irrigated) {
      game.tileImprovements.register(new Irrigation(tile));
    }
  });

  const city = new City(
      player,
      world.get(2, 2),
      'Test',
      game.rules,
      game.workedTiles
    ),
    cityGrowth = game.cityGrowth.getByCity(city);

  while (cityGrowth.size() < size) {
    cityGrowth.grow();
  }

  const dependencies = dependenciesFor(game),
    preventDisorder = new PreventDisorder(
      dependencies,
      civ1Knowledge,
      civ1DisorderPolicy
    ),
    tradeRates = new TradeRates(
      dependencies,
      civ1Knowledge,
      civ1DisorderPolicy,
      civ1TradeRatePolicy
    ),
    action = new AfterTurn(player, player);

  expect(tradeRates.handles(action)).true;

  return {
    afterTurn: async (): Promise<void> => {
      await preventDisorder.attempt(action);
      await tradeRates.attempt(action);
    },
    city,
    dependencies,
    game,
    memory: memoryRegistryInstance.memoryFor(player),
    player,
    tradeRates: async (): Promise<void> => {
      await tradeRates.attempt(action);
    },
  };
};

// The player's rates as `sci/tax/lux`, in percent.
const rates = ({ game, player }: SetUp): string => {
  const playerTradeRates = game.playerTradeRates.getByPlayer(player);

  return [Research, Tax, Luxuries]
    .map((Type): number => playerTradeRates.get(Type).value())
    .join('/');
};

const entertainers = ({ city, game }: SetUp): number =>
  game.specialists.getByCity(city).length;

const disorder = ({ city, dependencies }: SetUp): boolean =>
  inDisorder(dependencies, city);

describe('TradeRates', (): void => {
  it('should run straight after PreventDisorder', (): void => {
    const names = createStrategies(dependenciesFor(new Game())).map(
      (strategy): string => strategy.constructor.name
    );

    expect(names.indexOf('TradeRates')).to.equal(
      names.indexOf('PreventDisorder') + 1
    );
  });

  (
    [
      [AbrahamLincoln, '50/40/10'],
      [ElizabethI, '40/50/10'],
      [GenghisKhan, '30/60/10'],
    ] as [typeof Leader, string][]
  ).forEach(([leader, expected]) =>
    it(`should start ${leader.name} at Ideology + 3 science and 1 luxury, and so end its first turn at ${expected}`, async (): Promise<void> => {
      const setup = await setUp({
        leader,
        rates: [5, 5, 0],
        size: 1,
        turn: 1,
      });

      await setup.afterTurn();

      expect(rates(setup)).to.equal(expected);
    })
  );

  it("should set a later turn's rates from the ones the player has", async (): Promise<void> => {
    const setup = await setUp({
      leader: AbrahamLincoln,
      rates: [5, 5, 0],
      size: 1,
    });

    await setup.afterTurn();

    expect(rates(setup)).to.equal('60/40/0');
  });

  it('should stop science once Genghis Khan has Robotics', async (): Promise<void> => {
    const setup = await setUp({ leader: GenghisKhan, size: 1 });

    await setup.afterTurn();

    expect(rates(setup)).to.equal('30/60/10');

    setup.game.playerResearch.getByPlayer(setup.player).addAdvance(Robotics);

    await setup.afterTurn();

    expect(rates(setup)).to.equal('0/90/10');
  });

  it('should keep Gandhi researching after Robotics until he has Recycling and Nuclear Power', async (): Promise<void> => {
    const setup = await setUp({ leader: MahatmaGandhi, size: 1 }),
      playerResearch = setup.game.playerResearch.getByPlayer(setup.player);

    playerResearch.addAdvance(Robotics);
    playerResearch.addAdvance(Recycling);

    await setup.afterTurn();

    expect(rates(setup)).to.equal('40/50/10');

    playerResearch.addAdvance(NuclearPower);

    await setup.afterTurn();

    expect(rates(setup)).to.equal('0/90/10');
  });

  it('should add a luxury when a city was in disorder this turn', async (): Promise<void> => {
    const setup = await setUp({ size: 1 });

    setup.game.pendingEffects.register(
      new PendingEffect(CIVIL_DISORDER, setup.city)
    );

    await setup.afterTurn();

    expect(rates(setup)).to.equal('40/40/20');
  });

  it('should add a luxury, and calm the city with it, when Entertainers alone would starve it', async (): Promise<void> => {
    // Without irrigation, a second Entertainer would leave the city short of food (`PreventDisorder`'s `food`), and one
    //  isn't enough at 10% luxuries. At 20% it is.
    const setup = await setUp({ irrigated: false });

    expect(disorder(setup)).true;

    await setup.afterTurn();

    expect(rates(setup)).to.equal('40/40/20');
    expect(disorder(setup)).false;
    expect(entertainers(setup)).to.equal(1);
    expect(setup.memory.uncalmedCities.size).to.equal(0);
  });

  it('should not add a luxury for a city that will only grow into disorder', async (): Promise<void> => {
    const setup = await setUp({ size: 1 });

    setup.memory.uncalmedCities.set(setup.city, 'growth');

    await setup.tradeRates();

    expect(rates(setup)).to.equal('40/50/10');
  });

  it('should take a luxury away on every 4th turn while no city is on the edge of disorder', async (): Promise<void> => {
    const setup = await setUp({ rates: [3, 4, 3], size: 1, turn: 8 });

    await setup.afterTurn();

    expect(rates(setup)).to.equal('40/40/20');
  });

  it('should keep its luxuries while a city larger than 5 has as many happy citizens as unhappy ones', async (): Promise<void> => {
    // 2 unhappy, 2 happy and an Entertainer, at 30%.
    const setup = await setUp({ rates: [3, 4, 3], turn: 8 });

    await setup.afterTurn();

    expect(rates(setup)).to.equal('30/40/30');
    expect(disorder(setup)).false;
  });
});
