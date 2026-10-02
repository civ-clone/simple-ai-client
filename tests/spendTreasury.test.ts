import { Colossus, Pyramids } from '@civ-clone/civ1-wonder/Wonders';
import {
  BronzeWorking,
  CeremonialBurial,
  Masonry,
  Writing,
} from '@civ-clone/civ1-science/Advances';
import { Diplomat, Settlers, Warrior } from '@civ-clone/civ1-unit/Units';
import spendTreasury, {
  SpendingPolicy,
  purchases,
} from '../lib/City/spendTreasury';
import AfterTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn';
import Buildable from '@civ-clone/core-city-build/Buildable';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Spend from '@civ-clone/core-treasury/Rules/Spend';
import SpendCost from '@civ-clone/core-treasury/SpendCost';
import { buildCost } from '@civ-clone/core-city-build/Rules/BuildCost';
import City from '@civ-clone/core-city/City';
import Dependencies from '../lib/Dependencies';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import { Game } from '@civ-clone/core-game/Game';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import { Monarchy } from '@civ-clone/civ1-government/Governments';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerTreasury from '@civ-clone/core-treasury/PlayerTreasury';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import { Production } from '@civ-clone/civ1-world/Yields';
import SpendTreasury from '../Strategies/City/SpendTreasury';
import { Temple } from '@civ-clone/civ1-city-improvement/CityImprovements';
import TradeRates from '../Strategies/Turn/TradeRates';
import World from '@civ-clone/core-world/World';
import { Unhappiness } from '@civ-clone/library-city/Yields';
import Yield from '@civ-clone/core-yield/Yield';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import civ1Knowledge from '../lib/Civ1/knowledge';
import civ1SpendingPolicy from '../lib/Civ1/spending';
import { createStrategies, dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import treasuryRules from '@civ-clone/civ1-treasury/registerRules';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import wonderRules from '@civ-clone/civ1-wonder/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

// Keeps 100 gold back, buys an improvement or Settlers the city would take 5 turns or more to finish, and a Wonder with
//  a quarter or less of it left to build.
const policy: SpendingPolicy = {
  reserve: (): number => 100,
  minTurns: 5,
  wonderRemaining: 0.25,
};

type SetUp = {
  dependencies: Dependencies;
  game: Game;
  player: Player;
  treasury: PlayerTreasury;
  world: World;
  // A city of `size` at (`x`, 2), making `shields` net shields, building `item` with `progress` shields in it, with a
  //  fortified Warrior in it if `defended`, and `unhappy` unhappy citizens.
  city: (options: {
    x: number;
    item: IBuildable;
    progress?: number;
    shields?: number;
    size?: number;
    defended?: boolean;
    unhappy?: number;
  }) => City;
  // What the player's cities are building, by city, once it has spent.
  spend: () => number;
};

// One Civ1 player under Monarchy on a strip of Grassland, who knows enough to build Warriors, Settlers, Temples, the
//  Pyramids and the Colossus.
const setUp = async (gold: number): Promise<SetUp> => {
  const game = new Game();

  game.availableCityBuildItems.register(
    ...([
      Warrior,
      Settlers,
      Diplomat,
      Temple,
      Pyramids,
      Colossus,
    ] as IBuildable[])
  );

  cityRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  treasuryRules(game);
  unitRules(game);
  wonderRules(game);
  worldRules(game);

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      '50G',
      5,
      10
    ),
    player = new Player(game.rules),
    playerResearch = new PlayerResearch(player, game.advances, game.rules);

  game.playerResearch.register(playerResearch);
  playerResearch.addAdvance(BronzeWorking);
  playerResearch.addAdvance(CeremonialBurial);
  playerResearch.addAdvance(Masonry);
  playerResearch.addAdvance(Writing);
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerWorlds.getByPlayer(player).register(...world.entries());
  game.playerGovernments.getByPlayer(player).set(new Monarchy());

  const [treasury] = game.playerTreasuries.getByPlayer(player),
    dependencies = dependenciesFor(game);

  treasury.set(gold);

  return {
    city: ({
      x,
      item,
      progress = 1,
      shields = 1,
      size = 1,
      defended = true,
      unhappy = 0,
    }) => {
      const city = new City(
          player,
          world.get(x, 2),
          '',
          game.rules,
          game.workedTiles
        ),
        cityGrowth = game.cityGrowth.getByCity(city),
        cityBuild = game.cityBuilds.getByCity(city);

      while (cityGrowth.size() < size) {
        cityGrowth.grow();
      }

      if (defended) {
        game.unitImprovements.register(
          new Fortified(new Warrior(city, player, city.tile(), game.rules))
        );
      }

      city.yields = () => [
        new Production(shields),
        ...(unhappy > 0 ? [new Unhappiness(unhappy)] : []),
      ];
      cityBuild.build(item);

      if (progress > 0) {
        cityBuild.add(new Yield(progress));
      }

      return city;
    },
    dependencies,
    game,
    player,
    spend: (): number =>
      spendTreasury(dependencies, civ1Knowledge, policy, player),
    treasury,
    world,
  };
};

