import { Despotism, Monarchy } from '@civ-clone/civ1-government/Governments';
import { Irrigation, Road } from '@civ-clone/civ1-world/TileImprovements';
import { Railroad as RailroadAdvance } from '@civ-clone/civ1-science/Advances';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import terrainWork, {
  TerrainJobValue,
  chooseTerrainJob,
  terrainJobs,
} from '@civ-clone/base-strategy-terrain-work/lib/Unit/terrainWork';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
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

//   01234
// 0 GGPPO
// 1 GGPHO
// 2 GGGGO
// A city at 1,1 working the Plains at 2,0, which can't be irrigated: no water beside it.
const MAP = '2G2PO2GPHO4GO';

describe('TerrainWork', (): void => {
  it("should value Civ1's improvements by what they add to a tile under the player's government", async (): Promise<void> => {
    const despotism = await unitGame(MAP, 3, 5, Despotism),
      monarchy = await unitGame(MAP, 3, 5, Monarchy);

    [despotism, monarchy].forEach((setup) => setup.addCity(1, 1, 1));

    // Under Despotism, an irrigated Grassland tile gives no more food, but a road adds trade. Unworked: worth half.
    expect(jobsAt(despotism, 0, 1)).to.deep.equal(['road:0.5/1']);
    // Under Monarchy it does, and food is worth twice as much as trade.
    expect(jobsAt(monarchy, 0, 1)).to.deep.equal([
      'irrigation:1/4',
      'road:0.5/1',
    ]);
    // The worked Plains tile, worth twice an unworked one.
    expect(jobsAt(despotism, 2, 0)).to.deep.equal([
      'irrigation:3/4',
      'road:1/1',
    ]);
    // Hills: a mine adds two shields under Despotism, three under Monarchy. Irrigating or mining Hills takes 10 turns
    //  in Civ1, counting the turn of the order, so 9 more.
    expect(jobsAt(despotism, 3, 1)).to.deep.equal([
      'irrigation:1.5/9',
      'mine:2.25/9',
    ]);
    expect(jobsAt(monarchy, 3, 1)).to.deep.equal([
      'irrigation:1/9',
      'mine:3.375/9',
    ]);

    // An improvement already there isn't offered again, and a mine replaces irrigation, losing its food.
    despotism.game.tileImprovements.register(
      new Irrigation(despotism.world.get(3, 1)),
      new Road(despotism.world.get(3, 0))
    );

    expect(jobsAt(despotism, 3, 1)).to.deep.equal(['mine:0.75/9']);
    expect(jobsAt(despotism, 3, 0)).to.deep.equal(['irrigation:1.5/4']);
  });

  it('should value a railroad on a road once the player has the Railroad advance, by half of each yield', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Despotism);

    setup.addCity(1, 1, 1);
    setup.game.tileImprovements.register(
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
    expect(jobsAt(setup, 2, 0)).to.deep.equal(['irrigation:3/4']);
    // No road, no railroad.
    expect(jobsAt(setup, 1, 0)).to.deep.equal(['road:0.5/1']);
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

    // Irrigating the worked Plains at 2,0 would be worth most, but there's no water beside it. Next is a road there, 2
    //  tiles away: 1 over 1 + 2 turns, ahead of irrigating the Plains at 3,0 beside the sea (1.5 over 4 + 2).
    expect(
      job && `${job.improvement}@${job.tile.x()},${job.tile.y()}`
    ).to.equal('road@2,0');
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
      plains = setup.world.get(2, 0),
      tiles: string[] = [];

    await setup.takeTurns(2, () => tiles.push(at(settlers)));

    // Through the city, to build a road on the Plains it works.
    expect(tiles).to.deep.equal(['1,1', '2,0']);
    expect(improvements(setup, plains)).to.deep.equal([]);

    // It starts the turn after it arrived with no moves left.
    await setup.takeTurns(1);

    expect(settlers.busy()?.constructor.name).to.equal('BuildingRoad');

    // The work done, as the engine would at the start of the next turn. (A `Game` other than the default one doesn't
    //  finish delayed actions.)
    setup.game.tileImprovements.register(new Road(plains));
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

  it('should want a terrain worker in Civ1 for every eight cities', async (): Promise<void> => {
    const setup = await unitGame('64G', 8, 8, Despotism),
      wanted = (): number =>
        civ1TerrainPolicy.workersWanted(setup.dependencies, setup.player);

    [0, 1, 2, 3, 4, 5, 6].forEach((x) => setup.addCity(x, x % 2 === 0 ? 1 : 5));

    expect(wanted()).to.equal(0);

    setup.addCity(7, 1);

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
      plains = setup.world.get(2, 0);

    // On its way to build a road on the Plains at 2,0, then someone else builds it and there's nothing else worth
    //  doing.
    await setup.takeTurns(1);

    expect(terrainJobs(memory).get(settlers)?.tile).to.equal(plains);
    expect(memory.unitPathData.get(settlers)?.end()).to.equal(plains);

    setup.game.tileImprovements.register(new Road(plains));

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

    // It arrives at the Plains at 2,0 with no moves left, so starts work the turn after.
    await setup.takeTurns(2);

    expect(at(settlers)).to.equal('2,0');
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
});
