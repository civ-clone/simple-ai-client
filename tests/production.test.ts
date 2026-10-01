import { Despotism, Monarchy } from '@civ-clone/civ1-government/Governments';
import { CeremonialBurial } from '@civ-clone/civ1-science/Advances';
import { Settlers, Warrior } from '@civ-clone/civ1-unit/Units';
import buildItemInCity, {
  ProductionPolicy,
  defaultProductionPolicy,
} from '../lib/Civ1/buildItemInCity';
import City from '@civ-clone/core-city/City';
import Dependencies from '../lib/Dependencies';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import { Game } from '@civ-clone/core-game/Game';
import Government from '@civ-clone/core-government/Government';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import { Production } from '@civ-clone/civ1-world/Yields';
import { TargetBoard } from '../lib/Memory';
import { Temple } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Unit from '@civ-clone/core-unit/Unit';
import World from '@civ-clone/core-world/World';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import { createDependencies } from '../lib/Dependencies';
import { createMemory } from '../lib/Memory';
import { dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

type SetUp = {
  city: City;
  dependencies: Dependencies;
  game: Game;
  player: Player;
  targets: TargetBoard;
  world: World;
  // Another city of the player's, on the same continent.
  addCity: (x: number, y: number) => City;
  // What `city` chooses to build, by `policy`.
  choose: (policy?: ProductionPolicy) => unknown;
};

// Two continents, x 0-3 and x 5-8, with Ocean between them and at x 9, where the map wraps.
const twoContinents = '4GO4GO'.repeat(5);

// One Civ1 player under `government`, with one city of `size` at (1, 2) making `shields` net shields, and, if
//  `defended`, a fortified Warrior of its own in it, so it isn't missing a defender. It can build Warriors, Settlers
//  and Temples.
const setUp = async ({
  defended = true,
  government = Monarchy,
  shields = 1,
  size = 1,
}: {
  defended?: boolean;
  government?: typeof Government;
  shields?: number;
  size?: number;
} = {}): Promise<SetUp> => {
  const game = new Game();

  game.availableGovernments.register(Despotism, Monarchy);
  game.availableCityBuildItems.register(
    ...([Warrior, Settlers, Temple] as unknown as IBuildable[])
  );

  cityRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  unitRules(game);
  worldRules(game);

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      twoContinents,
      5,
      10
    ),
    player = new Player(game.rules);

  const playerResearch = new PlayerResearch(player, game.advances, game.rules);

  game.playerResearch.register(playerResearch);
  // For Temples.
  playerResearch.addAdvance(CeremonialBurial);
  game.playerWorlds.register(new PlayerWorld(player, world));
  game.playerWorlds.getByPlayer(player).register(...world.entries());
  game.playerGovernments.getByPlayer(player).set(new government());

  const addCity = (x: number, y: number): City =>
      new City(player, world.get(x, y), '', game.rules, game.workedTiles),
    city = addCity(1, 2),
    cityGrowth = game.cityGrowth.getByCity(city);

  while (cityGrowth.size() < size) {
    cityGrowth.grow();
  }

  if (defended) {
    game.unitImprovements.register(
      new Fortified(new Warrior(city, player, city.tile(), game.rules))
    );
  }

  city.yields = () => [new Production(shields)];

  // The last of anything a random pick could choose, so a test can tell the pick apart from a deliberate choice.
  const dependencies = createDependencies({
      ...dependenciesFor(game),
      randomNumberGenerator: (): number => 0.999,
    }),
    targets = createMemory().targets;

  return {
    addCity,
    choose: (policy: ProductionPolicy = defaultProductionPolicy): unknown => {
      buildItemInCity(dependencies, player, targets, city, policy);

      return game.cityBuilds.getByCity(city).building()?.item();
    },
    city,
    dependencies,
    game,
    player,
    targets,
    world,
  };
};

// Land units of the player's out of its cities, on the city's continent.
const unitsOut = (
  { game, player, world }: SetUp,
  count: number,
  UnitType: typeof Unit = Warrior
): void => {
  for (let i = 0; i < count; i++) {
    new UnitType(null, player, world.get(2, i % 5), game.rules);
  }
};

const isUnit = (item: unknown): boolean =>
  Object.prototype.isPrototypeOf.call(Unit, item);