// Whether `city`'s build has been bought: it has the shields to finish it.
const bought = ({ game }: SetUp, city: City): boolean =>
  game.cityBuilds.getByCity(city).remaining() <= 0;

// The ruleset's price for what `city` is building now.
const price = ({ player, dependencies }: SetUp, city: City): number =>
  purchases(dependencies, civ1Knowledge, policy, player).find(
    (purchase) => purchase.city === city
  )?.price ?? NaN;

describe('spendTreasury (civ-clone/web-renderer#233)', (): void => {
  it('should buy an improvement a city would take long to finish, keeping the reserve', async (): Promise<void> => {
    // A Temple is 40 shields: 39 left at 1 a turn, for 2 gold a shield.
    const setup = await setUp(100 + 78),
      city = setup.city({ x: 1, item: Temple });

    expect(price(setup, city)).to.equal(78);
    expect(setup.spend()).to.equal(78);
    expect(bought(setup, city)).true;
    expect(setup.treasury.value()).to.equal(100);
  });

  it('should not spend into the reserve', async (): Promise<void> => {
    const setup = await setUp(100 + 77),
      city = setup.city({ x: 1, item: Temple });

    expect(setup.spend()).to.equal(0);
    expect(bought(setup, city)).false;
    expect(setup.treasury.value()).to.equal(177);
  });

  it('should not buy a build the city has put no shields into, at double the price', async (): Promise<void> => {
    const setup = await setUp(1000),
      city = setup.city({ x: 1, item: Temple, progress: 0 });

    expect(setup.spend()).to.equal(0);
    expect(bought(setup, city)).false;
  });

  it('should not buy what the city will finish soon anyway', async (): Promise<void> => {
    // 39 shields left at 10 a turn: 4 turns.
    const setup = await setUp(1000),
      city = setup.city({ x: 1, item: Temple, shields: 10 });

    expect(setup.spend()).to.equal(0);
    expect(bought(setup, city)).false;
  });

  it('should buy a defender for a city that has none first', async (): Promise<void> => {
    // Enough over the reserve for the Warrior (9 left: 5 × 0.9² + 20 × 0.9 = 22) or the Temple (78), not both.
    const setup = await setUp(100 + 80),
      temple = setup.city({ x: 1, item: Temple }),
      warrior = setup.city({ x: 5, item: Warrior, defended: false });

    setup.spend();

    expect(bought(setup, warrior)).true;
    expect(bought(setup, temple)).false;
  });

  // A Diplomat can't defend a city, nor (attacking nothing) keep order in one.
  it('should not buy a unit that would not defend a city short of a defender', async (): Promise<void> => {
    const setup = await setUp(1000),
      city = setup.city({ x: 1, item: Diplomat, defended: false });

    expect(setup.spend()).to.equal(0);
    expect(bought(setup, city)).false;
  });

  it('should buy a unit that martial law would use, in a city short of one', async (): Promise<void> => {
    // Under Monarchy, with a defender and two unhappy citizens: martial law could use two more units.
    const setup = await setUp(1000),
      warrior = setup.city({ x: 1, item: Warrior, unhappy: 2 }),
      diplomat = setup.city({ x: 5, item: Diplomat, unhappy: 2 });

    setup.spend();

    expect(bought(setup, warrior)).true;
    expect(bought(setup, diplomat)).false;
  });

  it('should not buy a unit other than a missing defender', async (): Promise<void> => {
    const setup = await setUp(1000),
      city = setup.city({ x: 1, item: Warrior });

    expect(setup.spend()).to.equal(0);
    expect(bought(setup, city)).false;
  });

  it('should buy for the city that makes the fewest shields first', async (): Promise<void> => {
    const setup = await setUp(100 + 80),
      faster = setup.city({ x: 1, item: Temple, shields: 3 }),
      slower = setup.city({ x: 5, item: Temple, shields: 1 });

    setup.spend();

    expect(bought(setup, slower)).true;
    expect(bought(setup, faster)).false;
  });

  it('should go on to the next purchase it can afford when one costs too much', async (): Promise<void> => {
    // The Temple at 1 shield a turn comes first, but only the one at 2 is affordable.
    const setup = await setUp(100 + 60),
      first = setup.city({ x: 1, item: Temple, shields: 1 }),
      second = setup.city({ x: 5, item: Temple, shields: 2, progress: 11 });

    setup.spend();

    expect(bought(setup, first)).false;
    expect(bought(setup, second)).true;
  });

  it('should buy Settlers in a city that can spare the citizen', async (): Promise<void> => {
    const setup = await setUp(1000),
      small = setup.city({ x: 1, item: Settlers }),
      large = setup.city({ x: 5, item: Settlers, size: 2 });

    setup.spend();

    expect(bought(setup, small)).false;
    expect(bought(setup, large)).true;
  });

  it('should not buy anything a city can build that is neither a unit nor an improvement', async (): Promise<void> => {
    // As Civ1's spaceship parts are, which `civ1-spaceship` prices too.
    class Gadget extends Buildable {}

    const setup = await setUp(1000);

    setup.game.availableCityBuildItems.register(Gadget);
    setup.game.rules.register(
      ...buildCost(Gadget, 40),
      new Spend(
        new Criterion(
          (cityBuild: CityBuild): boolean =>
            cityBuild.building()?.item() === Gadget
        ),
        new Effect(
          (cityBuild: CityBuild): SpendCost =>
            new SpendCost(setup.treasury.yield(), cityBuild.remaining() * 2)
        )
      )
    );

    const city = setup.city({ x: 1, item: Gadget });

    expect(setup.spend()).to.equal(0);
    expect(bought(setup, city)).false;
  });

  it('should not buy a Wonder until no more than a quarter of it is left', async (): Promise<void> => {
    // The Pyramids are 300 shields and the Colossus 200.
    const setup = await setUp(10000),
      pyramids = setup.city({ x: 1, item: Pyramids, progress: 220 }),
      colossus = setup.city({ x: 5, item: Colossus, progress: 150 });

    setup.spend();

    expect(bought(setup, pyramids)).false;
    expect(bought(setup, colossus)).true;
  });

  it('should buy an improvement before a Wonder that is nearly done', async (): Promise<void> => {
    // Over the reserve, enough for the Temple (78) or the Colossus (50 shields left: 100), not both.
    const setup = await setUp(100 + 100),
      temple = setup.city({ x: 1, item: Temple }),
      colossus = setup.city({ x: 5, item: Colossus, progress: 150 });

    setup.spend();

    expect(bought(setup, temple)).true;
    expect(bought(setup, colossus)).false;
  });

  it("should keep 30 gold and 10 more for each city, by Civ1's policy", async (): Promise<void> => {
    const setup = await setUp(1000);

    setup.city({ x: 1, item: Temple });
    setup.city({ x: 5, item: Temple });

    expect(
      civ1SpendingPolicy.reserve(setup.dependencies, setup.player)
    ).to.equal(50);
  });

  it('should spend at the end of the turn, after the trade rates are set', async (): Promise<void> => {
    const setup = await setUp(1000),
      city = setup.city({ x: 1, item: Temple }),
      strategies = createStrategies(setup.dependencies),
      spender = strategies.findIndex(
        (strategy): boolean => strategy instanceof SpendTreasury
      ),
      strategy = strategies[spender] as SpendTreasury,
      action = new AfterTurn(setup.player, setup.player);

    expect(spender).greaterThan(
      strategies.findIndex(
        (strategy): boolean => strategy instanceof TradeRates
      )
    );
    expect(strategy.handles(action)).true;
    expect(strategy.attempt(action)).true;
    expect(bought(setup, city)).true;
  });
});
