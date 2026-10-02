import unitGame, { UnitGame, at, paces } from './lib/unitGame';
import { ActiveUnit } from '@civ-clone/civ1-unit/PlayerActions';
import City from '@civ-clone/core-city/City';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Player from '@civ-clone/core-player/Player';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import { Road } from '@civ-clone/civ1-world/TileImprovements';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import TerrainWork from '../Strategies/Unit/TerrainWork';
import Tile from '@civ-clone/core-world/Tile';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import WorkerTurn from '../Strategies/Unit/WorkerTurn';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { civ1TerrainPolicy } from '../lib/Civ1/terrain';
import { couldJoin } from '../lib/Unit/idleWorker';
import { expect } from 'chai';
import { instance as memoryRegistryInstance } from '../lib/MemoryRegistry';
import { terrainJobs } from '../lib/Unit/terrainWork';

const sizeOf = ({ game }: UnitGame, city: City): number =>
  game.cityGrowth.getByCity(city).size();

// Roads on every tile `city` could work: with them, and on Forest, there's no terrain job for Settlers there, by Civ1's
//  policy or by `settlerWork`'s own checks.
const roadEverything = ({ game }: UnitGame, city: City): void =>
  city
    .tiles()
    .entries()
    .forEach((tile: Tile): void =>
      game.tileImprovements.register(new Road(tile))
    );

//   0123456789AB
// 0 GGGGFFFFFFFG
// 1 GGGGFFFFFFFG
// 2 GGGGFFFFFFFG
// A city at 1,1 has Grassland to feed its Settlers. Forest is no place for a city, nor worth improving in Civ1, and
//  with no water the Grassland can't be irrigated.
const MAP = '4G7FG4G7FG4G7FG';

describe('idle Settlers', (): void => {
  it('should have Settlers with no city site, terrain job or step worth taking join the city they are in', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 12, Despotism),
      city = setup.addCity(1, 1, 3),
      settlers = setup.addUnit(Settlers, 1, 1, city);

    roadEverything(setup, city);
    await setup.takeTurns(1);

    expect(settlers.destroyed()).true;
    expect(sizeOf(setup, city)).to.equal(4);
  });

  it('should send Settlers with nothing to do to the nearest city, without pacing, and have them join it', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 12, Despotism),
      city = setup.addCity(1, 1, 1),
      // Out of the city's reach: six tiles either way round.
      settlers = setup.addUnit(Settlers, 7, 1, city),
      tiles: string[] = [at(settlers)];

    roadEverything(setup, city);
    await setup.takeTurns(8, () => {
      if (!settlers.destroyed()) {
        tiles.push(at(settlers));
      }
    });

    expect(paces(tiles)).false;
    // Six tiles by the shortest way round, the last few by road, joining as it arrives.
    expect(tiles.length).to.be.below(7);
    expect(settlers.destroyed()).true;
    expect(sizeOf(setup, city)).to.equal(2);
  });

  it('should take a terrain job rather than join a city', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 12, Despotism),
      // No roads: the Grassland is worth a road in Civ1.
      city = setup.addCity(1, 1, 3),
      settlers = setup.addUnit(Settlers, 1, 1, city);

    await setup.takeTurns(1);

    expect(settlers.destroyed()).false;
    expect(
      terrainJobs(memoryRegistryInstance.memoryFor(setup.player)).has(settlers)
    ).true;
    expect(sizeOf(setup, city)).to.equal(3);
  });

  it('should head for a city site rather than join a city', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 12, Despotism),
      city = setup.addCity(1, 1, 3),
      memory = memoryRegistryInstance.memoryFor(setup.player),
      settlers = setup.addUnit(Settlers, 1, 1, city),
      site = setup.world.get(6, 1),
      action = new ActiveUnit(setup.player, settlers);

    roadEverything(setup, city);

    // As the survey would offer it at the start of the turn.
    setup.game.rules.process(TurnStart, setup.player);
    memory.targets.goodSitesForCities.push(site);

    // In the order the strategies are registered: no terrain job is wanted while there's a site within reach.
    expect(
      await new TerrainWork(
        setup.dependencies,
        civ1Knowledge,
        civ1TerrainPolicy
      ).attempt(action)
    ).false;
    expect(
      await new WorkerTurn(setup.dependencies, civ1Knowledge).attempt(action)
    ).true;

    expect(settlers.destroyed()).false;
    expect(memory.unitTargetData.get(settlers)).to.equal(site);
    expect(sizeOf(setup, city)).to.equal(3);
  });
});

