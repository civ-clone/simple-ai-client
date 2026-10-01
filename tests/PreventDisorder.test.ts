import {
  CIVIL_DISORDER,
  civilDisorder,
} from '@civ-clone/civ1-city-happiness/lib/cityStatus';
import {
  Cathedral,
  Colosseum,
  Marketplace,
  Temple,
} from '@civ-clone/civ1-city-improvement/CityImprovements';
import { CeremonialBurial, Currency } from '@civ-clone/civ1-science/Advances';
import { Despotism, Monarchy } from '@civ-clone/civ1-government/Governments';
import {
  calmCity,
  inDisorder,
  leastValuableWorkedTiles,
} from '../lib/City/disorder';
import AfterTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn';
import City from '@civ-clone/core-city/City';
import Dependencies from '../lib/Dependencies';
import { Food } from '@civ-clone/library-city/Yields';
import { Game } from '@civ-clone/core-game/Game';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import { Irrigation } from '@civ-clone/civ1-world/TileImprovements';
import Memory from '../lib/Memory';
import { PendingEffect } from '@civ-clone/core-pending-effect';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import PreventDisorder from '../Strategies/City/PreventDisorder';
import { Hills } from '@civ-clone/civ1-world/Terrains';
import Tile from '@civ-clone/core-world/Tile';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import WorkedTile from '@civ-clone/core-city/WorkedTile';
import Yield from '@civ-clone/core-yield/Yield';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityHappinessRules from '@civ-clone/civ1-city-happiness/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import civ1DisorderPolicy from '../lib/Civ1/disorder';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import { instance as memoryRegistryInstance } from '../lib/MemoryRegistry';
import playerTurnStart from '@civ-clone/civ1-player/Rules/Player/turn-start';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import reviewCities from '../lib/Turn/reviewCities';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import treasuryRules from '@civ-clone/civ1-treasury/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

type SetUp = {
  city: City;
  dependencies: Dependencies;
  game: Game;
  memory: Memory;
  player: Player;
  // Runs the strategy, as `StrategyAIClient` does at the end of the player's turn.
  afterTurn: () => Promise<boolean>;
};

// One Civ1 player with one city of `size` in the middle of a 5x5 map of Grassland, under Monarchy (no martial law, as
//  no unit is in it), so a city of 6 or more has an unhappy citizen for each citizen over 5 and nothing to calm them.
//  With `irrigated`, every tile gives 3 food; without, 2.
const setUp = async ({
  irrigated = true,
  map = '25G',
  size = 7,
}: {
  irrigated?: boolean;
  map?: string;
  size?: number;
} = {}): Promise<SetUp> => {
  const game = new Game();

  game.availableGovernments.register(Despotism, Monarchy);
  game.availableCityBuildItems.register(
    ...([Cathedral, Colosseum, Marketplace, Temple] as IBuildable[])
  );

  cityRules(game);
  cityHappinessRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  treasuryRules(game);
  worldRules(game);
  game.rules.register(...playerTurnStart(game.rules, game.cities, game.units));

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      map,
      5,
      5
    ),
    player = new Player(game.rules),
    playerResearch = new PlayerResearch(player, game.advances, game.rules);

  game.playerResearch.register(playerResearch);
  playerResearch.addAdvance(CeremonialBurial);
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerWorlds.getByPlayer(player).register(...world.entries());
  game.playerGovernments.getByPlayer(player).set(new Monarchy());

  if (irrigated) {
    world
      .entries()
      .forEach((tile: Tile): void =>
        game.tileImprovements.register(new Irrigation(tile))
      );
  }

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
    strategy = new PreventDisorder(
      dependencies,
      civ1Knowledge,
      civ1DisorderPolicy
    );

  return {
    afterTurn: async (): Promise<boolean> => {
      const action = new AfterTurn(player, player);

      expect(strategy.handles(action)).true;

      return strategy.attempt(action);
    },
    city,
    dependencies,
    game,
    memory: memoryRegistryInstance.memoryFor(player),
    player,
  };
};