describe('buildItemInCity', (): void => {
  describe('explorers (civ-clone/web-renderer#229)', (): void => {
    it('should build an explorer for land a unit from the city could reach', async (): Promise<void> => {
      const setup = await setUp({ shields: 2 });

      setup.targets.landTilesToExplore.push(setup.world.get(3, 0));

      expect(setup.choose()).equal(Warrior);
    });

    it('should not build an explorer for land only across the water', async (): Promise<void> => {
      const setup = await setUp({ shields: 2 });

      setup.targets.landTilesToExplore.push(
        setup.world.get(5, 0),
        setup.world.get(8, 4)
      );

      expect(isUnit(setup.choose())).false;
    });

    it("should want no more explorers than the policy's most, however many cities it has", async (): Promise<void> => {
      const setup = await setUp({ shields: 2 });

      // Four cities would want 3 + 2 × 4 = 11 by the default policy, which keeps it to 6.
      setup.addCity(1, 0);
      setup.addCity(1, 4);
      setup.addCity(3, 2);
      unitsOut(setup, 6);
      setup.targets.landTilesToExplore.push(setup.world.get(3, 0));

      expect(isUnit(setup.choose())).false;
      expect(
        isUnit(setup.choose({ ...defaultProductionPolicy, maxExplorers: 7 }))
      ).true;
    });

    it('should count explorers its other cities are building towards the most it wants', async (): Promise<void> => {
      const setup = await setUp({ shields: 2 }),
        other = setup.addCity(3, 2);

      setup.game.cityBuilds.getByCity(other).build(Warrior);
      unitsOut(setup, 5);
      setup.targets.landTilesToExplore.push(setup.world.get(3, 0));

      expect(isUnit(setup.choose())).false;
    });
  });

  describe('unit support (civ-clone/web-renderer#229)', (): void => {
    it('should not start an explorer that would leave it no shields to spare', async (): Promise<void> => {
      // Under Monarchy every unit costs a shield, so a city making 1 has none to spare for another.
      const setup = await setUp({ shields: 1 });

      setup.targets.landTilesToExplore.push(setup.world.get(3, 0));

      expect(isUnit(setup.choose())).false;
    });

    it('should not pick a unit at random that would leave it no shields to spare', async (): Promise<void> => {
      const setup = await setUp({ shields: 1 }),
        dependencies = createDependencies({
          ...setup.dependencies,
          randomNumberGenerator: (): number => 0,
        });

      // Warriors first, then a Temple: a pick of 0 would be Warriors.
      buildItemInCity(dependencies, setup.player, setup.targets, setup.city);

      expect(
        isUnit(setup.game.cityBuilds.getByCity(setup.city).building()?.item())
      ).false;
    });

    it('should start an explorer under Despotism while the city supports fewer units than its size', async (): Promise<void> => {
      // Size 2 with one unit of its own: Despotism supports a second for nothing.
      const setup = await setUp({
        government: Despotism,
        shields: 1,
        size: 2,
      });

      setup.targets.landTilesToExplore.push(setup.world.get(3, 0));

      expect(setup.choose()).equal(Warrior);
    });

    it('should not start an explorer under Despotism once the city supports as many units as its size', async (): Promise<void> => {
      const setup = await setUp({ government: Despotism, shields: 1 });

      setup.targets.landTilesToExplore.push(setup.world.get(3, 0));

      expect(isUnit(setup.choose())).false;
    });

    it('should still build a defender in a city with none, whatever it costs to support', async (): Promise<void> => {
      const setup = await setUp({ defended: false, shields: 1 });

      expect(setup.choose()).equal(Warrior);
    });
  });

  describe('Settlers (civ-clone/web-renderer#229)', (): void => {
    it('should build Settlers in a city of 2 while the player has fewer than it wants', async (): Promise<void> => {
      const setup = await setUp({ shields: 2, size: 2 });

      unitsOut(setup, 2, Settlers);

      expect(setup.choose()).equal(Settlers);
    });

    it('should count Settlers its other cities are building towards the ones it wants', async (): Promise<void> => {
      const setup = await setUp({ shields: 2, size: 2 }),
        other = setup.addCity(3, 2);

      unitsOut(setup, 2, Settlers);
      setup.game.cityBuilds.getByCity(other).build(Settlers);

      expect(setup.choose()).not.equal(Settlers);
    });
  });
});
