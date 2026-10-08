import {
  Cathedral,
  Colosseum,
  Marketplace,
  Temple,
} from '@civ-clone/civ1-city-improvement/CityImprovements';
import { Monarchy, Republic } from '@civ-clone/civ1-government/Governments';
import { ShakespearesTheatre } from '@civ-clone/civ1-wonder/Wonders';
import {
  defendersIn,
  keepsOrder,
  martialLawUnitsIn,
  martialLawUnitsWanted,
  wantsMartialLawUnit,
} from '../lib/City/defence';
import { Diplomat, Warrior } from '@civ-clone/civ1-unit/Units';
import AfterTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn';
import { CeremonialBurial } from '@civ-clone/civ1-science/Advances';
import City from '@civ-clone/core-city/City';
import Dependencies, { createDependencies } from '../lib/Dependencies';
import { Fortify } from '@civ-clone/civ1-unit/Actions';
import { Game } from '@civ-clone/core-game/Game';
import Government from '@civ-clone/core-government/Government';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import { Irrigation } from '@civ-clone/civ1-world/TileImprovements';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import PreventDisorder from '../Strategies/City/PreventDisorder';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import cityHappinessRules from '@civ-clone/civ1-city-happiness/registerRules';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import civ1DisorderPolicy from '../lib/Civ1/disorder';
import buildItemInCity, {
  defaultProductionPolicy,
} from '../lib/Civ1/buildItemInCity';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { createMemory } from '../lib/Memory';
import { dependenciesFor } from '../registerStrategies';
import * as spies from 'chai-spies';
import { expect, spy, use } from 'chai';
import garrison from '../lib/Unit/garrison';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import { inDisorder } from '../lib/City/disorder';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import treasuryRules from '@civ-clone/civ1-treasury/registerRules';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import wonderRules from '@civ-clone/civ1-wonder/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

use(spies);

type SetUp = {
  city: City;
  dependencies: Dependencies;
  game: Game;
  player: Player;
  // Adds a Warrior, supported by the city, on its tile.
  addWarrior: () => Unit;
  // Runs `PreventDisorder`, as `StrategyAIClient` does at the end of the player's turn.
  afterTurn: () => boolean;
};

// One Civ1 player with one city of `size` in the middle of a 5x5 map of irrigated Grassland, under `government`, with
//  `warriors` Warriors on its tile. Each citizen over 5 is unhappy, and each Warrior makes one of them content where
//  the government allows martial law.
const setUp = async ({
  government = Monarchy,
  size = 8,
  warriors = 2,
}: {
  government?: typeof Government;
  size?: number;
  warriors?: number;
} = {}): Promise<SetUp> => {
  const game = new Game();

  game.availableGovernments.register(Monarchy, Republic);
  // The Warrior first, so that a random pick of the last thing the city can build is the Temple.
  game.availableCityBuildItems.register(
    ...([Warrior, Cathedral, Colosseum, Marketplace, Temple] as IBuildable[])
  );

  cityRules(game);
  cityHappinessRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  treasuryRules(game);
  unitRules(game);
  wonderRules(game);
  worldRules(game);

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      '25G',
      5,
      5
    ),
    player = new Player(game.rules),
    playerResearch = new PlayerResearch(player, game.advances, game.rules);

  game.playerResearch.register(playerResearch);
  playerResearch.addAdvance(CeremonialBurial);
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerWorlds.getByPlayer(player).register(...world.entries());
  game.playerGovernments.getByPlayer(player).set(new government());

  world
    .entries()
    .forEach((tile: Tile): void =>
      game.tileImprovements.register(new Irrigation(tile))
    );

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
    ),
    addWarrior = (): Unit => {
      const warrior = new Warrior(city, player, city.tile(), game.rules);

      // `civ1-unit`'s `Created` rule registers it, in a game with the engine running. Here it's done by hand.
      if (!game.units.includes(warrior)) {
        game.units.register(warrior);
      }

      return warrior;
    };

  new Array(warriors).fill(0).forEach(() => addWarrior());

  return {
    addWarrior,
    afterTurn: (): boolean => {
      const action = new AfterTurn(player, player);

      expect(strategy.handles(action)).true;

      return strategy.attempt(action);
    },
    city,
    dependencies,
    game,
    player,
  };
};

