// Civ2's city mechanisms (civ-clone/web-renderer#1007, M2c), each built from its base package or core seam on a Civ1
//  game, as a ruleset with them registers them: per-square yields for a city (`CityTileYield`), a ruleset's own
//  disorder record and moods, Capitalization, a change penalty (`ProductionChanged`) and Farmland.
import {
  Cathedral,
  Colosseum,
  Marketplace,
  Temple,
} from '@civ-clone/civ1-city-improvement/CityImprovements';
import { CeremonialBurial } from '@civ-clone/civ1-science/Advances';
import { Despotism, Monarchy } from '@civ-clone/civ1-government/Governments';
import { Food, Trade } from '@civ-clone/civ1-world/Yields';
import { Irrigation } from '@civ-clone/civ1-world/TileImprovements';
import {
  capitalizationCost,
  capitalizationHold,
} from '@civ-clone/base-city-improvement-capitalization/lib/capitalizationRules';
import {
  buildToCalm,
  inDisorder,
  leastValuableWorkedTiles,
  wasInDisorderAtTurnStart,
} from '../lib/City/disorder';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import Capitalization from '@civ-clone/base-city-improvement-capitalization/Capitalization';
import ChooseProduction from '../Strategies/Civ1/ChooseProduction';
import NoteDisorder from '../Strategies/City/NoteDisorder';
import StartRevolution from '../Strategies/Civ1/StartRevolution';
import { createStrategies } from '../registerStrategies';
import City from '@civ-clone/core-city/City';
import CityTileYield from '@civ-clone/core-city/Rules/CityTileYield';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Criterion from '@civ-clone/core-rule/Criterion';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Effect from '@civ-clone/core-rule/Effect';
import Farmland from '@civ-clone/base-tile-improvement-farmland/Farmland';
import TileImprovementAvailable from '@civ-clone/core-tile-improvement/Rules/Available';
import { instance as availableTileImprovementRegistryInstance } from '@civ-clone/core-tile-improvement/AvailableTileImprovementRegistry';
import { Game } from '@civ-clone/core-game/Game';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import ProductionChanged from '@civ-clone/core-city-build/Rules/ProductionChanged';
import Supermarket from '@civ-clone/base-city-improvement-supermarket/Supermarket';
import Tile from '@civ-clone/core-world/Tile';
import { Unhappiness } from '@civ-clone/library-city/Yields';
import { Warrior } from '@civ-clone/civ1-unit/Units';
import World from '@civ-clone/core-world/World';
import Yield from '@civ-clone/core-yield/Yield';
import buildItemInCity from '../lib/Civ1/buildItemInCity';
import cityHappinessRules from '@civ-clone/civ1-city-happiness/registerRules';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import civ1DisorderPolicy from '../lib/Civ1/disorder';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { civ1TerrainPolicy } from '../lib/Civ1/terrain';
import { createMemory } from '@civ-clone/base-strategy-ai/lib/Memory';
import { dependenciesFor } from '../registerStrategies';
import { expect } from 'chai';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import progressAfterChange from '../lib/City/productionChange';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import { republicScore } from '../lib/Civ1/government';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

type SetUp = {
  city: City;
  dependencies: Dependencies;
  game: Game;
  player: Player;
  tile: (x: number, y: number) => Tile;
  world: World;
};

// One Civ1 player under Monarchy with one city of `size` in the middle of a 5x5 map of irrigated Grassland, defended by
//  a Warrior. With `happiness`, Civ1's happiness rules (and so its record of disorder) are registered.
const setUp = async ({
  happiness = true,
  size = 5,
}: { happiness?: boolean; size?: number } = {}): Promise<SetUp> => {
  const game = new Game();

  game.availableGovernments.register(Despotism, Monarchy);
  game.availableCityBuildItems.register(
    ...([Cathedral, Colosseum, Marketplace, Temple, Warrior] as IBuildable[])
  );

  cityRules(game);

  if (happiness) {
    cityHappinessRules(game);
  }

  cityImprovementRules(game);
  governmentRules(game);
  unitRules(game);
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
  game.playerGovernments.getByPlayer(player).set(new Monarchy());

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

  new Warrior(city, player, city.tile(), game.rules);

  return {
    city,
    dependencies: dependenciesFor(game),
    game,
    player,
    tile: (x: number, y: number): Tile => world.get(x, y),
    world,
  };
};

const workedTiles = ({ city, game }: SetUp): Tile[] =>
  game.workedTiles
    .getByCity(city)
    .map((workedTile) => workedTile.tile())
    .filter((tile: Tile): boolean => tile !== city.tile());

