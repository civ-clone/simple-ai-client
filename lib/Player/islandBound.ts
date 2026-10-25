// Generic: whether a player is bound to the land it has, with no room left there for another city and no way to more
//  by land (civ-clone/web-renderer#632). England and Japan on the Earth map start on islands with room for one city,
//  and until now sat in it all game: a player with one city never built a ship to explore with, so it never saw other
//  land, and never had a site overseas to send Settlers to. While a player is bound, it researches its way to a
//  transport (`lib/Science/transportResearch`) and builds a ship to explore with from its only city
//  (`lib/City/explorerShip`); once it can see sites overseas, its Settlers go to them by sea as anyone's do
//  (`lib/Unit/overseas`). A landmass shared with rivals counts the same once it's full (Dom, on #632).
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { continentOf } from '../City/explorers';
import { overseasStateFor } from '../Unit/overseas';

// Where the player's units are going: each one's target and the end of its path, and each passenger's target. The
//  survey leaves these off its board while they're claimed, so a site its Settlers are walking to, or the last land
//  its explorer is heading for, would otherwise look gone.
const claimed = (memory: Memory): Tile[] => [
  ...memory.unitTargetData.values(),
  ...[...memory.unitPathData.values()]
    .map((path): Tile | undefined => path.end())
    .filter((tile): tile is Tile => tile !== undefined),
  ...[...overseasStateFor(memory).passengers.entries()]
    .filter(([unit]: [Unit, unknown]): boolean => !unit.destroyed())
    .map(([, passenger]): Tile => passenger.target),
];

// Whether `tile`, a land tile the player knows, has a neighbour it doesn't: land still to explore.
const unexplored = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): boolean => {
  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);

  return tile
    .getNeighbours()
    .some((neighbour: Tile): boolean => !playerWorld.includes(neighbour));
};

// Whether the player has explored `landmass`: it knows every tile of it, or there's no land tile left to explore on it,
//  on the survey's board or claimed by one of its units. The survey counts a coastal tile beside unseen sea as land to
//  explore, so a small island the player has seen all of would never be explored by that alone.
const explored = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  landmass: Set<Tile>,
  heading: Tile[]
): boolean => {
  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);

  if (
    [...landmass].every((tile: Tile): boolean => playerWorld.includes(tile))
  ) {
    return true;
  }

  return (
    !memory.targets.landTilesToExplore.some((tile: Tile): boolean =>
      landmass.has(tile)
    ) &&
    !heading.some(
      (tile: Tile): boolean =>
        landmass.has(tile) && unexplored(dependencies, player, tile)
    )
  );
};

// Whether `player` has cities, every one of them on a landmass it has explored with no site for a city left on it: none
//  on the survey's board, and none its units are heading for. False before it has a city or has surveyed, and false
//  again as soon as it has a city on land with room, so its usual priorities come back by themselves. Worked out afresh
//  each time: the board, its cities and what it knows all change during a turn.
export const islandBound = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  player: Player,
  memory: Memory
): boolean => {
  if (memory.surveyedTurn === null) {
    return false;
  }

  const turn = dependencies.turn.value(),
    cities = dependencies.cityRegistry.getByPlayer(player);

  if (cities.length === 0) {
    return false;
  }

  const landmasses = [
      ...new Set<Set<Tile>>(
        cities.map((city: City): Set<Tile> => continentOf(turn, city.tile()))
      ),
    ],
    onLandmasses = (tile: Tile): boolean =>
      landmasses.some((landmass: Set<Tile>): boolean => landmass.has(tile));

  if (memory.targets.goodSitesForCities.some(onLandmasses)) {
    return false;
  }

  const heading = claimed(memory);

  if (
    heading.some(
      (tile: Tile): boolean =>
        onLandmasses(tile) &&
        dependencies.cityRegistry.getByTile(tile) === null &&
        knowledge.shouldBuildCity(dependencies, player, tile)
    )
  ) {
    return false;
  }

  return landmasses.every((landmass: Set<Tile>): boolean =>
    explored(dependencies, player, memory, landmass, heading)
  );
};

export default islandBound;
