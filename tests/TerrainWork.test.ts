import {
  Despotism,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import { Forest, Grassland, Plains } from '@civ-clone/civ1-world/Terrains';
import {
  Irrigation,
  Mine,
  Pollution,
  Railroad,
  Road,
} from '@civ-clone/civ1-world/TileImprovements';
import { Railroad as RailroadAdvance } from '@civ-clone/civ1-science/Advances';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import terrainWork, {
  TerrainJobValue,
  chooseTerrainJob,
  terrainJobs,
} from '@civ-clone/base-strategy-terrain-work/lib/Unit/terrainWork';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import Effect from '@civ-clone/core-rule/Effect';
import PollutionConcern from '@civ-clone/base-leader-personality/Rules/Player/PollutionConcern';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import WorkedTile from '@civ-clone/core-city/WorkedTile';
import unitGame, { UnitGame, at } from './lib/unitGame';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import { civ1TerrainPolicy } from '../lib/Civ1/terrain';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { ActiveUnit } from '@civ-clone/civ1-unit/PlayerActions';
import TerrainWork from '@civ-clone/base-strategy-terrain-work/Strategies/Unit/TerrainWork';
import { travelToPathEnd } from '../lib/Unit/moveUnit';
import { expect } from 'chai';
import { instance as memoryRegistryInstance } from '@civ-clone/base-strategy-ai/lib/MemoryRegistry';

// What the Civ1 policy makes of each improvement of the tile at `x`, `y`, as `improvement:value/turns`.
const jobsAt = (
  { dependencies, player, world }: UnitGame,
  x: number,
  y: number
): string[] =>
  civ1TerrainPolicy
    .jobs(dependencies, player, world.get(x, y))
    .map(
      ({ improvement, value, turns }: TerrainJobValue): string =>
        `${improvement}:${value}/${turns}`
    );

const improvements = ({ game }: UnitGame, tile: Tile): string[] =>
  game.tileImprovements
    .getByTile(tile)
    .map(
      (improvement: TileImprovement): string => improvement.constructor.name
    );

// Registers `tileImprovements` as built, and forgets the yields their tiles had before, as `civ1-world`'s `Built` rule
//  does when a unit finishes one.
const build = (
  { game, player }: UnitGame,
  ...tileImprovements: TileImprovement[]
): void => {
  game.tileImprovements.register(...tileImprovements);
  tileImprovements.forEach((improvement: TileImprovement): void =>
    improvement.tile().clearYieldCache(player)
  );
};

//   01234
// 0 GGPPO
// 1 GGPHO
// 2 GGGGO
// A city at 1,1 working the Plains at 2,0, which can't be irrigated: no water beside it.
const MAP = '2G2PO2GPHO4GO';

// Takes away every feature `civ1-world` rolled at random for the tiles of `setup`'s map, but those the map gives,
//  listed as `x,y`: the tests then don't depend on the roll.
const keepFeatures = ({ game, world }: UnitGame, ...keep: string[]): void =>
  world
    .entries()
    .filter((tile: Tile): boolean => !keep.includes(`${tile.x()},${tile.y()}`))
    .forEach((tile: Tile): void =>
      game.terrainFeatures.unregister(
        ...game.terrainFeatures.getByTerrain(tile.terrain())
      )
    );

// The names of the jobs the Civ1 policy offers on the tile at `x`, `y`.
const jobNamesAt = (setup: UnitGame, x: number, y: number): string[] =>
  jobsAt(setup, x, y).map((job: string): string => job.split(':')[0]);

// Does `improvement` to `tile` at once, as the engine would once a worker finished it: an improvement replaces the one
//  it can't share a tile with, and a terrain change takes the tile's features and improvements with it.
const doJob = (setup: UnitGame, improvement: string, tile: Tile): void => {
  const { game, player } = setup,
    conversions: { [job: string]: typeof Terrain } = {
      clearForest: Plains,
      clearJungle: Grassland,
      clearSwamp: Grassland,
      plantForest: Forest,
    },
    improvements: { [job: string]: typeof TileImprovement } = {
      irrigation: Irrigation,
      mine: Mine,
      road: Road,
    };

  if (conversions[improvement]) {
    game.terrainFeatures.unregister(
      ...game.terrainFeatures.getByTerrain(tile.terrain())
    );
    game.tileImprovements.unregister(...game.tileImprovements.getByTile(tile));
    tile.setTerrain(new (conversions[improvement] as any)());
  } else {
    const Replaced = { irrigation: Mine, mine: Irrigation }[
      improvement as 'irrigation' | 'mine'
    ];

    game.tileImprovements.unregister(
      ...game.tileImprovements
        .getByTile(tile)
        .filter(
          (existing: TileImprovement): boolean =>
            Replaced !== undefined && existing instanceof Replaced
        )
    );
    game.tileImprovements.register(
      new (improvements[improvement] as any)(tile)
    );
  }

  tile.clearYieldCache(player);
  tile.clearYieldCache(null);
};

describe('TerrainWork', (): void => {
  it("should value Civ1's improvements by what they add to a tile under the player's government", async (): Promise<void> => {
    const despotism = await unitGame(MAP, 3, 5, Despotism),
      monarchy = await unitGame(MAP, 3, 5, Monarchy);

    [despotism, monarchy].forEach((setup) => setup.addCity(1, 1, 1));

    // Under Despotism, an irrigated Grassland tile gives no more food, but a road adds trade. Unworked: worth half.
    expect(jobsAt(despotism, 0, 1)).to.deep.equal(['road:0.5/1']);
    // Under Monarchy it does: food is worth 2.5 times as much as trade to a city with 2 to spare, and irrigation a
    //  quarter more again.
    expect(jobsAt(monarchy, 0, 1)).to.deep.equal([
      'irrigation:1.5625/4',
      'road:0.5/1',
    ]);
    // The worked Plains tile, worth twice an unworked one, to a city with 1 food to spare.
    expect(jobsAt(despotism, 2, 0)).to.deep.equal([
      'irrigation:3.75/4',
      'road:1/1',
    ]);
    // Hills: a mine adds two shields under Despotism, three under Monarchy. Irrigating or mining Hills takes 10 turns
    //  in Civ1, counting the turn of the order, so 9 more. Irrigated, the Hills beside the sea would carry water on to
    //  the dry Plains at 2,1, worth half what irrigating those is worth (civ-clone/web-renderer#428).
    expect(jobsAt(despotism, 3, 1)).to.deep.equal([
      'irrigation:2.8125/9',
      'mine:2.25/9',
    ]);
    expect(jobsAt(monarchy, 3, 1)).to.deep.equal([
      'irrigation:2.34375/9',
      'mine:3.375/9',
    ]);

    // An improvement already there isn't offered again. Irrigated Hills are the only water the Plains at 2,1 could
    //  have, so they aren't mined while those are worth irrigating.
    despotism.game.tileImprovements.register(
      new Irrigation(despotism.world.get(3, 1)),
      new Road(despotism.world.get(3, 0))
    );

    expect(jobsAt(despotism, 3, 1)).to.deep.equal([]);
    expect(jobsAt(despotism, 3, 0)).to.deep.equal(['irrigation:3.75/4']);

    // Once they're irrigated, a mine replaces the Hills' irrigation, losing its food.
    build(despotism, new Irrigation(despotism.world.get(2, 1)));

    expect(jobsAt(despotism, 3, 1)).to.deep.equal(['mine:0.75/9']);
  });

  it('should value a railroad on a road once the player has the Railroad advance, by half of each yield', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Despotism);

    setup.addCity(1, 1, 1);
    build(
      setup,
      new Road(setup.world.get(0, 1)),
      new Road(setup.world.get(2, 0))
    );

    // No railroad without the advance.
    expect(jobsAt(setup, 0, 1)).to.deep.equal([]);

    setup.game.playerResearch
      .getByPlayer(setup.player)
      .addAdvance(RailroadAdvance);

    // Grassland with a road: 2 food, 1 trade, so a railroad adds 1 food, to a city with at most 1 to spare. Unworked:
    //  worth half. A railroad takes 4 turns on Grassland in Civ1, counting the turn of the order, so 3 more.
    expect(jobsAt(setup, 0, 1)).to.deep.equal(['railroad:1.5/3']);
    // The worked Plains with a road: 1 food, 1 shield, 1 trade, so a railroad adds nothing.
    expect(jobsAt(setup, 2, 0)).to.deep.equal(['irrigation:3.75/4']);
    // No road, no railroad yet: but a road is now worth the railroad it allows (civ-clone/web-renderer#385), 1 food
    //  more on Grassland, for the turns of both.
    expect(jobsAt(setup, 1, 0)).to.deep.equal(['road:2/4']);

    // Hills with a mine and a road: 1 food, 2 shields, so a railroad adds 1 shield, to a city with at most 1 to
    //  spare. A railroad takes 8 turns on Hills in Civ1, so 7 more.
    build(
      setup,
      new Mine(setup.world.get(3, 1)),
      new Road(setup.world.get(3, 1))
    );

    expect(jobsAt(setup, 3, 1)).to.deep.equal(['railroad:1.125/7']);
  });

  it('should value the trade a railroad adds', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Republic);

    setup.addCity(1, 1, 1);
    build(setup, new Road(setup.world.get(0, 1)));
    setup.game.playerResearch
      .getByPlayer(setup.player)
      .addAdvance(RailroadAdvance);

    // Grassland with a road under the Republic: 2 food, 2 trade, so a railroad adds 1 food and 1 trade.
    expect(jobsAt(setup, 0, 1)).to.deep.equal([
      'irrigation:1.5625/4',
      'railroad:1.75/3',
    ]);
  });

  it('should have Settlers build a railroad on a road once the player has the Railroad advance', async (): Promise<void> => {
    // Grassland everywhere, roads already built, and no water for irrigation: a railroad is the only job left.
    const setup = await unitGame('15G', 3, 5, Despotism),
      city = setup.addCity(2, 1, 1),
      settlers = setup.addUnit(Settlers, 0, 0, city);

    setup.world
      .entries()
      .filter((tile: Tile): boolean => tile !== city.tile())
      .forEach((tile: Tile): void =>
        setup.game.tileImprovements.register(new Road(tile))
      );

    setup.game.playerResearch
      .getByPlayer(setup.player)
      .addAdvance(RailroadAdvance);

    await setup.takeTurns(2);

    expect(settlers.busy()?.constructor.name).to.equal('BuildingRailroad');
  });

  it('should choose the job worth most for the turns it takes, that the worker could do there', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Despotism),
      city = setup.addCity(1, 1, 1),
      settlers = setup.addUnit(Settlers, 0, 0, city),
      job = chooseTerrainJob(
        setup.dependencies,
        setup.player,
        memoryRegistryInstance.memoryFor(setup.player),
        civ1TerrainPolicy,
        settlers
      );

    // Irrigating the worked Plains at 2,0 would be worth most, but there's no water beside it. Irrigating the Plains at
    //  3,0 beside the sea is worth as much (half for itself, half for carrying water to 2,0), 3 tiles away: 3.75 over
    //  4 + 3 turns, ahead of a road at 2,0 (1 over 1 + 2).
    expect(
      job && `${job.improvement}@${job.tile.x()},${job.tile.y()}`
    ).to.equal('irrigation@3,0');
  });

  it('should not have two workers claim the same tile', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Despotism),
      city = setup.addCity(1, 1, 1),
      memory = memoryRegistryInstance.memoryFor(setup.player),
      first = setup.addUnit(Settlers, 0, 0, city),
      second = setup.addUnit(Settlers, 0, 0, city),
      choose = (unit: typeof first) =>
        chooseTerrainJob(
          setup.dependencies,
          setup.player,
          memory,
          civ1TerrainPolicy,
          unit
        )!;

    terrainJobs(memory).set(first, choose(first));

    expect(choose(second).tile).not.to.equal(
      terrainJobs(memory).get(first)!.tile
    );
  });

  it('should walk Settlers with no city site to their job, do it, and go on to the next', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Despotism),
      city = setup.addCity(1, 1, 1),
      settlers = setup.addUnit(Settlers, 0, 0, city),
      plains = setup.world.get(3, 0),
      tiles: string[] = [];

    await setup.takeTurns(3, () => tiles.push(at(settlers)));

    // Through the city, to irrigate the Plains beside the sea, which carry water on to the Plains the city works.
    expect(tiles).to.deep.equal(['1,1', '2,1', '3,0']);
    expect(improvements(setup, plains)).to.deep.equal([]);

    // It starts the turn after it arrived with no moves left.
    await setup.takeTurns(1);

    expect(settlers.busy()?.constructor.name).to.equal('BuildingIrrigation');

    // The work done, as the engine would at the start of the next turn. (A `Game` other than the default one doesn't
    //  finish delayed actions.)
    build(setup, new Irrigation(plains));
    settlers.setBusy();

    await setup.takeTurns(1);

    // On to the next job.
    const next = terrainJobs(
      memoryRegistryInstance.memoryFor(setup.player)
    ).get(settlers);

    expect(next).not.to.equal(undefined);
    expect(next!.tile).not.to.equal(plains);
  });

  it('should keep Settlers for a city site they can reach, until the player wants a terrain worker', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Despotism),
      city = setup.addCity(1, 1, 1),
      settlers = setup.addUnit(Settlers, 0, 0, city),
      memory = memoryRegistryInstance.memoryFor(setup.player),
      attempt = (workersWanted: number): Promise<boolean> =>
        new TerrainWork(
          setup.dependencies,
          civ1Knowledge,
          {
            ...civ1TerrainPolicy,
            workersWanted: () => workersWanted,
          },
          travelToPathEnd
        ).attempt(new ActiveUnit(setup.player, settlers));

    memory.targets.goodSitesForCities.push(setup.world.get(3, 2));

    expect(await attempt(0)).false;
    expect(terrainJobs(memory).has(settlers)).false;

    expect(await attempt(1)).true;
    expect(terrainJobs(memory).has(settlers)).true;
  });

  it('should want a terrain worker in Civ1 for every six cities', async (): Promise<void> => {
    const setup = await unitGame('64G', 8, 8, Despotism),
      wanted = (): number =>
        civ1TerrainPolicy.workersWanted(setup.dependencies, setup.player);

    [0, 1, 2, 3, 4].forEach((x) => setup.addCity(x, x % 2 === 0 ? 1 : 5));

    expect(wanted()).to.equal(0);

    setup.addCity(5, 5);

    expect(wanted()).to.equal(1);
  });

  it('should send Settlers with no city site they can reach to a terrain job', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Despotism),
      city = setup.addCity(1, 1, 1),
      settlers = setup.addUnit(Settlers, 0, 0, city),
      memory = memoryRegistryInstance.memoryFor(setup.player);

    // A site across the sea.
    memory.targets.goodSitesForCities.push(setup.world.get(4, 1));

    expect(
      await new TerrainWork(
        setup.dependencies,
        civ1Knowledge,
        civ1TerrainPolicy,
        travelToPathEnd
      ).attempt(new ActiveUnit(setup.player, settlers))
    ).true;
    expect(terrainJobs(memory).has(settlers)).true;
  });
  it('should look past the best jobs the worker could not do for one it could', async (): Promise<void> => {
    // No water anywhere, so no irrigation: each tile's irrigation is ranked above every road, and none can be done.
    const setup = await unitGame('15G', 3, 5, Despotism),
      city = setup.addCity(2, 1, 1),
      settlers = setup.addUnit(Settlers, 0, 0, city),
      job = chooseTerrainJob(
        setup.dependencies,
        setup.player,
        memoryRegistryInstance.memoryFor(setup.player),
        {
          jobs: () => [
            { improvement: 'irrigation', value: 10, turns: 1 },
            { improvement: 'road', value: 1, turns: 1 },
          ],
          workersWanted: () => 0,
        },
        settlers
      );

    expect(job?.improvement).to.equal('road');
  });

  it('should forget the path to a job that is no longer worth doing', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Despotism),
      city = setup.addCity(1, 1, 1),
      settlers = setup.addUnit(Settlers, 0, 0, city),
      memory = memoryRegistryInstance.memoryFor(setup.player),
      plains = setup.world.get(3, 0);

    // On its way to irrigate the Plains at 3,0, then someone else does it and there's nothing else worth doing.
    await setup.takeTurns(1);

    expect(terrainJobs(memory).get(settlers)?.tile === plains).true;
    expect(memory.unitPathData.get(settlers)?.end() === plains).true;

    setup.game.tileImprovements.register(new Irrigation(plains));

    expect(
      await terrainWork(
        setup.dependencies,
        setup.player,
        memory,
        { jobs: () => [], workersWanted: () => 0 },
        settlers,
        {},
        () =>
          travelToPathEnd(
            setup.dependencies,
            setup.player,
            memory,
            civ1Knowledge,
            settlers
          )
      )
    ).false;
    expect(terrainJobs(memory).has(settlers)).false;
    expect(memory.unitPathData.has(settlers)).false;
  });

  it('should send a worker standing on its job tile, not yet at work, to settle a site that comes within reach', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Despotism),
      city = setup.addCity(1, 1, 1),
      settlers = setup.addUnit(Settlers, 0, 0, city),
      memory = memoryRegistryInstance.memoryFor(setup.player);

    // It arrives at the Plains at 3,0 with no moves left, so starts work the turn after.
    await setup.takeTurns(3);

    expect(at(settlers)).to.equal('3,0');
    expect(settlers.busy()).to.equal(null);

    setup.game.rules.process(TurnStart, setup.player);
    memory.targets.goodSitesForCities.push(setup.world.get(3, 2));

    expect(
      await new TerrainWork(
        setup.dependencies,
        civ1Knowledge,
        civ1TerrainPolicy,
        travelToPathEnd
      ).attempt(new ActiveUnit(setup.player, settlers))
    ).false;
    expect(terrainJobs(memory).has(settlers)).false;
  });
  it('should value food by how little of it the city has to spare', async (): Promise<void> => {
    // No water anywhere. A city at 3,2 working its best tile: plain Grassland (3 food to spare, its own tile irrigated
    //  under Monarchy) or Grassland with Game (5 to spare).
    const plain = await unitGame('35G', 5, 7, Monarchy),
      rich = await unitGame('16GGa18G', 5, 7, Monarchy);

    keepFeatures(plain);
    keepFeatures(rich, '2,2');
    plain.addCity(3, 2, 1);
    rich.addCity(3, 2, 1);

    // The same unworked Grassland: under Monarchy, irrigation adds a point of food, worth 2 to the city with 3 to spare
    //  and 1.5 to the one with 5, times a quarter more for irrigation, and half for a tile not worked.
    expect(jobsAt(plain, 5, 3)).to.include('irrigation:1.25/4');
    expect(jobsAt(rich, 5, 3)).to.include('irrigation:0.9375/4');
  });

  it('should clear worked Swamp and Jungle with no feature, and Forest only where the Plains could then be irrigated', async (): Promise<void> => {
    //   0123456
    // 0 OOSSFOO   (a Swamp, a Swamp with Oil, a Forest beside the sea)
    // 1 OGGGFGO   (a Forest with no water beside it)
    // 2 OGGGGGO
    // 3 OGJGGGO   (a Jungle)
    // 4 OOOOOOO
    const setup = await unitGame('2OSSoF2OO3GFGOO5GOOGJ3GO7O', 5, 7, Despotism);

    keepFeatures(setup, '3,0');

    const city = setup.addCity(3, 2, 1);

    // Not worth 15 turns' work on a tile the city doesn't work.
    expect(jobNamesAt(setup, 2, 0)).not.to.include('clearSwamp');

    // The city works them all (one of them already).
    ['2,0', '3,0', '4,0', '4,1', '2,3']
      .map((xy: string): Tile => {
        const [x, y] = xy.split(',').map(Number);

        return setup.world.get(x, y);
      })
      .filter((tile: Tile): boolean => !setup.game.workedTiles.getByTile(tile))
      .forEach((tile: Tile): void =>
        setup.game.workedTiles.register(new WorkedTile(tile, city))
      );

    expect(jobNamesAt(setup, 2, 0)).to.include('clearSwamp');
    expect(jobNamesAt(setup, 2, 3)).to.include('clearJungle');
    // Oil would be lost.
    expect(jobNamesAt(setup, 3, 0)).not.to.include('clearSwamp');
    // Plains beside the sea, then irrigated: a shield lost, a point of food gained. Clearing a Forest takes 5 turns in
    //  Civ1 and irrigating Plains 5, so 4 more each.
    expect(jobsAt(setup, 4, 0)).to.include('clearForest:1.5/8');
    // Plains with no water to irrigate them only lose a shield.
    expect(jobNamesAt(setup, 4, 1)).not.to.include('clearForest');
  });

  it('should build a Road, then a Railroad, along the route between two cities', async (): Promise<void> => {
    // Grassland, no water, wide enough not to wrap round: cities at 2,3 and 8,3, whose tiles don't reach 5,3.
    const setup = await unitGame('105G', 7, 15, Despotism),
      between = setup.world.get(5, 3);

    keepFeatures(setup);
    setup.addCity(2, 3, 1);
    setup.addCity(8, 3, 1);

    expect(
      civ1TerrainPolicy.tiles!(setup.dependencies, setup.player).includes(
        between
      )
    ).true;
    // Worth a point of trade for the route alone. A Road takes 2 turns on Grassland in Civ1, so 1 more.
    expect(jobsAt(setup, 5, 3)).to.deep.equal(['road:1/1']);
    // Off the route, outside the cities' tiles: nothing.
    expect(jobsAt(setup, 5, 0)).to.deep.equal([]);

    // With Roads all the way, and Railroad known: a Railroad, for the route alone, as no city works the square.
    [3, 4, 5, 6, 7].forEach((x: number): void =>
      build(setup, new Road(setup.world.get(x, 3)))
    );
    setup.game.playerResearch
      .getByPlayer(setup.player)
      .addAdvance(RailroadAdvance);

    expect(jobsAt(setup, 5, 3)).to.deep.equal(['railroad:1/3']);

    build(setup, new Railroad(between));

    expect(jobsAt(setup, 5, 3)).to.deep.equal([]);
  });

  it('should build a Road where only the Railroad it allows adds anything, once Railroad is known', async (): Promise<void> => {
    // A River at 2,0 beside a city at 2,2: a Road adds nothing to a River in Civ1.
    const setup = await unitGame('2GR22G', 5, 5, Monarchy);

    keepFeatures(setup);
    setup.addCity(2, 2, 1);

    expect(jobNamesAt(setup, 2, 0)).not.to.include('road');

    setup.game.playerResearch
      .getByPlayer(setup.player)
      .addAdvance(RailroadAdvance);

    // The Railroad then adds a point of food to the River's 2.
    expect(jobNamesAt(setup, 2, 0)).to.include('road');
  });

  it('should clean up pollution, the more where the city works the square and the more its leader minds', async (): Promise<void> => {
    const setup = await unitGame('25G', 5, 5, Monarchy),
      jobFor = (x: number, y: number): number =>
        civ1TerrainPolicy
          .jobs(setup.dependencies, setup.player, setup.world.get(x, y))
          .find(
            ({ improvement }: TerrainJobValue): boolean =>
              improvement === 'cleanPollution'
          )?.value ?? 0;

    keepFeatures(setup);

    const city = setup.addCity(2, 2, 1),
      [worked] = setup.game.workedTiles
        .getByCity(city)
        .map((workedTile) => workedTile.tile())
        .filter((tile: Tile): boolean => tile !== city.tile()),
      unworked = setup.world
        .entries()
        .find(
          (tile: Tile): boolean =>
            tile !== worked &&
            tile !== city.tile() &&
            city.tiles().includes(tile)
        )!;

    build(setup, new Pollution(worked), new Pollution(unworked));

    expect(jobFor(worked.x(), worked.y())).to.be.above(
      jobFor(unworked.x(), unworked.y())
    );
    expect(jobFor(unworked.x(), unworked.y())).to.be.above(0);

    const before = jobFor(worked.x(), worked.y());

    setup.game.rules.register(new PollutionConcern(new Effect(() => 2)));

    expect(jobFor(worked.x(), worked.y())).to.be.closeTo(2 * before, 1e-9);
  });

  // Each job the policy offers `setup`'s player, best first, done at once (`doJob`), until there are none left or 100
  //  are done: as `job@x,y`.
  const doEveryJob = (setup: UnitGame, worker: Settlers): string[] => {
    const memory = memoryRegistryInstance.memoryFor(setup.player),
      done: string[] = [];

    for (let i = 0; i < 100; i++) {
      const job = chooseTerrainJob(
        setup.dependencies,
        setup.player,
        memory,
        civ1TerrainPolicy,
        worker
      );

      if (!job) {
        break;
      }

      done.push(`${job.improvement}@${job.tile.x()},${job.tile.y()}`);
      doJob(setup, job.improvement, job.tile);
    }

    return done;
  };

  it('should carry water to a dry tile worth irrigating by clearing the Forest beside the sea first', async (): Promise<void> => {
    // Water only at 0,1. The Desert Oasis at 2,1 has none beside it, and only the Forest at 1,1, outside the city's
    //  tiles, could carry it there: cleared to Plains and irrigated from the sea. Under Despotism a mine adds a shield
    //  to Desert, worth less than irrigation's food, so the Oasis isn't mined while it waits for the water.
    //   0123456
    // 0 TTTTTTT
    // 1 OFdGGMT
    // 2 TMMGMMT
    // 3 TMGGGMT
    // 4 TMGGGMT
    // 5 TMMMMMT
    // 6 TTTTTTT
    const setup = await unitGame(
        ['7T', 'OFDiGGMT', 'T2MG2MT', 'TM3GMT', 'TM3GMT', 'T5MT', '7T'].join(
          ''
        ),
        7,
        7,
        Despotism
      ),
      forest = setup.world.get(1, 1);

    keepFeatures(setup, '2,1');

    const city = setup.addCity(3, 3, 1),
      done = doEveryJob(setup, setup.addUnit(Settlers, 3, 3, city));

    expect(city.tiles().includes(forest)).false;
    expect(
      civ1TerrainPolicy.tiles!(setup.dependencies, setup.player).includes(
        forest
      )
    ).true;
    // The jobs ran out rather than undoing each other.
    expect(done.length).to.be.below(100);
    expect(improvements(setup, setup.world.get(2, 1))).to.include('Irrigation');
    expect(done.indexOf('clearForest@1,1')).to.be.above(-1);
    expect(done.indexOf('irrigation@1,1')).to.be.above(
      done.indexOf('clearForest@1,1')
    );
    expect(done.indexOf('irrigation@2,1')).to.be.above(
      done.indexOf('irrigation@1,1')
    );
    // Planting the Forest back isn't worth the food it has since.
    expect(done).not.to.include('plantForest@1,1');
  });

  it('should carry water to the Desert Oasis on the map from #426, irrigating Hills for a while', async (): Promise<void> => {
    // The map from civ-clone/web-renderer#426, with its city at 3,3. The Desert Oasis at 2,1 has no water beside it.
    //   0123456
    // 0 OOTTTOO
    // 1 OFdGPfO
    // 2 OMGggHO
    // 3 OmgGPTD
    // 4 OHPGgtO
    // 5 OHhHTFO
    // 6 OOOAOTO
    const setup = await unitGame(
      [
        '2O3T2O',
        'OFDiGPFaO',
        'OMGGdGdHcO',
        'OMgGdGPTD',
        'OHPGGdTaO',
        'OHHcHTFO',
        '3OAOTO',
      ].join(''),
      7,
      7,
      Monarchy
    );

    keepFeatures(
      setup,
      '2,1',
      '5,1',
      '3,2',
      '4,2',
      '5,2',
      '1,3',
      '2,3',
      '4,4',
      '5,4',
      '2,5'
    );

    const city = setup.addCity(3, 3, 1),
      done = doEveryJob(setup, setup.addUnit(Settlers, 3, 3, city));

    expect(done.length).to.be.below(100);
    expect(improvements(setup, setup.world.get(2, 1))).to.include('Irrigation');
    // The Hills at 2,5 beside the sea are irrigated for their own food, the water is carried on from them, and they're
    //  mined once nothing needs it.
    expect(done.indexOf('irrigation@2,5')).to.be.above(-1);
    expect(done.indexOf('irrigation@2,1')).to.be.above(
      done.indexOf('irrigation@2,5')
    );
    expect(done.indexOf('mine@2,5')).to.be.above(
      done.indexOf('irrigation@2,1')
    );
  });
  // A city at 3,3 of `size` working only `worked` (as `x,y`) besides its own tile, on a 7×7 `map`, its features taken
  //  away but those at `keep`. Under Monarchy, a city of 1 working plain Grassland has 3 food to spare and no shields.
  const plantingGame = async (
    map: string,
    worked: string[],
    keep: string[] = [],
    size: number = 1
  ): Promise<UnitGame> => {
    const setup = await unitGame(map, 7, 7, Monarchy);

    keepFeatures(setup, ...keep);

    const city = setup.addCity(3, 3, size);

    setup.game.workedTiles.unregister(
      ...setup.game.workedTiles
        .getByCity(city)
        .filter(
          (workedTile: WorkedTile): boolean => workedTile.tile() !== city.tile()
        )
    );
    worked.forEach((xy: string): void => {
      const [x, y] = xy.split(',').map(Number);

      setup.game.workedTiles.register(
        new WorkedTile(setup.world.get(x, y), city)
      );
    });

    return setup;
  };

  // The Forest planting job on the tile at 1,3, if any.
  const plantingAt = (setup: UnitGame): string | undefined =>
    jobsAt(setup, 1, 3).find((job: string): boolean =>
      job.startsWith('plantForest')
    );

  it('should plant Forest on dry Grassland a city works, when the city has food to spare and few shields', async (): Promise<void> => {
    // A point of food, worth 2 to a city with 3 to spare, for two shields, worth 2.25 each to a city with at most 1. Planting
    //  Forest on Grassland takes 10 turns in Civ1, so 9 more.
    expect(plantingAt(await plantingGame('49G', ['1,3']))).to.equal(
      'plantForest:2.5/9'
    );

    // Not on a tile the city doesn't work.
    expect(plantingAt(await plantingGame('49G', ['5,3']))).to.be.undefined;

    // Nor for a city with less food to spare: Despotism gives the city's own Grassland no more food for its irrigation.
    const despotism = await unitGame('49G', 7, 7, Despotism);

    keepFeatures(despotism);

    const city = despotism.addCity(3, 3, 1),
      [worked] = despotism.game.workedTiles
        .getByCity(city)
        .map((workedTile: WorkedTile): Tile => workedTile.tile())
        .filter((tile: Tile): boolean => tile !== city.tile());

    expect(jobNamesAt(despotism, worked.x(), worked.y())).not.to.include(
      'plantForest'
    );

    // Nor for a city with more than 2 shields: a city of 3 working Forest with Game and Grassland with a Shield as well
    //  has 4 food to spare and 3 shields. With plain Grassland instead, 3 food and none.
    expect(
      plantingAt(
        await plantingGame(
          '25GFaGd22G',
          ['1,3', '4,3', '5,3'],
          ['4,3', '5,3'],
          3
        )
      )
    ).to.be.undefined;
    expect(
      plantingAt(await plantingGame('49G', ['1,3', '4,3', '5,3'], [], 3))
    ).to.equal('plantForest:2.5/9');

    // Nor on a square with a feature, irrigation or a mine.
    expect(plantingAt(await plantingGame('22GGd26G', ['1,3'], ['1,3']))).to.be
      .undefined;

    for (const Improvement of [Irrigation, Mine]) {
      const setup = await plantingGame('49G', ['1,3']);

      build(setup, new (Improvement as any)(setup.world.get(1, 3)));

      expect(plantingAt(setup)).to.be.undefined;
    }
  });

  it("should count a Road's trade, and a Railroad's share, against planting Forest", async (): Promise<void> => {
    // The Road's point of trade is lost: 2.5 - 1.
    const road = await plantingGame('49G', ['1,3']);

    build(road, new Road(road.world.get(1, 3)));

    expect(plantingAt(road)).to.equal('plantForest:1.5/9');

    // With a Railroad too, the square gives 3 food and 1 trade, the city 4 food to spare (each point worth 1.5): the
    //  Forest would give 1 food and 3 shields. 2 food and the trade lost, 3 shields gained at 2.25: 2.75.
    const railroad = await plantingGame('49G', ['1,3']);

    build(
      railroad,
      new Road(railroad.world.get(1, 3)),
      new Railroad(railroad.world.get(1, 3))
    );

    expect(plantingAt(railroad)).to.equal('plantForest:2.75/9');
  });

  it('should not plant Forest where the sea three squares off could be carried to the square', async (): Promise<void> => {
    // The sea three squares north, past two squares of Grassland that could be irrigated in turn.
    expect(plantingAt(await plantingGame('1G1O47G', ['1,3']))).to.be.undefined;
  });

  it('should not plant Forest beside a Jungle that could be cleared to carry water to it', async (): Promise<void> => {
    // A Jungle north of the square with the sea north of it: cleared, it could be irrigated and carry the water on.
    expect(plantingAt(await plantingGame('8G1O6G1J33G', ['1,3']))).to.be
      .undefined;
  });

  it('should leave a point of food for each Forest already being planted for the city', async (): Promise<void> => {
    // A city of 2 working two plain Grasslands: 3 food to spare.
    const setup = await plantingGame('49G', ['1,3', '5,3'], [], 2);

    expect(plantingAt(setup)).to.equal('plantForest:2.5/9');

    // Another worker is planting Forest at 5,3: the city will have 2 food to spare once it's done.
    const setupPlanting = await plantingGame('49G', ['1,3', '5,3'], [], 2);

    terrainJobs(memoryRegistryInstance.memoryFor(setupPlanting.player)).set(
      setupPlanting.addUnit(Settlers, 5, 3),
      {
        improvement: 'plantForest',
        action: 'plantForest',
        tile: setupPlanting.world.get(5, 3),
      }
    );

    expect(plantingAt(setupPlanting)).to.be.undefined;
  });

  it('should irrigate Hills beside the sea to carry water to dry tiles, and mine them once those are irrigated', async (): Promise<void> => {
    // The only water any tile worth irrigating could have comes through the Hills at 1,1, beside the sea.
    //   0123456
    // 0 OMMMMMO
    // 1 OHPPGMO
    // 2 OMGGGMO
    // 3 OMGGGMO
    // 4 OMMMMMO
    const map = ['O5MO', 'OHPPGMO', 'OM3GMO', 'OM3GMO', 'O5MO'].join(''),
      setup = await unitGame(map, 5, 7, Monarchy);

    keepFeatures(setup);

    const city = setup.addCity(3, 2, 1),
      done = doEveryJob(setup, setup.addUnit(Settlers, 3, 2, city));

    expect(done.length).to.be.below(100);
    expect(improvements(setup, setup.world.get(2, 1))).to.include('Irrigation');
    expect(done.indexOf('irrigation@1,1')).to.be.above(-1);
    expect(done.indexOf('irrigation@2,1')).to.be.above(
      done.indexOf('irrigation@1,1')
    );
    expect(done.indexOf('mine@1,1')).to.be.above(
      done.indexOf('irrigation@2,1')
    );

    // Hills outside the city's tiles, which only carrying the water would make worth irrigating, are sent a worker for
    //  it while they have no mine, and not once they have one.
    const outside = async (mine: boolean): Promise<UnitGame> => {
      const setup = await unitGame(map, 5, 7, Monarchy);

      keepFeatures(setup);
      setup.addCity(4, 2, 1);

      if (mine) {
        build(setup, new Mine(setup.world.get(1, 1)));
      }

      return setup;
    };
    const unmined = await outside(false),
      mined = await outside(true),
      offered = (setup: UnitGame): boolean =>
        civ1TerrainPolicy.tiles!(setup.dependencies, setup.player).includes(
          setup.world.get(1, 1)
        );

    expect(offered(unmined)).true;
    expect(jobNamesAt(unmined, 1, 1)).to.include('irrigation');
    expect(offered(mined)).false;
    expect(jobsAt(mined, 1, 1)).to.deep.equal([]);
  });
});