const entertainers = ({ city, game }: SetUp): number =>
  game.specialists.getByCity(city).length;

const disorder = ({ city, dependencies }: SetUp): boolean =>
  inDisorder(dependencies, city);

// How many units in the city martial law would use.
const wanted = ({ city, dependencies }: SetUp): number =>
  martialLawUnitsWanted(dependencies, civ1Knowledge, city);

const fortifyAction = (unit: Unit): Fortify | undefined =>
  unit.actions().find((action): boolean => action instanceof Fortify) as
    | Fortify
    | undefined;

// Whether `unit`, just arrived in the city, stays there to defend it.
const staysToGarrison = ({ city, dependencies }: SetUp, unit: Unit): boolean =>
  garrison(
    dependencies,
    unit,
    city.tile(),
    dependencies.unitRegistry.getByTile(city.tile()),
    fortifyAction(unit),
    civ1Knowledge
  );

describe('martial law', (): void => {
  it('should keep a spare unit rather than make an Entertainer in a Monarchy city with one unhappy citizen', async (): Promise<void> => {
    // Size 8: three citizens over five are unhappy. The two Warriors a city that size wants anyway keep two of them
    //  in order; the third is left unhappy, with no happy citizen to match, so the city is in disorder.
    const setup = await setUp();

    expect(defendersIn(setup.dependencies, setup.city).length).to.equal(2);
    expect(disorder(setup)).true;
    expect(wanted(setup)).to.equal(3);

    // A spare Warrior that walks in stays to keep order...
    const spare = setup.addWarrior();

    expect(staysToGarrison(setup, spare)).true;

    // ...so the city is calm without an Entertainer.
    expect(disorder(setup)).false;

    setup.afterTurn();

    expect(entertainers(setup)).to.equal(0);
    expect(disorder(setup)).false;
  });

  // civ-clone/web-renderer#315: the units martial law uses and the units it wants come from the same yields, which
  //  aren't cheap to work out.
  it("should work out the city's yields once to say whether it wants a unit, or needs one to keep order", async (): Promise<void> => {
    const setup = await setUp(),
      { city, dependencies } = setup,
      [unit] = defendersIn(dependencies, city);

    spy.on(city, ['yields']);

    expect(wantsMartialLawUnit(dependencies, civ1Knowledge, city)).true;
    expect(city.yields).to.have.been.called.once;

    expect(keepsOrder(dependencies, civ1Knowledge, city, unit)).true;
    expect(city.yields).to.have.been.called.twice;
  });

  it('should not keep a spare unit where the government has no martial law', async (): Promise<void> => {
    const setup = await setUp({ government: Republic });

    expect(wanted(setup)).to.equal(0);

    const spare = setup.addWarrior();

    expect(staysToGarrison(setup, spare)).false;
  });

  it('should want no more units than martial law can use', async (): Promise<void> => {
    // Size 10, as big as a city grows without an Aqueduct: five unhappy citizens, but Civ1's martial law makes at most
    //  three of them content (civ-clone/web-renderer#224).
    const setup = await setUp({ size: 10, warriors: 0 });

    expect(wanted(setup)).to.equal(3);

    new Array(3).fill(0).forEach(() => setup.addWarrior());

    // A fourth would calm no one.
    expect(wanted(setup)).to.equal(3);
    expect(staysToGarrison(setup, setup.addWarrior())).false;
  });

  it('should not want a unit for a citizen a Temple already keeps content', async (): Promise<void> => {
    // Size 8 with a Temple: the two Warriors and the Temple's one content citizen leave nobody unhappy.
    const setup = await setUp();

    setup.game.cityImprovements.register(
      new Temple(setup.city, setup.game.rules)
    );

    expect(disorder(setup)).false;
    expect(wanted(setup)).to.equal(2);
  });

  it('should not keep a third unit where a Temple would keep the citizen content without it', async (): Promise<void> => {
    // Size 8 with a Temple and three Warriors. Martial law comes after the Temple, which keeps one of the three unhappy
    //  citizens content, so it only uses two of the Warriors; the third does nothing for order.
    const setup = await setUp({ warriors: 3 });

    setup.game.cityImprovements.register(
      new Temple(setup.city, setup.game.rules)
    );

    expect(disorder(setup)).false;
    expect(wanted(setup)).to.equal(2);

    const [, , third] = setup.dependencies.unitRegistry.getByTile(
      setup.city.tile()
    );

    expect(staysToGarrison(setup, third)).false;
  });

  it('should not keep units for martial law in a city whose Wonder keeps everyone content', async (): Promise<void> => {
    // Shakespeare's Theatre makes every unhappy citizen in its city content, with a plain negative `Unhappiness`, and
    //  comes after martial law: with three Warriors there it has nothing left to do, but it would do it all without them.
    const setup = await setUp({ warriors: 3 });

    setup.game.wonders.register(
      new ShakespearesTheatre(setup.city, setup.game.rules)
    );

    expect(disorder(setup)).false;
    expect(wanted(setup)).to.equal(0);

    const [, , third] = setup.dependencies.unitRegistry.getByTile(
      setup.city.tile()
    );

    expect(staysToGarrison(setup, third)).false;
  });

  it('should build a unit for martial law in a Monarchy city short of one', async (): Promise<void> => {
    const setup = await setUp(),
      { city, dependencies, game, player } = setup,
      // The last of anything a random pick could choose, so the pick can be told apart from a deliberate choice.
      lastPick = createDependencies({
        ...dependencies,
        randomNumberGenerator: (): number => 0.999,
      });

    buildItemInCity(
      lastPick,
      player,
      createMemory().targets,
      city,
      defaultProductionPolicy,
      civ1Knowledge
    );

    expect(game.cityBuilds.getByCity(city).building()?.item()).to.equal(
      Warrior
    );
  });

  it('should not build one once martial law has the units it can use', async (): Promise<void> => {
    const setup = await setUp({ warriors: 3 }),
      { city, dependencies, game, player } = setup,
      lastPick = createDependencies({
        ...dependencies,
        randomNumberGenerator: (): number => 0.999,
      });

    buildItemInCity(
      lastPick,
      player,
      createMemory().targets,
      city,
      defaultProductionPolicy,
      civ1Knowledge
    );

    expect(game.cityBuilds.getByCity(city).building()?.item()).to.equal(Temple);
  });

  it("should not count a unit martial law can't use", async (): Promise<void> => {
    // Size 8, two Warriors and a Diplomat. Martial law only uses units that can attack (civ-clone/web-renderer#224),
    //  so the Diplomat keeps no one content: two units for three unhappy citizens, and the city builds a third.
    const setup = await setUp(),
      { city, dependencies, game, player } = setup,
      diplomat = new Diplomat(city, player, city.tile(), game.rules),
      lastPick = createDependencies({
        ...dependencies,
        randomNumberGenerator: (): number => 0.999,
      });

    if (!game.units.includes(diplomat)) {
      game.units.register(diplomat);
    }

    expect(defendersIn(dependencies, city).length).to.equal(2);
    expect(martialLawUnitsIn(city).length).to.equal(2);
    expect(martialLawUnitsIn(city)).not.include(diplomat);
    expect(disorder(setup)).true;

    buildItemInCity(
      lastPick,
      player,
      createMemory().targets,
      city,
      defaultProductionPolicy,
      civ1Knowledge
    );

    expect(game.cityBuilds.getByCity(city).building()?.item()).to.equal(
      Warrior
    );
  });
});