describe('where idle Settlers go', (): void => {
  //   0123456789ABCDEF
  // 0 FFFFFFFFFFFFFFFF
  // 1 FFFFFFFFFFFFFFFF
  // 2 FFFFFFFFFFFFFFFF
  // Roads everywhere: no terrain job, nothing worth a step, and three tiles a turn. A city at 5,1, `near`, three tiles
  //  from Settlers at 8,1, and one at 13,1, `far`, five tiles away.
  const setUp = async (nearSize: number, farSize: number) => {
    const setup = await unitGame('48F', 3, 16, Despotism),
      near = setup.addCity(5, 1, nearSize),
      far = setup.addCity(13, 1, farSize);

    setup.world
      .entries()
      .forEach((tile: Tile): void =>
        setup.game.tileImprovements.register(new Road(tile))
      );

    return { ...setup, near, far };
  };

  // One turn of new Settlers' at `x`, which have their moves. Not a whole turn of the player's: a city on Forest
  //  starves at the start of one, and a city of size 10 would shrink to 9, which Settlers can join.
  const turn = async (setup: UnitGame, x: number) =>
    turnOf(setup, setup.addUnit(Settlers, x, 1));

  // Another turn of `settlers`', with their moves back, as at the start of a turn.
  const turnOf = async (setup: UnitGame, settlers: Settlers) => {
    settlers.moves().set(settlers.movement().value());
    settlers.setActive(true);

    await new WorkerTurn(setup.dependencies, civ1Knowledge).attempt(
      new ActiveUnit(setup.player, settlers)
    );

    return settlers;
  };

  it('should go to the nearest city they could join, past a nearer one they could not, and join it', async (): Promise<void> => {
    const setup = await setUp(10, 1),
      settlers = await turn(setup, 8);

    expect(settlers.destroyed()).false;
    expect(settlers.tile().distanceFrom(setup.far.tile())).to.be.below(5);

    await turnOf(setup, settlers);

    expect(settlers.destroyed()).true;
    expect(sizeOf(setup, setup.far)).to.equal(2);
    expect(sizeOf(setup, setup.near)).to.equal(10);
  });

  it('should join a city they reach with moves to spare on the same turn', async (): Promise<void> => {
    const setup = await setUp(1, 1),
      // Two tiles from `near`, by road.
      settlers = await turn(setup, 7);

    expect(settlers.destroyed()).true;
    expect(sizeOf(setup, setup.near)).to.equal(2);
  });

  it('should wait in the city they are in with none they could join', async (): Promise<void> => {
    const setup = await setUp(10, 10),
      settlers = await turn(setup, 5);

    expect(settlers.destroyed()).false;
    expect(at(settlers)).to.equal('5,1');
    expect(settlers.moves().value()).to.equal(0);
    expect(sizeOf(setup, setup.near)).to.equal(10);
  });

  it('should go to the nearest city of any with none they could join', async (): Promise<void> => {
    const setup = await setUp(10, 10),
      settlers = await turn(setup, 8);

    expect(settlers.destroyed()).false;
    expect(at(settlers)).to.equal('5,1');
  });

  it("should not join another player's city", async (): Promise<void> => {
    const setup = await setUp(10, 1),
      other = new Player(setup.game.rules);

    setup.game.playerWorlds.register(new PlayerWorld(other, setup.world));

    const theirs = new City(
      other,
      setup.world.get(10, 1),
      'Theirs',
      setup.game.rules,
      setup.game.workedTiles
    );

    setup.game.cities.register(theirs);

    const settlers = setup.addUnit(Settlers, 9, 1);

    expect(couldJoin(setup.dependencies, settlers, theirs)).false;
    expect(couldJoin(setup.dependencies, settlers, setup.far)).true;
    expect(couldJoin(setup.dependencies, settlers, setup.near)).false;
  });
});
