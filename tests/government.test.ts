import {
  Anarchy,
  Communism,
  Democracy,
  Despotism,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import {
  Banking,
  Communism as CommunismAdvance,
  Democracy as DemocracyAdvance,
  Monarchy as MonarchyAdvance,
  TheRepublic,
} from '@civ-clone/civ1-science/Advances';
import {
  JosephStalin,
  JuliusCaesar,
  Shaka,
} from '@civ-clone/civ1-civilization/Leaders';
import {
  pendingRevolution,
  turnsUntilChoice,
} from '@civ-clone/civ1-government/lib/revolution';
import {
  pickGovernment,
  preferredGovernment,
  republicScore,
  startRevolution,
} from '../lib/Civ1/government';
import Advance from '@civ-clone/core-science/Advance';
import City from '@civ-clone/core-city/City';
import Civilization from '@civ-clone/core-civilization/Civilization';
import Dependencies from '../lib/Dependencies';
import { Game } from '@civ-clone/core-game/Game';
import Government from '@civ-clone/core-government/Government';
import Leader from '@civ-clone/core-civilization/Leader';
import { Marketplace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import { TraitRegistry } from '@civ-clone/core-civilization/TraitRegistry';
import { Warrior } from '@civ-clone/civ1-unit/Units';
import World from '@civ-clone/core-world/World';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import { dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import registerTraits from '@civ-clone/civ1-civilization/registerTraits';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

type SetUp = {
  dependencies: Dependencies;
  game: Game;
  player: Player;
  playerGovernment: PlayerGovernment;
  world: World;
  // A city at (`x`, `y`) of `size`, working River tiles, each of which gives a trade.
  city: (x: number, y: number, size?: number) => City;
  // The government the player would choose now.
  preferred: () => typeof Government;
};

// One Civ1 player led by `LeaderType`, in Despotism, on a map of River, knowing `advances`.
const setUp = async (
  LeaderType: typeof Leader,
  ...advances: (typeof Advance)[]
): Promise<SetUp> => {
  const game = new Game();

  game.availableGovernments.register(
    Anarchy,
    Communism,
    Democracy,
    Despotism,
    Monarchy,
    Republic
  );

  cityRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  unitRules(game);
  worldRules(game);
  registerTraits(game.traits);

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      '100R',
      10,
      10
    ),
    player = new Player(game.rules),
    CivilizationType =
      LeaderType.civilization() as unknown as new () => Civilization,
    civilization = new CivilizationType(),
    playerResearch = new PlayerResearch(player, game.advances, game.rules);

  civilization.setLeader(
    new (LeaderType as unknown as new (registry: TraitRegistry) => Leader)(
      game.traits
    )
  );
  player.setCivilization(civilization);
  game.playerResearch.register(playerResearch);
  advances.forEach((advance) => playerResearch.addAdvance(advance));
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerWorlds.getByPlayer(player).register(...world.entries());

  const playerGovernment = game.playerGovernments.getByPlayer(player),
    dependencies = dependenciesFor(game);

  playerGovernment.set(new Despotism());

  return {
    city: (x: number, y: number, size: number = 1): City => {
      const city = new City(
          player,
          world.get(x, y),
          '',
          game.rules,
          game.workedTiles
        ),
        cityGrowth = game.cityGrowth.getByCity(city);

      while (cityGrowth.size() < size) {
        cityGrowth.grow();
      }

      return city;
    },
    dependencies,
    game,
    player,
    playerGovernment,
    preferred: () =>
      preferredGovernment(dependencies, player, playerGovernment.available()),
    world,
  };
};

// Starts a revolution if the player would, and once its Anarchy is over has it choose its government, as
//  `StartRevolution` and `ChooseGovernment` do.
const revolt = ({ dependencies, game, player, playerGovernment }: SetUp) => {
  startRevolution(dependencies, player);

  const turns = turnsUntilChoice(playerGovernment, game.pendingEffects);

  if (turns === null) {
    return;
  }

  game.turn.set(game.turn.value() + turns);

  pickGovernment(dependencies, playerGovernment);
};

const governmentName = ({ playerGovernment }: SetUp): string =>
  playerGovernment.current()?.constructor.name ?? 'none';

describe('government (civ-clone/web-renderer#231)', (): void => {
  it('should leave Despotism for The Republic when it knows no other government', async (): Promise<void> => {
    const setup = await setUp(JosephStalin, TheRepublic);

    setup.city(2, 2, 3);
    new Warrior(null, setup.player, setup.world.get(5, 5), setup.game.rules);

    revolt(setup);

    expect(governmentName(setup)).to.equal('Republic');
  });

  it('should leave Despotism for Monarchy as soon as it knows it', async (): Promise<void> => {
    const setup = await setUp(Shaka, MonarchyAdvance);

    startRevolution(setup.dependencies, setup.player);

    expect(pendingRevolution(setup.playerGovernment, setup.game.pendingEffects))
      .not.null;

    revolt(setup);

    expect(governmentName(setup)).to.equal('Monarchy');
  });

  it('should choose The Republic over Monarchy while its trade outweighs the units it has away', async (): Promise<void> => {
    const setup = await setUp(Shaka, MonarchyAdvance, TheRepublic);

    setup.city(2, 2, 3);

    expect(republicScore(setup.dependencies, setup.player)).to.equal(4);
    expect(setup.preferred()).to.equal(Republic);
  });

  // A city of 6 works 7 tiles that give trade. A unit away costs 7 − Ideology: 6 for a Civilized leader, 7 for a normal
  //  one and 8 for a Militaristic one.
  (
    [
      [JuliusCaesar, 1, 'Republic'],
      [Shaka, 0, 'Republic'],
      [JosephStalin, -1, 'Monarchy'],
    ] as [typeof Leader, number, string][]
  ).forEach(([LeaderType, score, expected]) =>
    it(`should choose ${expected} for ${LeaderType.name} with a unit away from a city of 6`, async (): Promise<void> => {
      const setup = await setUp(LeaderType, MonarchyAdvance, TheRepublic),
        city = setup.city(2, 2, 6);

      new Warrior(city, setup.player, setup.world.get(7, 7), setup.game.rules);

      expect(republicScore(setup.dependencies, setup.player)).to.equal(score);
      expect(setup.preferred().name).to.equal(expected);
    })
  );

  it('should count a unit away for less in a city with a Marketplace', async (): Promise<void> => {
    const setup = await setUp(JosephStalin, MonarchyAdvance, TheRepublic),
      city = setup.city(2, 2, 6);

    new Warrior(city, setup.player, setup.world.get(7, 7), setup.game.rules);
    new Marketplace(city, setup.game.rules);

    expect(
      setup.game.cityImprovements
        .getByCity(city)
        .some((improvement) => improvement instanceof Marketplace)
    ).true;

    // 7 − (5 + 1).
    expect(republicScore(setup.dependencies, setup.player)).to.equal(1);
    expect(setup.preferred()).to.equal(Republic);
  });

  it('should not count a unit at home against The Republic', async (): Promise<void> => {
    const setup = await setUp(JosephStalin, MonarchyAdvance, TheRepublic),
      city = setup.city(2, 2, 3);

    new Warrior(city, setup.player, city.tile(), setup.game.rules);

    expect(republicScore(setup.dependencies, setup.player)).to.equal(4);
  });

  it('should choose Communism over Monarchy with more than 10 cities', async (): Promise<void> => {
    const setup = await setUp(JosephStalin, MonarchyAdvance, CommunismAdvance),
      cities = [...Array(10).keys()].map((x: number): City => setup.city(x, 0));

    expect(cities.length).to.equal(10);
    expect(setup.preferred()).to.equal(Monarchy);

    setup.city(0, 5);

    expect(setup.preferred()).to.equal(Communism);
  });

  it('should choose The Republic over Democracy, as v474.05 never chooses Democracy', async (): Promise<void> => {
    const setup = await setUp(
      JuliusCaesar,
      Banking,
      DemocracyAdvance,
      TheRepublic
    );

    setup.city(2, 2, 3);

    expect(setup.preferred()).to.equal(Republic);
  });

  // Civ1's Democracy needs Philosophy and Literacy, not The Republic.
  it('should leave Despotism for Democracy only when it knows no other government', async (): Promise<void> => {
    const setup = await setUp(JosephStalin, DemocracyAdvance);

    setup.city(2, 2, 3);

    expect(setup.preferred()).to.equal(Democracy);

    setup.game.playerResearch
      .getByPlayer(setup.player)
      .addAdvance(MonarchyAdvance);

    expect(setup.preferred()).to.equal(Monarchy);
  });

  it(`should wait 40 turns after one revolution before the next`, async (): Promise<void> => {
    const setup = await setUp(JuliusCaesar, MonarchyAdvance),
      { dependencies, game, player, playerGovernment } = setup;

    setup.city(2, 2, 3);

    // The turn the first revolution starts, not the turn its Anarchy ends.
    const revolution = game.turn.value();

    revolt(setup);

    expect(governmentName(setup)).to.equal('Monarchy');

    game.playerResearch.getByPlayer(player).addAdvance(TheRepublic);
    expect(setup.preferred()).to.equal(Republic);

    game.turn.set(revolution + 39);
    startRevolution(dependencies, player);

    expect(pendingRevolution(playerGovernment, game.pendingEffects)).null;
    expect(governmentName(setup)).to.equal('Monarchy');

    game.turn.set(revolution + 40);
    startRevolution(dependencies, player);

    expect(pendingRevolution(playerGovernment, game.pendingEffects)).not.null;
  });

  it('should stay in Monarchy rather than go back to Despotism, however many units it has', async (): Promise<void> => {
    const setup = await setUp(JosephStalin, MonarchyAdvance),
      city = setup.city(2, 2, 1);

    revolt(setup);

    [...Array(6)].forEach(
      () => new Warrior(city, setup.player, city.tile(), setup.game.rules)
    );
    setup.game.turn.set(setup.game.turn.value() + 100);
    startRevolution(setup.dependencies, setup.player);

    expect(governmentName(setup)).to.equal('Monarchy');
    expect(pendingRevolution(setup.playerGovernment, setup.game.pendingEffects))
      .null;
  });
});
