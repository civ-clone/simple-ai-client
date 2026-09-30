// Generic: the ship a city should build to explore the sea with, if any (civ-clone/web-renderer#208). A player with
//  more than one city keeps one ship at a time for this, built in a city that has its defenders and is on water leading
//  to sea it hasn't explored. Transports and their escorts are another matter.
import { defendersIn, defendersWanted } from './defence';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import Buildable from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import { Naval } from '@civ-clone/library-unit/Types';
import Player from '@civ-clone/core-player/Player';
import { TargetBoard } from '../Memory';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

const isShip = (item: object): boolean =>
  Object.prototype.isPrototypeOf.call(Naval, item);

// Whether the water beside `city`, as far as the player knows it, reaches a tile on the edge of what it has explored.
//  Gives up after `limit` tiles, as a lake would long before.
export const reachesSeaToExplore = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City,
  limit: number = 1000
): boolean => {
  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player),
    toExplore = new Set<Tile>(targets.seaTilesToExplore),
    seen = new Set<Tile>(),
    queue: Tile[] = city
      .tile()
      .getNeighbours()
      .filter((tile: Tile): boolean => tile.isWater());

  while (queue.length > 0 && seen.size < limit) {
    const tile = queue.shift()!;

    if (seen.has(tile) || !playerWorld.includes(tile)) {
      continue;
    }

    if (toExplore.has(tile)) {
      return true;
    }

    seen.add(tile);

    queue.push(
      ...tile
        .getNeighbours()
        .filter(
          (neighbour: Tile): boolean =>
            neighbour.isWater() && !seen.has(neighbour)
        )
    );
  }

  return false;
};

// The cheapest ship `city` can build, if the player has another city, no ship and none on order, the city has its
//  defenders, and it can reach sea to explore. Otherwise `null`. A player's only city has better things to build.
export const explorerShipFor = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  city: City
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
    defendersIn(dependencies, city).length <
      defendersWanted(dependencies, city) ||
    !reachesSeaToExplore(dependencies, player, targets, city)
  ) {
    return null;
  }

  return ship.item() as unknown as typeof Buildable;
};

export default explorerShipFor;
