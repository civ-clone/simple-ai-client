import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TerrainFeatureRegistry } from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import Tile from '@civ-clone/core-world/Tile';
import World from '@civ-clone/core-world/World';
import { expect } from 'chai';
import movesBetween from '../lib/movesBetween';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';

// `movesBetween` as it was before it asked the world's topology: the oracle the topology's count is checked against.
const previousMovesBetween = (from: Tile, to: Tile): number => {
  const map = from.map(),
    onAxis = (delta: number, size: number): number => {
      const direct = Math.abs(delta);

      return Math.min(direct, Math.abs(size - direct));
    };

  return Math.max(
    onAxis(from.x() - to.x(), map.width()),
    onAxis(from.y() - to.y(), map.height())
  );
};

const oceanWorld = (width: number, height: number): Promise<World> =>
  simpleRLELoader(new RuleRegistry(), new TerrainFeatureRegistry())(
    `${width * height}O`,
    height,
    width
  );

describe('movesBetween', (): void => {
  it('counts every step as 1, diagonals included, the short way round both wraps', async (): Promise<void> => {
    const world = await oceanWorld(80, 50),
      between = (x1: number, y1: number, x2: number, y2: number): number =>
        movesBetween(world.get(x1, y1), world.get(x2, y2));

    expect(between(10, 10, 10, 10)).equal(0);
    expect(between(10, 10, 11, 11)).equal(1);
    expect(between(10, 10, 13, 13)).equal(3);
    expect(between(10, 10, 13, 11)).equal(3);
    // Across the left/right seam.
    expect(between(0, 10, 79, 10)).equal(1);
    expect(between(1, 10, 77, 12)).equal(4);
    // Across the top/bottom seam.
    expect(between(10, 0, 10, 49)).equal(1);
    expect(between(10, 2, 11, 47)).equal(5);
    // Across both.
    expect(between(0, 0, 79, 49)).equal(1);
    expect(between(78, 48, 2, 1)).equal(4);
  });

  // Every pair of tiles on each size, including odd and tiny ones: the topology's count is the old arithmetic's.
  (
    [
      [1, 1],
      [2, 2],
      [3, 5],
      [5, 5],
      [7, 4],
      [12, 9],
      [13, 11],
      [41, 27],
      [80, 50],
    ] as [number, number][]
  ).forEach(([width, height]): void => {
    it(`gives the same count as before for every pair of tiles on a ${width}x${height} world`, async function (): Promise<void> {
      this.timeout(60000);

      const world = await oceanWorld(width, height),
        tiles = world.entries();

      let pairs = 0,
        mismatches = 0,
        wrappedX = 0,
        wrappedY = 0;

      tiles.forEach((from: Tile): void =>
        tiles.forEach((to: Tile): void => {
          pairs++;

          if (movesBetween(from, to) !== previousMovesBetween(from, to)) {
            mismatches++;
          }

          if (Math.abs(from.x() - to.x()) * 2 > width) {
            wrappedX++;
          }

          if (Math.abs(from.y() - to.y()) * 2 > height) {
            wrappedY++;
          }
        })
      );

      expect(pairs).equal((width * height) ** 2);
      expect(mismatches).equal(0);

      // The seams were crossed: some pairs are closer the other way round each axis that is long enough to have one.
      if (width >= 3) {
        expect(wrappedX).greaterThan(0);
      }

      if (height >= 3) {
        expect(wrappedY).greaterThan(0);
      }
    });
  });
});
