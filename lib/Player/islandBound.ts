// Generic: whether a player is bound to the land it has, with no room left there for another city and no way to more
//  by land (civ-clone/web-renderer#632). England and Japan on the Earth map start on islands with room for one city,
//  and until now sat in it all game: a player with one city never built a ship to explore with, so it never saw other
//  land, and never had a site overseas to send Settlers to. While a player is bound, it researches its way to a
//  transport (`lib/Science/transportResearch`) and builds a ship to explore with from its only city
//  (`lib/City/explorerShip`); once it can see sites overseas, its Settlers go to them by sea as anyone's do
//  (`lib/Unit/overseas`). A landmass shared with rivals counts the same once it's full (Dom, on #632).
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import { continentOf } from '../City/explorers';

// Whether the player has explored `landmass`: it knows every tile of it, or the survey has no land tile left to explore
//  on it. The survey counts a coastal tile beside unseen sea as land to explore, so a small island the player has seen
//  all of would never be explored by that alone.
const explored = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  landmass: Set<Tile>
): boolean => {
  if (
    !memory.targets.landTilesToExplore.some((tile: Tile): boolean =>
      landmass.has(tile)
    )
  ) {
    return true;
  }

  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player);

  return [...landmass].every((tile: Tile): boolean =>
    playerWorld.includes(tile)
  );
};

// Worked out once for each survey of the player's: every city asks as it chooses what to build.
const known = new WeakMap<
  Memory,
  { turn: number; surveyed: number; bound: boolean }
>();

// Whether `player` has cities, every one of them on a landmass it has explored with no site for a city left on it, by
//  the survey's board. False before it has a city or has surveyed, and false again as soon as it has a city on land
//  with room, so its usual priorities come back by themselves.
export const islandBound = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory
): boolean => {
  const turn = dependencies.turn.value(),
    surveyed = memory.surveyedTurn,
    cached = known.get(memory);

  if (surveyed === null) {
    return false;
  }

  if (cached && cached.turn === turn && cached.surveyed === surveyed) {
    return cached.bound;
  }

  const cities = dependencies.cityRegistry.getByPlayer(player),
    landmasses = new Set<Set<Tile>>(
      cities.map((city: City): Set<Tile> => continentOf(turn, city.tile()))
    ),
    onLandmasses = (tile: Tile): boolean =>
      [...landmasses].some((landmass: Set<Tile>): boolean =>
        landmass.has(tile)
      ),
    bound =
      cities.length > 0 &&
      !memory.targets.goodSitesForCities.some(onLandmasses) &&
      [...landmasses].every((landmass: Set<Tile>): boolean =>
        explored(dependencies, player, memory, landmass)
      );

  known.set(memory, { turn, surveyed, bound });

  return bound;
};

export default islandBound;
