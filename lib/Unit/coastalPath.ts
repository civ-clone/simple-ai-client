// Generic: a ship's way along the coast (civ-clone/web-renderer#632). A ruleset can keep a ship near the coast (Civ1's
//  Trireme, by `Knowledge#canReturnAfter`) where the path finder sends it straight across open sea: the move executor
//  refused the first step, dropped the path, and the ship never left, so an island's only ship neither explored nor
//  ferried anyone. Every step of this way ends on a water tile beside land.
import Path from '@civ-clone/core-world-path/Path';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

const isCoastalWater = (tile: Tile): boolean =>
  tile.isWater() && tile.isCoast();

// The shortest way from `unit`'s tile to `to` over coastal water, searching at most `limit` tiles. When `to` is out at
//  sea, the way ends beside it instead, and with no way there, at the coastal water nearest it, so that a ship sent to
//  explore open sea goes as far as it can and sees more on the way. `null` when the ship is as near as it can get.
export const coastalPath = (
  unit: Unit,
  to: Tile,
  limit: number = 2000
): Path | null => {
  const start = unit.tile(),
    reached = (tile: Tile): boolean =>
      tile === to || (!isCoastalWater(to) && tile.isNeighbourOf(to)),
    parents = new Map<Tile, Tile | null>([[start, null]]),
    queue: Tile[] = [start],
    pathTo = (end: Tile): Path => {
      const steps: Tile[] = [],
        path = new Path();

      for (let step = end; step !== start; step = parents.get(step)!) {
        steps.unshift(step);
      }

      steps.forEach((step: Tile): void => {
        path.push(step);
      });

      return path;
    };

  let nearest = start;

  for (let i = 0; i < queue.length && i < limit; i++) {
    const tile = queue[i];

    if (tile !== start && reached(tile)) {
      return pathTo(tile);
    }

    if (tile.distanceFrom(to) < nearest.distanceFrom(to)) {
      nearest = tile;
    }

    tile.getNeighbours().forEach((neighbour: Tile): void => {
      if (!parents.has(neighbour) && isCoastalWater(neighbour)) {
        parents.set(neighbour, tile);
        queue.push(neighbour);
      }
    });
  }

  return nearest === start ? null : pathTo(nearest);
};

export default coastalPath;