// A `CityTileYield` rule that adds `value` of `YieldType` to what `tiles` give their city.
const cityTileYield = (
  tiles: Tile[],
  YieldType: typeof Yield,
  value: number
): CityTileYield =>
  new CityTileYield(
    new Criterion((city: City, tile: Tile): boolean => tiles.includes(tile)),
    new Effect((city: City, tile: Tile, yields: Yield[]): void => {
      const tileYield = yields.find(
        (tileYield: Yield): boolean => tileYield instanceof YieldType
      );

      if (tileYield) {
        tileYield.add(value);

        return;
      }

      yields.push(new YieldType(value));
    })
  );

describe('Civ2 city mechanisms (M2c)', (): void => {
  describe('per-square yields (`City#tileYields`)', (): void => {
    it('should make an Entertainer of the worked tile that gives the city the least, by its own rules', async (): Promise<void> => {
      const setup = await setUp(),
        { city, dependencies, game } = setup,
        [first, ...rest] = leastValuableWorkedTiles(dependencies, city);

      // All alike, so the first is taken first; once the city's rules make it worth more, it goes last.
      game.rules.register(cityTileYield([first], Food, 5));

      // Engine objects are never handed to `expect`, whose failure messages would walk their whole object graph.
      const at = (tiles: Tile[]): string[] =>
        tiles.map((tile: Tile): string => `${tile.x()},${tile.y()}`);

      expect(at(leastValuableWorkedTiles(dependencies, city))).to.deep.equal(
        at([...rest, first])
      );
    });

    it("should count the trade a city's rules add to a square in The Republic's score", async (): Promise<void> => {
      const setup = await setUp(),
        { dependencies, game, player } = setup,
        before = republicScore(dependencies, player);

      game.rules.register(cityTileYield(workedTiles(setup), Trade, 1));

      expect(republicScore(dependencies, player)).to.equal(
        before + workedTiles(setup).length
      );
    });
  });

  describe("a ruleset's own disorder (angry citizens)", (): void => {
    // A ruleset that counts citizens its own way: disorder at more than `limit` unhappy, from the yields it's given.
    const ownDisorder = (limit: number): CivilDisorder =>
      new CivilDisorder(
        new Effect(
          (city: City, yields: Yield[]): boolean =>
            reduceYield(
              yields.filter((cityYield) => cityYield instanceof Unhappiness),
              Unhappiness
            ) > limit
        )
      );

    it('should count a city the ruleset found in disorder at the start of the turn, though calm by its end', async (): Promise<void> => {
      const setup = await setUp({ happiness: false }),
        { city, dependencies, game, player } = setup,
        strategy = new NoteDisorder(
          dependencies,
          civ1Knowledge,
          civ1DisorderPolicy
        ),
        beforeTurn = new BeforeTurn(player, player);

      let disorder = true;

      game.rules.register(
        new CivilDisorder(new Effect((): boolean => disorder))
      );

      expect(strategy.handles(beforeTurn)).true;

      await strategy.attempt(beforeTurn);

      // Calmed during the turn.
      disorder = false;

      expect(inDisorder(dependencies, city)).false;
      expect(civ1DisorderPolicy.wasInDisorder(dependencies, city)).true;
    });

    it('should not count a city that fell into disorder after the start of the turn', async (): Promise<void> => {
      const setup = await setUp({ happiness: false }),
        { city, dependencies, game, player } = setup,
        strategy = new NoteDisorder(
          dependencies,
          civ1Knowledge,
          civ1DisorderPolicy
        );

      let disorder = false;

      game.rules.register(
        new CivilDisorder(new Effect((): boolean => disorder))
      );

      await strategy.attempt(new BeforeTurn(player, player));

      disorder = true;

      expect(inDisorder(dependencies, city)).true;
      expect(civ1DisorderPolicy.wasInDisorder(dependencies, city)).false;
    });

    it('should not count a city noted for another player, captured since', async (): Promise<void> => {
      const setup = await setUp({ happiness: false }),
        { city, dependencies, game, player, world } = setup,
        strategy = new NoteDisorder(
          dependencies,
          civ1Knowledge,
          civ1DisorderPolicy
        ),
        captor = new Player(game.rules);

      game.playerWorlds.register(new PlayerWorld(captor, world));

      game.rules.register(new CivilDisorder(new Effect((): boolean => true)));

      await strategy.attempt(new BeforeTurn(player, player));

      expect(civ1DisorderPolicy.wasInDisorder(dependencies, city)).true;

      city.capture(captor);

      expect(civ1DisorderPolicy.wasInDisorder(dependencies, city)).false;
    });

    it('should note nothing where Civ1 keeps its own record', async (): Promise<void> => {
      const setup = await setUp(),
        { city, dependencies, game, player } = setup,
        strategy = new NoteDisorder(
          dependencies,
          civ1Knowledge,
          civ1DisorderPolicy
        );

      game.rules.register(new CivilDisorder(new Effect((): boolean => true)));

      await strategy.attempt(new BeforeTurn(player, player));

      expect(wasInDisorderAtTurnStart(dependencies, city)).false;
    });

    it('should be noted before any other strategy acts at the start of the turn, a revolution included', (): void => {
      const strategies = createStrategies(
          dependenciesFor(new Game()),
          civ1Knowledge
        ),
        index = (Type: Function): number =>
          strategies.findIndex((strategy) => strategy instanceof Type);

      expect(index(NoteDisorder)).to.equal(0);
      expect(index(StartRevolution)).to.be.greaterThan(0);
    });

    it("should go by Civ1's record where Civ1 keeps one", async (): Promise<void> => {
      const setup = await setUp(),
        { city, dependencies, game } = setup;

      game.rules.register(ownDisorder(-1));

      expect(inDisorder(dependencies, city)).true;
      expect(civ1DisorderPolicy.wasInDisorder(dependencies, city)).false;
    });

    it("should hand the ruleset's rules the unhappy citizens growth would add", async (): Promise<void> => {
      const setup = await setUp({ happiness: false }),
        { city, dependencies, game } = setup;

      game.rules.register(ownDisorder(3));

      expect(inDisorder(dependencies, city, 0, [])).false;
      expect(inDisorder(dependencies, city, 4, [])).true;
    });
  });

  describe('Capitalization', (): void => {
    const withCapitalization = async (): Promise<SetUp> => {
      const setup = await setUp({ size: 1 });

      setup.game.availableCityBuildItems.register(
        Capitalization as unknown as IBuildable
      );
      setup.game.rules.register(
        ...capitalizationCost(),
        ...capitalizationHold()
      );

      return setup;
    };

    const choose = ({ city, dependencies, player }: SetUp): unknown => {
      buildItemInCity(dependencies, player, createMemory().targets, city);

      return dependencies.cityBuildRegistry.getByCity(city).building()?.item();
    };

    it('should be chosen only when nothing else is worth building, though it costs nothing', async (): Promise<void> => {
      const setup = await withCapitalization();

      expect(choose(setup)).to.equal(Temple);

      [Temple, Marketplace, Cathedral, Colosseum].forEach((Improvement) =>
        setup.game.cityImprovements.register(
          new Improvement(setup.city, setup.game.rules)
        )
      );

      expect(choose(setup)).to.equal(Capitalization);
    });

    it('should be left at the start of a turn once something is worth building', async (): Promise<void> => {
      const setup = await withCapitalization(),
        { city, dependencies, game, player } = setup,
        cityBuild = game.cityBuilds.getByCity(city),
        strategy = new ChooseProduction(dependencies, civ1Knowledge),
        action = new BeforeTurn(player, player);

      cityBuild.build(Capitalization as unknown as IBuildable);

      expect(strategy.handles(action)).true;

      await strategy.attempt(action);

      expect(cityBuild.building()!.item()).to.equal(Temple);
    });
  });

  describe('the change penalty (`ProductionChanged`)', (): void => {
    // Half the shields for a change to anything but a unit, as a ruleset's rule would take them.
    const halfForImprovements = new ProductionChanged(
      new Criterion(
        (cityBuild: unknown, from: unknown, to: unknown): boolean =>
          to !== (Warrior as unknown)
      ),
      new Effect(
        (cityBuild: unknown, from: unknown, to: unknown, progress: number) =>
          Math.floor(progress / 2)
      )
    );

    it("should ask the ruleset's rules what a change would keep", async (): Promise<void> => {
      const setup = await setUp(),
        { city, dependencies, game } = setup,
        cityBuild = game.cityBuilds.getByCity(city);

      cityBuild.build(Warrior as unknown as IBuildable);
      cityBuild.add(new Yield(6));

      expect(progressAfterChange(dependencies, cityBuild, Temple)).to.equal(6);

      game.rules.register(halfForImprovements);

      expect(progressAfterChange(dependencies, cityBuild, Temple)).to.equal(3);
      expect(
        progressAfterChange(
          dependencies,
          cityBuild,
          Warrior as unknown as IBuildable
        )
      ).to.equal(6);
    });

    it('should not switch to a calming improvement that would lose shields', async (): Promise<void> => {
      const setup = await setUp(),
        { city, dependencies, game } = setup,
        cityBuild = game.cityBuilds.getByCity(city);

      cityBuild.build(Warrior as unknown as IBuildable);
      cityBuild.add(new Yield(6));
      game.rules.register(halfForImprovements);

      expect(buildToCalm(dependencies, city, [Temple] as IBuildable[])).null;
      expect(cityBuild.building()!.item()).to.equal(Warrior);
      expect(cityBuild.progress().value()).to.equal(6);
    });

    it('should choose from what keeps its shields while part of the way through a build', async (): Promise<void> => {
      const setup = await setUp({ size: 1 }),
        { city, dependencies, game, player } = setup,
        cityBuild = game.cityBuilds.getByCity(city);

      cityBuild.build(Warrior as unknown as IBuildable);
      cityBuild.add(new Yield(6));

      const choose = (): unknown => {
        buildItemInCity(dependencies, player, createMemory().targets, city);

        return cityBuild.building()!.item();
      };

      expect(choose()).to.equal(Temple);

      cityBuild.build(Warrior as unknown as IBuildable);
      game.rules.register(halfForImprovements);

      expect(choose()).to.equal(Warrior);
      expect(cityBuild.progress().value()).to.equal(6);
    });
  });

  describe('Farmland', (): void => {
    // The game has Farmland, which the ruleset's `Available` rules allow wherever `allowed` says.
    let allowed = (tile: Tile): boolean => true;

    beforeEach((): void => {
      allowed = (): boolean => true;
      availableTileImprovementRegistryInstance.register(Farmland);
    });

    afterEach((): void =>
      availableTileImprovementRegistryInstance.unregister(Farmland)
    );

    const withFarmlandRule: WeakSet<Game> = new WeakSet();

    const jobs = (
      { dependencies, game, player }: SetUp,
      tile: Tile
    ): string[] => {
      if (!withFarmlandRule.has(game)) {
        withFarmlandRule.add(game);

        game.rules.register(
          new TileImprovementAvailable(
            new Criterion(
              (tile: Tile, Improvement: unknown): boolean =>
                Improvement === Farmland
            ),
            new Criterion((tile: Tile): boolean => allowed(tile))
          )
        );
      }

      return civ1TerrainPolicy
        .jobs(dependencies, player, tile)
        .map(({ improvement }): string => improvement);
    };

    it("should not be built where the ruleset's rules don't allow it", async (): Promise<void> => {
      const setup = await setUp(),
        { city, game } = setup,
        [tile] = workedTiles(setup);

      game.cityImprovements.register(new Supermarket(city, game.rules));
      allowed = (): boolean => false;

      expect(jobs(setup, tile)).not.include('farmland');
    });

    it('should not be built, or looked for, in a game without Farmland', async (): Promise<void> => {
      const setup = await setUp(),
        { city, game } = setup,
        [tile] = workedTiles(setup);

      game.cityImprovements.register(new Supermarket(city, game.rules));
      availableTileImprovementRegistryInstance.unregister(Farmland);

      expect(jobs(setup, tile)).not.include('farmland');
    });

    it('should be built on an irrigated square the city works once it builds a Supermarket', async (): Promise<void> => {
      const setup = await setUp(),
        { city, game } = setup,
        [tile] = workedTiles(setup);

      game.availableCityBuildItems.register(
        Supermarket as unknown as IBuildable
      );

      expect(jobs(setup, tile)).not.include('farmland');

      game.cityBuilds
        .getByCity(city)
        .build(Supermarket as unknown as IBuildable);

      expect(jobs(setup, tile)).include('farmland');
    });

    it('should be built where the city has a Supermarket, once, and not mined over', async (): Promise<void> => {
      const setup = await setUp(),
        { city, game } = setup,
        [tile] = workedTiles(setup);

      game.cityImprovements.register(new Supermarket(city, game.rules));

      expect(jobs(setup, tile)).include('farmland');

      game.tileImprovements.register(new Farmland(tile));

      expect(jobs(setup, tile)).not.include('farmland');
      expect(jobs(setup, tile)).not.include('mine');
    });

    it("should not be built on the city's own square or a dry one", async (): Promise<void> => {
      const setup = await setUp(),
        { city, game } = setup,
        [tile] = workedTiles(setup);

      game.cityImprovements.register(new Supermarket(city, game.rules));
      game.tileImprovements.unregister(
        ...game.tileImprovements
          .getByTile(tile)
          .filter((improvement) => improvement instanceof Irrigation)
      );

      expect(jobs(setup, tile)).not.include('farmland');
      expect(jobs(setup, city.tile())).not.include('farmland');
    });
  });
});
