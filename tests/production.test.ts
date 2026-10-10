import {
  AbrahamLincoln,
  ElizabethI,
  GenghisKhan,
  MahatmaGandhi,
  Shaka,
} from '@civ-clone/civ1-civilization/Leaders';
import { Despotism, Monarchy } from '@civ-clone/civ1-government/Governments';
import { CeremonialBurial, MapMaking } from '@civ-clone/civ1-science/Advances';
import {
  Caravan,
  Diplomat,
  Settlers,
  Trireme,
  Warrior,
} from '@civ-clone/civ1-unit/Units';
import buildItemInCity, {
  ProductionPolicy,
  defaultProductionPolicy,
  isFoundingSettlers,
} from '../lib/Civ1/buildItemInCity';
import City from '@civ-clone/core-city/City';
import Civilization from '@civ-clone/core-civilization/Civilization';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { Fortified } from '@civ-clone/civ1-unit/UnitImprovements';
import { Game } from '@civ-clone/core-game/Game';
import Government from '@civ-clone/core-government/Government';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import Leader from '@civ-clone/core-civilization/Leader';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import { Production } from '@civ-clone/civ1-world/Yields';
import { TargetBoard } from '@civ-clone/base-strategy-ai/lib/Memory';
import { Temple } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Unit from '@civ-clone/core-unit/Unit';
import { UnitSupportProduction } from '@civ-clone/library-city/Yields';
import TraitRegistry from '@civ-clone/core-civilization/TraitRegistry';
import World from '@civ-clone/core-world/World';
import Yield from '@civ-clone/core-yield/Yield';
import cityImprovementRules from '@civ-clone/civ1-city-improvement/registerRules';
import cityRules from '@civ-clone/civ1-city/registerRules';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { createMemory } from '@civ-clone/base-strategy-ai/lib/Memory';
import { dependenciesFor } from '../registerStrategies';
import { personalityRules } from '@civ-clone/civ1-civilization/registerPersonality';
import registerTraits from '@civ-clone/civ1-civilization/registerTraits';
import { instance as memoryRegistryInstance } from '@civ-clone/base-strategy-ai/lib/MemoryRegistry';
import {
  TerrainJob,
  UNDOABLE_TURNS,
  chooseTerrainJob,
  hasOpenTerrainJob,
  isKnownUndoable,
  terrainJobs,
} from '@civ-clone/base-strategy-terrain-work/lib/Unit/terrainWork';
import { Irrigation, Road } from '@civ-clone/civ1-world/TileImprovements';
import Tile from '@civ-clone/core-world/Tile';
import { civ1TerrainPolicy } from '../lib/Civ1/terrain';
import { landReachableFrom } from '../lib/City/explorers';
import { expect } from 'chai';
import governmentRules from '@civ-clone/civ1-government/registerRules';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import unitSupport from '../lib/Civ1/unitSupport';
import explorerShipFor from '../lib/City/explorerShip';
import civ1Knowledge from '../lib/Civ1/knowledge';
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
//  and Temples. With a `leader`, the player has Civ1's leader traits and personality rules; without one, neither.
const setUp = async ({
  defended = true,
  government = Monarchy,
  leader = null,
  map = twoContinents,
  shields = 1,
  size = 1,
}: {
  defended?: boolean;
  government?: typeof Government;
  leader?: typeof Leader | null;
  map?: string;
  shields?: number;
  size?: number;
} = {}): Promise<SetUp> => {
  const game = new Game();

  game.availableGovernments.register(Despotism, Monarchy);
  game.availableCityBuildItems.register(
    ...([Warrior, Settlers, Temple, Trireme] as unknown as IBuildable[])
  );

  cityRules(game);
  cityImprovementRules(game);
  governmentRules(game);
  unitRules(game);
  worldRules(game);

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
      map,
      5,
      10
    ),
    player = new Player(game.rules);

  if (leader !== null) {
    const civilization = new Civilization();

    registerTraits(game.traits);
    game.rules.register(...personalityRules(game.traits));
    civilization.setLeader(
      new (leader as unknown as new (registry: TraitRegistry) => Leader)(
        game.traits
      )
    );
    player.setCivilization(civilization);
  }

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
    // Under Monarchy every unit costs a shield, so a city making 1 has none to spare for another. Explorers are built
    //  all the same: with idle units standing down, they're what explores.
    it('should start an explorer for land it can reach, even if it would leave it no shields to spare', async (): Promise<void> => {
      const setup = await setUp({ shields: 1 });

      setup.targets.landTilesToExplore.push(setup.world.get(3, 0));

      expect(setup.choose()).equal(Warrior);
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

    // Warriors first, then a Temple: a pick of 0 would be Warriors.
    const pickAtRandom = (setup: SetUp): unknown => {
      buildItemInCity(
        createDependencies({
          ...setup.dependencies,
          randomNumberGenerator: (): number => 0,
        }),
        setup.player,
        setup.targets,
        setup.city
      );

      return setup.game.cityBuilds.getByCity(setup.city).building()?.item();
    };

    it('should pick a unit at random under Despotism while the city supports fewer units than its size', async (): Promise<void> => {
      // Size 2 with one unit of its own: Despotism supports a second for nothing.
      const setup = await setUp({
        government: Despotism,
        shields: 1,
        size: 2,
      });

      // As many Settlers as it wants, so it doesn't build more.
      unitsOut(setup, 3, Settlers);

      expect(pickAtRandom(setup)).equal(Warrior);
    });

    it('should not pick a unit at random under Despotism once the city supports as many units as its size', async (): Promise<void> => {
      const setup = await setUp({ government: Despotism, shields: 1 });

      expect(isUnit(pickAtRandom(setup))).false;
    });

    // Diplomats and Caravans cost nothing, as in v474.05 (civ-clone/web-renderer#34).
    it('should count a shield to support any unit but a Diplomat or Caravan under Monarchy, as the ruleset charges', async (): Promise<void> => {
      const { city, dependencies, game } = await setUp();

      [Warrior, Settlers, Diplomat, Caravan].forEach((UnitType) => {
        new UnitType(city, city.player(), city.tile(), game.rules);
      });

      expect(unitSupport(dependencies, city)).to.equal(1);
      // The ruleset's own yields, not the test's: the fortified Warrior, the Warrior and the Settlers, a shield each.
      expect(
        City.prototype.yields
          .call(city)
          .filter(
            (cityYield: Yield): boolean =>
              cityYield instanceof UnitSupportProduction
          ).length
      ).to.equal(3);
    });

    it('should count no support for one more Diplomat or Caravan under Monarchy', async (): Promise<void> => {
      const { city, dependencies } = await setUp();

      expect(unitSupport(dependencies, city, Warrior)).to.equal(1);
      expect(unitSupport(dependencies, city, Diplomat)).to.equal(0);
      expect(unitSupport(dependencies, city, Caravan)).to.equal(0);
    });

    it("should not count Diplomats or Caravans against a city's free units under Despotism", async (): Promise<void> => {
      const { city, dependencies, game } = await setUp({
        government: Despotism,
        size: 2,
      });

      [Diplomat, Caravan].forEach((UnitType) => {
        new UnitType(city, city.player(), city.tile(), game.rules);
      });

      // Only the fortified Warrior uses one of the two free units.
      expect(unitSupport(dependencies, city)).to.equal(0);
    });

    it('should still build a defender in a city with none, whatever it costs to support', async (): Promise<void> => {
      const setup = await setUp({ defended: false, shields: 1 });

      expect(setup.choose()).equal(Warrior);
    });
  });

  describe('explorer ships (civ-clone/web-renderer#229)', (): void => {
    // Land at x 0-4 and sea at x 5-9, unexplored beyond x 7: a second city on the coast at (4, 2), with a fortified
    //  Warrior of its own and 20 of a Trireme's 40 shields stored, so that it can finish one within 20 turns even at 1
    //  net shield.
    const shipFor = async (shields: number): Promise<unknown> => {
      const setup = await setUp({ map: '5G5O'.repeat(5) }),
        { dependencies, game, player, targets, world } = setup,
        city = setup.addCity(4, 2);

      game.playerResearch.getByPlayer(player).addAdvance(MapMaking);
      game.unitImprovements.register(
        new Fortified(new Warrior(city, player, city.tile(), game.rules))
      );
      city.yields = () => [new Production(shields)];
      game.cityBuilds.getByCity(city).build(Warrior);
      game.cityBuilds.getByCity(city).add(new Yield(20));
      targets.seaTilesToExplore.push(world.get(7, 2));

      return explorerShipFor(
        dependencies,
        player,
        targets,
        city,
        civ1Knowledge
      );
    };

    it('should start a ship to explore with in a city with shields to spare for it', async (): Promise<void> => {
      expect(await shipFor(2)).equal(Trireme);
    });

    it('should not start a ship to explore with that would leave the city no shields to spare', async (): Promise<void> => {
      expect(await shipFor(1)).null;
    });
  });

  describe('Settlers (civ-clone/web-renderer#229)', (): void => {
    it('should build Settlers in a city of 2 while the player has fewer than it wants', async (): Promise<void> => {
      const setup = await setUp({ shields: 2, size: 2 });

      unitsOut(setup, 2, Settlers);

      expect(setup.choose()).equal(Settlers);
    });

    // Settlers with no city site and no terrain job would only join a city again (civ-clone/web-renderer#243).
    it('should not build Settlers with no city site they could walk to and no terrain job', async (): Promise<void> => {
      // Forest, which isn't worth improving in Civ1.
      const setup = await setUp({
        map: '4FO4FO'.repeat(5),
        shields: 2,
        size: 2,
      });

      unitsOut(setup, 2, Settlers);

      expect(setup.choose()).not.equal(Settlers);

      // Only across the water.
      setup.targets.goodSitesForCities.push(setup.world.get(6, 0));

      expect(setup.choose()).not.equal(Settlers);

      setup.targets.goodSitesForCities.push(setup.world.get(3, 0));

      expect(setup.choose()).equal(Settlers);
    });

    // Plains everywhere, with roads: irrigation is the only job worth anything in Civ1, and with no water anywhere no
    //  worker can do it.
    const plainsWithRoads = async () => {
      const setup = await setUp({ map: '50P', shields: 2, size: 2 });

      setup.world
        .entries()
        .forEach((tile: Tile): void =>
          setup.game.tileImprovements.register(new Road(tile))
        );
      unitsOut(setup, 2, Settlers);

      return setup;
    };

    // Room for more Settlers than the city could have on order, so that choosing again isn't held back by the Settlers
    //  it chose last time.
    const roomy: ProductionPolicy = {
      ...defaultProductionPolicy,
      settlers: 10,
    };

    // A worker of the player's with its moves looks for a job, as `terrainWork` does, and finds none it could do.
    const lookForJob = (setup: SetUp, moves: number = 1): TerrainJob | null => {
      const worker = new Settlers(
        null,
        setup.player,
        setup.world.get(2, 2),
        setup.game.rules
      );

      worker.moves().set(moves);

      const job = chooseTerrainJob(
        setup.dependencies,
        setup.player,
        memoryRegistryInstance.memoryFor(setup.player),
        civ1TerrainPolicy,
        worker
      );

      worker.destroy();

      return job;
    };

    it('should not build Settlers for terrain jobs its workers have found they can do none of', async (): Promise<void> => {
      const setup = await plainsWithRoads();

      // By the policy alone there's a job, so Settlers.
      expect(setup.choose(roomy)).equal(Settlers);

      // A worker with no moves left is offered no actions at all, which says nothing about the jobs.
      expect(lookForJob(setup, 0)).null;
      expect(setup.choose(roomy)).equal(Settlers);

      expect(lookForJob(setup)).null;
      expect(setup.choose(roomy)).not.equal(Settlers);
    });

    it('should forget the terrain jobs its workers could do none of after a while, or once something nearby changes', async (): Promise<void> => {
      const setup = await plainsWithRoads(),
        { dependencies, game, player, world } = setup,
        memory = memoryRegistryInstance.memoryFor(player),
        job = { improvement: 'irrigation' as const, tile: world.get(1, 1) };

      expect(lookForJob(setup)).null;
      expect(isKnownUndoable(dependencies, player, memory, job)).true;
      expect(setup.choose(roomy)).not.equal(Settlers);

      for (let turn = 1; turn < UNDOABLE_TURNS; turn++) {
        game.turn.increment();
      }

      expect(isKnownUndoable(dependencies, player, memory, job)).true;

      game.turn.increment();

      expect(isKnownUndoable(dependencies, player, memory, job)).false;
      expect(setup.choose(roomy)).equal(Settlers);

      // Found again, then something changes beside the tile: it might be doable now.
      expect(lookForJob(setup)).null;
      expect(isKnownUndoable(dependencies, player, memory, job)).true;

      game.tileImprovements.register(new Irrigation(world.get(2, 1)));

      expect(isKnownUndoable(dependencies, player, memory, job)).false;
    });

    it('should build Settlers for a terrain job no worker has claimed, with no city site', async (): Promise<void> => {
      // Grassland, worth a road in Civ1.
      const setup = await setUp({ shields: 2, size: 2 }),
        memory = memoryRegistryInstance.memoryFor(setup.player),
        reachable = landReachableFrom(setup.city.tile());

      unitsOut(setup, 2, Settlers);

      expect(setup.targets.goodSitesForCities).empty;
      expect(
        hasOpenTerrainJob(
          setup.dependencies,
          setup.player,
          memory,
          civ1TerrainPolicy,
          reachable
        )
      ).true;
      expect(setup.choose()).equal(Settlers);

      // With every one of the city's tiles claimed by a worker's job, none is open.
      const jobs = terrainJobs(memory),
        workers = setup.city
          .tiles()
          .entries()
          .map((tile: Tile): Settlers => {
            const worker = new Settlers(
              null,
              setup.player,
              tile,
              setup.game.rules
            );

            jobs.set(worker, { improvement: 'road', tile });

            return worker;
          });

      expect(
        hasOpenTerrainJob(
          setup.dependencies,
          setup.player,
          memory,
          civ1TerrainPolicy,
          reachable
        )
      ).false;

      workers.forEach((worker: Settlers): boolean => jobs.delete(worker));
    });

    it('should count its Settlers with no terrain job, and nothing else, towards the ones it wants for founding cities', async (): Promise<void> => {
      const setup = await setUp({ shields: 2, size: 2 }),
        { dependencies, game, player, world } = setup,
        settlers = new Settlers(null, player, world.get(2, 0), game.rules),
        homed = new Settlers(setup.city, player, world.get(2, 1), game.rules),
        warrior = new Warrior(null, player, world.get(2, 2), game.rules);

      expect(isFoundingSettlers(dependencies, player, settlers)).true;
      expect(isFoundingSettlers(dependencies, player, homed)).true;
      expect(isFoundingSettlers(dependencies, player, warrior)).false;
    });

    it("should not count Settlers on terrain jobs towards the ones it wants for founding cities, as many as Civ1's terrain policy wants (civ-clone/web-renderer#234)", async (): Promise<void> => {
      // Eight cities: Civ1 wants a terrain worker, and 3 + floor(8 × 0.5) = 7 Settlers for founding cities.
      const setup = await setUp({ shields: 2, size: 2 }),
        { dependencies, game, player, world } = setup,
        jobs = terrainJobs(memoryRegistryInstance.memoryFor(player)),
        worker = new Settlers(setup.city, player, world.get(2, 1), game.rules);

      [0, 1, 2, 3, 4, 6, 7].forEach((y: number): void => {
        setup.addCity(y < 5 ? 3 : 0, y % 5);
      });
      expect(game.cities.getByPlayer(player).length).equal(8);

      jobs.set(worker, { improvement: 'road', tile: world.get(2, 1) });
      // Six more out, so seven Settlers in all. The terrain worker is the one the policy wants, so it's left out of the
      //  founding Settlers: that makes six of the seven wanted, and the city builds the seventh even though the worker is
      //  its own.
      unitsOut(setup, 6, Settlers);

      expect(isFoundingSettlers(dependencies, player, worker)).false;
      expect(setup.choose()).equal(Settlers);

      // A second terrain worker is one more than the policy wants: it counts.
      const extra = new Settlers(null, player, world.get(3, 1), game.rules);

      jobs.set(extra, { improvement: 'road', tile: world.get(3, 1) });

      expect(isFoundingSettlers(dependencies, player, worker)).false;
      expect(isFoundingSettlers(dependencies, player, extra)).true;
      expect(setup.choose()).not.equal(Settlers);

      // With no job, the first counts too, and the second is the terrain worker the policy wants.
      jobs.delete(worker);

      expect(isFoundingSettlers(dependencies, player, worker)).true;
      expect(isFoundingSettlers(dependencies, player, extra)).false;
      expect(setup.choose()).not.equal(Settlers);

      jobs.delete(extra);
    });

    it('should count Settlers its other cities are building towards the ones it wants', async (): Promise<void> => {
      // Three cities want 3 + floor(3 × 0.5) = 4 by the default policy: two are out, and the other two cities are
      //  building the rest.
      const setup = await setUp({ shields: 2, size: 2 });

      unitsOut(setup, 2, Settlers);
      [setup.addCity(3, 2), setup.addCity(1, 4)].forEach((other: City): void =>
        setup.game.cityBuilds.getByCity(other).build(Settlers)
      );

      expect(setup.choose()).not.equal(Settlers);
      expect(
        setup.choose({ ...defaultProductionPolicy, settlersPerCity: 1 })
      ).equal(Settlers);
    });

    // One city wants 3 + floor(0.5) = 3 by the default policy, times the leader's Expansion
    //  (civ-clone/web-renderer#157): a third for a Perfectionist, five thirds for an Expansionist.
    it('should want a third as many Settlers as a Perfectionist leader', async (): Promise<void> => {
      const gandhi = await setUp({
          leader: MahatmaGandhi,
          shields: 2,
          size: 2,
        }),
        shaka = await setUp({ leader: Shaka, shields: 2, size: 2 });

      unitsOut(gandhi, 1, Settlers);
      unitsOut(shaka, 1, Settlers);

      expect(gandhi.choose()).not.equal(Settlers);
      expect(shaka.choose()).equal(Settlers);
    });

    it('should want five thirds as many Settlers as an Expansionist leader', async (): Promise<void> => {
      const elizabeth = await setUp({
          leader: ElizabethI,
          shields: 2,
          size: 2,
        }),
        shaka = await setUp({ leader: Shaka, shields: 2, size: 2 });

      unitsOut(elizabeth, 4, Settlers);
      unitsOut(shaka, 3, Settlers);

      expect(elizabeth.choose()).equal(Settlers);
      expect(shaka.choose()).not.equal(Settlers);
    });
  });

  // Warriors first, then a Temple, with as many Settlers out as any of these leaders wants. A Civilized leader weighs
  //  improvements 4/3 and a Militaristic one 2/3 (civ-clone/web-renderer#157).
  describe('a random pick, by the leader (civ-clone/web-renderer#157)', (): void => {
    const pickWith = async (
      leader: typeof Leader,
      random: number
    ): Promise<unknown> => {
      const setup = await setUp({
        government: Despotism,
        leader,
        shields: 1,
        size: 2,
      });

      unitsOut(setup, 5, Settlers);

      buildItemInCity(
        createDependencies({
          ...setup.dependencies,
          randomNumberGenerator: (): number => random,
        }),
        setup.player,
        setup.targets,
        setup.city
      );

      return setup.game.cityBuilds.getByCity(setup.city).building()?.item();
    };

    it('should favour an improvement as a Civilized leader', async (): Promise<void> => {
      // 0.45 of 2 is Warriors; 0.45 of 1 + 4/3 is past Warriors' 1.
      expect(await pickWith(Shaka, 0.45)).equal(Warrior);
      expect(await pickWith(AbrahamLincoln, 0.45)).equal(Temple);
    });

    it('should favour a unit as a Militaristic leader', async (): Promise<void> => {
      // 0.55 of 2 is a Temple; 0.55 of 1 + 2/3 is still Warriors.
      expect(await pickWith(Shaka, 0.55)).equal(Temple);
      expect(await pickWith(GenghisKhan, 0.55)).equal(Warrior);
    });
  });
});
