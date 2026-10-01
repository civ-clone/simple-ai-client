// Generic: the tiles a unit could reach from where it stands, moving the way `simple-world-path`'s `BasePathFinder`
//  does: a land unit by land, a ship by sea. `null` for any other unit, which could go anywhere.
import { Land, Naval } from '@civ-clone/library-unit/Types';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// Whether `unit` can move onto a tile, by its terrain alone: land for a land unit, water for a ship. `null` for any
//  other unit, which can move onto any tile.
export const terrainFor = (unit: Unit): ((tile: Tile) => boolean) | null =>
  unit instanceof Land
    ? (tile: Tile): boolean => tile.isLand()
    : unit instanceof Naval
    ? (tile: Tile): boolean => tile.isWater()
    : null;

// One pass over the unit's continent or sea. Checking targets against it saves a path search over the whole of it for
//  each target the unit can't reach, such as the coast of another continent that a ship has seen.
export const reachableTiles = (unit: Unit): Set<Tile> | null => {
  const canEnter = terrainFor(unit);

  if (canEnter === null) {
    return null;
  }

  const start = unit.tile(),
    reached = new Set<Tile>([start]),
    queue: Tile[] = [start];

  for (let i = 0; i < queue.length; i++) {
    queue[i].getNeighbours().forEach((tile: Tile): void => {
      if (!reached.has(tile) && canEnter(tile)) {
        reached.add(tile);
        queue.push(tile);
      }
    });
  }

  return reached;
};

export default reachableTiles;
