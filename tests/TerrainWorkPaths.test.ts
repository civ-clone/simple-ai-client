import terrainWork, {
  TerrainPolicy,
  UNPATHABLE_TURNS,
  terrainJobs,
} from '@civ-clone/base-strategy-terrain-work/lib/Unit/terrainWork';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Path from '@civ-clone/core-world-path/Path';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import Tile from '@civ-clone/core-world/Tile';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { expect } from 'chai';
import { instance as memoryRegistryInstance } from '@civ-clone/base-strategy-ai/lib/MemoryRegistry';
import { travelToPathEnd } from '../lib/Unit/moveUnit';
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
      // The tiles with a job on them: both, unless a test says otherwise.
      offered = new Set<Tile>([best, next]),
      // A road at 3,0 is worth most, then one at 0,2: nothing else is worth doing.
      policy: TerrainPolicy = {
        jobs: (dependencies, player, tile) =>
          !offered.has(tile)
            ? []
            : tile === best
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
          policy,
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
        );

    return { ...setup, best, memory, next, offered, settlers, work };
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

  it('should remember each tile it found no path to for its own ten turns', async (): Promise<void> => {
    const { best, dependencies, next, offered, work } = await setUp(),
      // Advances the game `turns` turns, then has the worker work, and returns the tiles it searched for a path to.
      after = async (turns: number): Promise<Tile[]> => {
        for (let i = 0; i < turns; i++) {
          dependencies.turn.increment();
        }

        return withoutPathsTo(
          new Set([best, next]),
          async (): Promise<void> => {
            await work();
          }
        );
      },
      count = (asked: Tile[], tile: Tile): number =>
        asked.filter((other: Tile): boolean => other === tile).length;

    // The first turn there's only the job at 3,0, and no path to it.
    offered.delete(next);

    const first = await after(0);

    expect(count(first, best)).to.equal(1);
    expect(first.length).to.equal(1);

    // The tenth turn there's the job at 0,2 as well, and no path to it either.
    offered.add(next);

    const tenth = await after(UNPATHABLE_TURNS - 1);

    expect(count(tenth, best)).to.equal(0);
    expect(count(tenth, next)).to.equal(1);
    expect(tenth.length).to.equal(1);

    // The next turn it has forgotten 3,0, but still remembers 0,2.
    const eleventh = await after(1);

    expect(count(eleventh, best)).to.equal(1);
    expect(count(eleventh, next)).to.equal(0);
    expect(eleventh.length).to.equal(1);

    // Ten turns after it found no path to 0,2, it has forgotten that too, but remembers 3,0 again.
    const twentieth = await after(UNPATHABLE_TURNS - 1);

    expect(count(twentieth, best)).to.equal(0);
    expect(count(twentieth, next)).to.equal(1);
    expect(twentieth.length).to.equal(1);
  });
});