const entertainers = ({ city, game }: SetUp): number =>
  game.specialists.getByCity(city).length;

const food = ({ city }: SetUp): number => reduceYield(city.yields(), Food);

const disorder = ({ city, dependencies }: SetUp): boolean =>
  inDisorder(dependencies, city);

// Why each of the player's cities was left in disorder, if it was. Engine objects are never handed to `expect`, whose
//  failure messages would walk their whole object graph.
const uncalmed = ({ city, memory }: SetUp): string[] =>
  [...memory.uncalmedCities].map(([uncalmedCity, reason]): string =>
    uncalmedCity === city ? reason : `another city: ${reason}`
  );

describe('PreventDisorder', (): void => {
  it('should make Entertainers until an unhappy city is calm', async (): Promise<void> => {
    const setup = await setUp();

    expect(disorder(setup)).true;

    await setup.afterTurn();

    expect(disorder(setup)).false;
    expect(entertainers(setup)).to.equal(2);
    expect(setup.memory.uncalmedCities.size).to.equal(0);
  });

  it('should take Entertainers from the worked tiles that give the least food first', async (): Promise<void> => {
    // Hills all round, but for the four Grassland next to the city, so a city of 7 works three Hills, which give less
    //  food than Grassland.
    //   01234
    // 0 HHHHH
    // 1 HHGHH
    // 2 HGGGH
    // 3 HHGHH
    // 4 HHHHH
    const setup = await setUp({ map: '7HG3H3G3HG7H' }),
      { city, dependencies, game } = setup,
      worked = (): Tile[] =>
        game.workedTiles
          .getByCity(city)
          .map((workedTile: WorkedTile): Tile => workedTile.tile())
          .filter((tile: Tile): boolean => tile !== city.tile()),
      isHills = (tile: Tile): boolean => tile.terrain() instanceof Hills,
      before = worked();

    expect(before.filter(isHills).length).to.equal(3);
    expect(
      leastValuableWorkedTiles(dependencies, city).slice(0, 3).every(isHills)
    ).true;

    await setup.afterTurn();

    const after = worked(),
      taken = before.filter((tile: Tile): boolean => !after.includes(tile));

    expect(disorder(setup)).false;
    expect(taken.length).to.equal(2);
    expect(taken.every(isHills)).true;
  });

  it('should leave a city in disorder, and say so, rather than starve it', async (): Promise<void> => {
    const setup = await setUp({ irrigated: false });

    // One Entertainer leaves it 2 food short of what the second would take.
    expect(food(setup)).to.equal(3);
    expect(disorder(setup)).true;

    await setup.afterTurn();

    expect(disorder(setup)).true;
    expect(entertainers(setup)).to.equal(0);
    expect(food(setup)).to.equal(3);
    expect(uncalmed(setup)).to.deep.equal(['food']);
  });

  it('should put Entertainers back to work once the city is calm without them', async (): Promise<void> => {
    const setup = await setUp();

    await setup.afterTurn();

    expect(entertainers(setup)).to.equal(2);

    // A Temple makes one of its two unhappy citizens content.
    setup.game.cityImprovements.register(
      new Temple(setup.city, setup.game.rules)
    );

    await setup.afterTurn();

    expect(disorder(setup)).false;
    expect(entertainers(setup)).to.equal(1);
  });

  it('should calm a city that will grow into disorder before it grows', async (): Promise<void> => {
    const setup = await setUp({ size: 6 }),
      cityGrowth = setup.game.cityGrowth.getByCity(setup.city);

    // One unhappy citizen at 6, two at 7.
    expect(disorder(setup)).true;

    await setup.afterTurn();

    expect(entertainers(setup)).to.equal(1);

    cityGrowth.progress().set(cityGrowth.cost().value() - 1);

    expect(
      calmCity(
        setup.dependencies,
        civ1Knowledge,
        setup.city,
        civ1DisorderPolicy
      )
    ).null;
    expect(entertainers(setup)).to.equal(2);

    cityGrowth.grow();

    expect(disorder(setup)).false;
  });

  it('should let a city grow into a turn of disorder rather than stop it growing', async (): Promise<void> => {
    const setup = await setUp({ size: 6 }),
      { city, dependencies, game } = setup,
      cityGrowth = game.cityGrowth.getByCity(city);

    await setup.afterTurn();

    expect(entertainers(setup)).to.equal(1);

    // It grows with no food to spare, so the second Entertainer it would want at 7 would stop it growing.
    cityGrowth.progress().set(cityGrowth.cost().value() - food(setup));

    expect(
      calmCity(dependencies, civ1Knowledge, city, civ1DisorderPolicy)
    ).to.equal('growth');
    // Still calm as it stands.
    expect(entertainers(setup)).to.equal(1);
    expect(disorder(setup)).false;

    await setup.afterTurn();

    expect(uncalmed(setup)).to.deep.equal(['growth']);
  });

  it('should build a Temple in a city that was in disorder, and hurry it with an eighth of the treasury', async (): Promise<void> => {
    const setup = await setUp(),
      { city, game, player } = setup,
      cityBuild = game.cityBuilds.getByCity(city),
      treasury = game.playerTreasuries.getByPlayer(player)[0];

    game.pendingEffects.register(new PendingEffect(CIVIL_DISORDER, city));
    treasury.set(800);

    await setup.afterTurn();

    // A Temple costs 40 shields, 4 gold each with none built yet: 160, more than 100. 100 buys 25 of them.
    expect(cityBuild.building()!.item()).to.equal(Temple);
    expect(cityBuild.progress().value()).to.equal(25);
    expect(treasury.value()).to.equal(700);
  });

  it('should buy the whole improvement when an eighth of the treasury covers it', async (): Promise<void> => {
    const setup = await setUp(),
      { city, game, player } = setup,
      cityBuild = game.cityBuilds.getByCity(city),
      treasury = game.playerTreasuries.getByPlayer(player)[0];

    game.pendingEffects.register(new PendingEffect(CIVIL_DISORDER, city));
    game.cityImprovements.register(new Temple(city, game.rules));
    game.playerResearch.getByPlayer(player).addAdvance(Currency);
    // 10 shields towards something else, which go towards the Marketplace: 70 left, at 2 gold each.
    cityBuild.add(new Yield(10));
    treasury.set(1200);

    await setup.afterTurn();

    expect(cityBuild.building()!.item()).to.equal(Marketplace);
    expect(cityBuild.remaining()).to.equal(0);
    expect(treasury.value()).to.equal(1200 - 140);
  });

  it('should not switch production in a city that was not in disorder', async (): Promise<void> => {
    const setup = await setUp(),
      { city, game, player } = setup,
      treasury = game.playerTreasuries.getByPlayer(player)[0];

    treasury.set(800);

    await setup.afterTurn();

    expect(game.cityBuilds.getByCity(city).building() === null).true;
    expect(treasury.value()).to.equal(800);
  });

  it("should keep a calmed city's Entertainers through to the engine's check at its next turn start", async (): Promise<void> => {
    const setup = await setUp(),
      { city, dependencies, game, memory, player } = setup,
      events: City[] = [];

    game.engine.on('city:civil-disorder', (city: City): void => {
      events.push(city);
    });

    // The end of the player's turn.
    await setup.afterTurn();

    expect(entertainers(setup)).to.equal(2);

    // Its next turn: the engine's turn start rules (yields, growth, production, then disorder), then the AI's
    //  `BeforeTurn`, which assigns workers.
    game.rules.process(TurnStart, player);

    expect(events.length).to.equal(0);
    expect(civilDisorder(city, game.pendingEffects) === null).true;

    reviewCities(dependencies, player, memory, civ1Knowledge);

    expect(entertainers(setup)).to.equal(2);
    expect(disorder(setup)).false;
  });

  it('should be in disorder at its next turn start without it', async (): Promise<void> => {
    const setup = await setUp(),
      { city, game, player } = setup;

    game.rules.process(TurnStart, player);

    expect(civilDisorder(city, game.pendingEffects) === null).false;
  });
});
