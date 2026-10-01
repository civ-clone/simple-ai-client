import { Despotism, Monarchy } from '@civ-clone/civ1-government/Governments';
import { Irrigation, Road } from '@civ-clone/civ1-world/TileImprovements';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import {
  TerrainJobValue,
  chooseTerrainJob,
  terrainJobs,
} from '../lib/Unit/terrainWork';
import unitGame, { UnitGame, at } from './lib/unitGame';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import { civ1TerrainPolicy } from '../lib/Civ1/terrain';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { ActiveUnit } from '@civ-clone/civ1-unit/PlayerActions';
import TerrainWork from '../Strategies/Unit/TerrainWork';
import { expect } from 'chai';
import { instance as memoryRegistryInstance } from '../lib/MemoryRegistry';

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
      'irrigation:1/2',
      'road:0.5/1',
    ]);
    // The worked Plains tile, worth twice an unworked one.
    expect(jobsAt(despotism, 2, 0)).to.deep.equal([
      'irrigation:3/2',
      'road:1/1',
    ]);
    // Hills: a mine adds two shields under Despotism, three under Monarchy, and takes three times as long as a road
    //  would on flat land, twice over for the hills.
    expect(jobsAt(despotism, 3, 1)).to.deep.equal([
      'irrigation:1.5/4',
      'mine:2.25/6',
    ]);
    expect(jobsAt(monarchy, 3, 1)).to.deep.equal([
      'irrigation:1/4',
      'mine:3.375/6',
    ]);

    // An improvement already there isn't offered again, and a mine replaces irrigation, losing its food.
    despotism.game.tileImprovements.register(
      new Irrigation(despotism.world.get(3, 1)),
      new Road(despotism.world.get(3, 0))
    );

    expect(jobsAt(despotism, 3, 1)).to.deep.equal(['mine:0.75/6']);
    expect(jobsAt(despotism, 3, 0)).to.deep.equal(['irrigation:1.5/2']);
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

    // Irrigating the worked Plains at 2,0 would be worth most, but there's no water beside it. Next is irrigating the
    //  Plains at 3,0, beside the sea, 2 tiles away (the map wraps): 1.5 over 2 + 2 turns.
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

    // Through the city: the sea is in the way the other way round.
    expect(tiles).to.deep.equal(['1,1', '2,1', '3,0']);
    expect(improvements(setup, plains)).to.deep.equal([]);

    // It starts the turn after it arrived with no moves left.
    await setup.takeTurns(1);

    expect(settlers.busy()?.constructor.name).to.equal('BuildingIrrigation');

    // The work done, as the engine would at the start of a turn two turns on. (A `Game` other than the default one
    //  doesn't finish delayed actions.)
    setup.game.tileImprovements.register(new Irrigation(plains));
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
        new TerrainWork(setup.dependencies, civ1Knowledge, {
          ...civ1TerrainPolicy,
          workersWanted: () => workersWanted,
        }).attempt(new ActiveUnit(setup.player, settlers));

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
        civ1TerrainPolicy
      ).attempt(new ActiveUnit(setup.player, settlers))
    ).true;
    expect(terrainJobs(memory).has(settlers)).true;
  });
});
