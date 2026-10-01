// Generic: the ship a city should build to explore the sea with, if any (civ-clone/web-renderer#208). A player with
//  more than one city keeps one ship at a time for this, built in a city that has its defenders and is on a sea, not a
//  lake, that leads to water it hasn't explored. Transports and their escorts are another matter.
import { wantsUnit } from './defence';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import Buildable from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import buildTime, { finishesWithin } from './buildTime';
import Knowledge from '../Knowledge';
import { Naval } from '@civ-clone/library-unit/Types';
import Player from '@civ-clone/core-player/Player';
import { TargetBoard } from '../Memory';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

const isShip = (item: object): boolean =>
  Object.prototype.isPrototypeOf.call(Naval, item);

// The water tiles joined to `city`'s by water, found one at a time: from the map itself, or, with `known`, only those
//  tiles. Stops as soon as `enough` returns `true`, or after `limit` tiles.
const searchWater = (
  city: City,
  enough: (tile: Tile, found: number) => boolean,
  known: (tile: Tile) => boolean = (): boolean => true,
  limit: number = 1000
): boolean => {
  const found = new Set<Tile>(),
    queue: Tile[] = [];

  const visit = (tile: Tile): void => {
    if (tile.isWater() && !found.has(tile) && known(tile)) {
      found.add(tile);
      queue.push(tile);
    }
  };

  city.tile().getNeighbours().forEach(visit);

  for (let i = 0; i < queue.length && i < limit; i++) {
    if (enough(queue[i], i + 1)) {
      return true;
    }

    queue[i].getNeighbours().forEach(visit);
  }

  return false;
};

// Whether `city` is on the sea rather than a lake: on a body of water of at least `seaSize` tiles. It's judged from the
//  map, as Civ1's own computer players know the extent of each ocean, and a lake the player has only partly seen
//  looks no different from a sea.
export const isOnSea = (city: City, seaSize: number = 20): boolean =>
  searchWater(city, (tile: Tile, found: number): boolean => found >= seaSize);

// Whether the water beside `city`, as far as the player knows it, reaches a tile on the edge of what it has explored.
export const reachesSeaToExplore = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City
): boolean => {
  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player),
    toExplore = new Set<Tile>(targets.seaTilesToExplore);

  return (
    toExplore.size > 0 &&
    searchWater(
      city,
      (tile: Tile): boolean => toExplore.has(tile),
      (tile: Tile): boolean => playerWorld.includes(tile)
    )
  );
};

// How many turns, at its net shields, a city spends on a ship to explore with (civ-clone/web-renderer#212).
export const explorerShipTurns = 20;

// The cheapest ship `city` can build, if the player has another city, no ship and none on order, the city has its
//  defenders, it's on a sea it can explore, and it can finish the ship within `turns`. Otherwise `null`. A player's
//  only city has better things to build.
export const explorerShipFor = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  knowledge: Knowledge,
  turns: number = explorerShipTurns
): typeof Buildable | null => {
  const [ship] = dependencies.cityBuildRegistry
    .getByCity(city)
    .available()
    .filter((buildItem: BuildItem): boolean => isShip(buildItem.item()))
    .sort(
      (a: BuildItem, b: BuildItem): number =>
        a.cost().value() - b.cost().value()
    );

  if (
    !ship ||
    dependencies.cityRegistry.getByPlayer(player).length < 2 ||
    dependencies.unitRegistry
      .getByPlayer(player)
      .some((unit: Unit): boolean => unit instanceof Naval) ||
    dependencies.cityRegistry
      .getByPlayer(player)
      .some((other: City): boolean => {
        const building = dependencies.cityBuildRegistry
          .getByCity(other)
          .building();

        return building !== null && isShip(building.item());
      }) ||
    wantsUnit(dependencies, knowledge, city) ||
    !finishesWithin(buildTime(dependencies, city)(ship), turns) ||
    !isOnSea(city) ||
    !reachesSeaToExplore(dependencies, player, targets, city)
  ) {
    return null;
  }

  return ship.item() as unknown as typeof Buildable;
};

export default explorerShipFor;
