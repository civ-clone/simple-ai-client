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

// The continents found so far this turn, by each of their tiles.
let continents: { turn: number; byTile: WeakMap<Tile, Set<Tile>> } | null =
  null;

// `landReachableFrom` a land tile, found once a turn for each continent: every city the player has asks for its own as
//  it chooses what to build, once or twice, and a player's cities mostly share a few continents
//  (civ-clone/web-renderer#316). No rule turns land into sea or sea into land, but a continent is only kept for the
//  turn all the same. Shared by every tile of the continent, so not for changing.
export const continentOf = (turn: number, start: Tile): Set<Tile> => {
  // From the sea, the land all around it, which isn't one continent.
  if (!start.isLand()) {
    return landReachableFrom(start);
  }

  if (continents === null || continents.turn !== turn) {
    continents = { turn, byTile: new WeakMap() };
  }

  const known = continents.byTile.get(start);

  if (known) {
    return known;
  }

  const continent = landReachableFrom(start),
    { byTile } = continents;

  continent.forEach((tile: Tile): void => {
    byTile.set(tile, continent);
  });

  return continent;
};

// How many of `landTilesToExplore` a land unit built in `city` could walk to: those on `reachable`, the land it can
//  walk to, if that's known already.
export const reachableLandToExplore = (
  city: City,
  landTilesToExplore: Tile[],
  reachable?: Set<Tile>
): number => {
  if (landTilesToExplore.length === 0) {
    return 0;
  }

  const land = reachable ?? landReachableFrom(city.tile());

  return landTilesToExplore.filter((tile: Tile): boolean => land.has(tile))
    .length;
};

export default reachableLandToExplore;
