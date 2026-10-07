import unitGame from './lib/unitGame';
import { Horseman } from '@civ-clone/civ1-unit/Units';
import { Monarchy } from '@civ-clone/civ1-government/Governments';
import Path from '@civ-clone/core-world-path/Path';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
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

  it("should not ask for a unit's actions on a tile it can't step to when its path is blocked", async (): Promise<void> => {
    // Grassland with an ocean tile at x 5 on the middle row, which the path starts with.
    //   0123456789AB
    // 0 GGGGGGGGGGGG
    // 1 GGGGGOGGGGGG
    // 2 GGGGGGGGGGGG
    const { addUnit, dependencies, player, takeTurns, world } = await unitGame(
        '17GO18G',
        3,
        12,
        Monarchy
      ),
      horseman = addUnit(Horseman, 4, 1),
      path = new Path();

    [5, 6, 7, 8, 9].forEach((x) => path.push(world.get(x, 1)));
    dependencies.memoryRegistry
      .memoryFor(player)
      .unitPathData.set(horseman, path);

    // Each distant tile asked about costs a path search, to see whether `GoTo` is on offer
    //  (civ-clone/web-renderer#306).
    const asked: string[] = [],
      actions = horseman.actions.bind(horseman);

    horseman.actions = ((to?: any, from?: Tile): any => {
      const target = to instanceof Tile ? to : null;

      if (
        target &&
        target !== horseman.tile() &&
        !target.isNeighbourOf(horseman.tile())
      ) {
        asked.push(
          `${target.x()},${target.y()} from ${horseman.tile().x()},${horseman
            .tile()
            .y()}`
        );
      }

      return actions(to, from);
    }) as Unit['actions'];

    await takeTurns(1);

    expect(asked).to.deep.equal([]);
  });
});
