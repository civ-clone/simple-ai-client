import terrainWork, {
  TerrainPolicy,
  terrainJobs,
} from '../lib/Unit/terrainWork';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Path from '@civ-clone/core-world-path/Path';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import Tile from '@civ-clone/core-world/Tile';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { expect } from 'chai';
import { instance as memoryRegistryInstance } from '../lib/MemoryRegistry';
import unitGame from './lib/unitGame';

//   01234
// 0 GGPPO
// 1 GGPHO
// 2 GGGGO
const MAP = '2G2PO2GPHO4GO';

// Runs `test` with `Path.for` finding no path to any of `unpathable`, and returns the tiles it was asked for.
const withoutPathsTo = async (
  unpathable: Set<Tile>,
  test: () => Promise<void>
): Promise<Tile[]> => {
  const original = Path.for,
    asked: Tile[] = [];

  (Path as unknown as { for: typeof Path.for }).for = (...args) => {
    asked.push(args[2]);

    return unpathable.has(args[2]) ? null : original.apply(Path, args);
  };

  try {
    await test();
  } finally {
    (Path as unknown as { for: typeof Path.for }).for = original;
  }

  return asked;
};

describe('TerrainWork paths', (): void => {
  const setUp = async () => {
    const setup = await unitGame(MAP, 3, 5, Despotism),
      city = setup.addCity(1, 1, 1),
      settlers = setup.addUnit(Settlers, 0, 0, city),
      best = setup.world.get(3, 0),
      next = setup.world.get(0, 2),
      // A road at 3,0 is worth most, then one at 0,2: nothing else is worth doing.
      policy: TerrainPolicy = {
        jobs: (dependencies, player, tile) =>
          tile === best
            ? [{ improvement: 'road', value: 10, turns: 1 }]
            : tile === next
            ? [{ improvement: 'road', value: 5, turns: 1 }]
            : [],
        workersWanted: () => 0,
      },
      memory = memoryRegistryInstance.memoryFor(setup.player),
      work = (): Promise<boolean> =>
        terrainWork(
          setup.dependencies,
          setup.player,
          memory,
          civ1Knowledge,
          policy,
          settlers,
          {}
        );

    return { ...setup, best, memory, next, settlers, work };
  };

  it('should take the next best job when there is no path to the best', async (): Promise<void> => {
    const { best, memory, next, settlers, work } = await setUp();

    let worked = false;

    await withoutPathsTo(new Set([best]), async (): Promise<void> => {
      worked = await work();
    });

    expect(worked).true;
    expect(terrainJobs(memory).get(settlers)?.tile === next).true;
  });

  it('should give up when there is no path to any job, and not search for the same ones again next turn', async (): Promise<void> => {
    const { best, dependencies, memory, next, settlers, work } = await setUp();

    let first = true,
      second = true;

    const asked = await withoutPathsTo(
      new Set([best, next]),
      async (): Promise<void> => {
        first = await work();
        dependencies.turn.increment();
        second = await work();
      }
    );

    expect(first).false;
    expect(second).false;
    expect(terrainJobs(memory).has(settlers)).false;
    // Each once, the first turn, and neither the second.
    expect(
      asked.filter((tile: Tile): boolean => tile === best).length
    ).to.equal(1);
    expect(
      asked.filter((tile: Tile): boolean => tile === next).length
    ).to.equal(1);
    expect(asked.length).to.equal(2);
  });
});
