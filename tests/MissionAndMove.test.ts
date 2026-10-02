import unitGame from './lib/unitGame';
import { Horseman } from '@civ-clone/civ1-unit/Units';
import { Monarchy } from '@civ-clone/civ1-government/Governments';
import Path from '@civ-clone/core-world-path/Path';
import Tile from '@civ-clone/core-world/Tile';
import { expect } from 'chai';

describe('MissionAndMove', (): void => {
  it('should give a unit whose path ends with moves to spare its next mission in the same turn', async (): Promise<void> => {
    // Grassland, known as far as x 8: the nearest edge to explore is at x 8, out of sight of anywhere near x 5. (The map
    //  wraps, so x 0 is an edge too, but further away.)
    //   0123456789AB
    // 0 GGGGGGGGG???
    // 1 GGGGGGGGG???
    // 2 GGGGGGGGG???
    const { addUnit, dependencies, player, takeTurns, world } = await unitGame(
        '36G',
        3,
        12,
        Monarchy,
        (tile: Tile): boolean => tile.x() <= 8
      ),
      // Two moves: one along its path, one to spare.
      horseman = addUnit(Horseman, 4, 1),
      path = new Path();

    path.push(world.get(5, 1));
    dependencies.memoryRegistry
      .memoryFor(player)
      .unitPathData.set(horseman, path);

    await takeTurns(1);

    // On towards its next mission, the edge at x 8, with the move it had left.
    expect(horseman.tile().x()).to.equal(6);
  });
});
