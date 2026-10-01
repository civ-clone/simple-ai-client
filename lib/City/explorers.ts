// Generic: whether a land unit built in a city would have anything to explore (civ-clone/web-renderer#229). The
//  survey's `landTilesToExplore` lists every known land tile with an unknown neighbour, the coast of other continents
//  included, so a city counting on it alone builds explorers for land none of them can reach.
import City from '@civ-clone/core-city/City';
import Tile from '@civ-clone/core-world/Tile';

// The land tiles reachable by land from `start`, in one pass over its continent, as `Unit/reachable` finds them for a
//  land unit.
export const landReachableFrom = (start: Tile): Set<Tile> => {
  const reached = new Set<Tile>([start]),
    queue: Tile[] = [start];

  for (let i = 0; i < queue.length; i++) {
    queue[i].getNeighbours().forEach((tile: Tile): void => {
      if (!reached.has(tile) && tile.isLand()) {
        reached.add(tile);
        queue.push(tile);
      }
    });
  }

  return reached;
};

// How many of `landTilesToExplore` a land unit built in `city` could walk to.
export const reachableLandToExplore = (
  city: City,
  landTilesToExplore: Tile[]
): number => {
  if (landTilesToExplore.length === 0) {
    return 0;
  }

  const reachable = landReachableFrom(city.tile());

  return landTilesToExplore.filter((tile: Tile): boolean => reachable.has(tile))
    .length;
};

export default reachableLandToExplore;
