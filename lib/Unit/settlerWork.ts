// Generic: a worker founds a city, irrigates, mines or builds a road where it stands, or else claims the nearest good
//  city site it can reach and sets off along a path to it. Either way the move executor runs next.
import { ActionLookup } from '@civ-clone/base-strategy-ai/lib/actionLookup';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import reachableTiles from '@civ-clone/base-strategy-ai/lib/Unit/reachable';

// The site the worker should still be heading for, if any. A site is given up when the worker has reached it, when
//  it's no longer a good place for a city (say another city was founded nearby), or when the worker has lost its path
//  and no new one can be found. Giving it up frees it for the survey to offer again.
const siteToKeep = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  tile: Tile,
  target: Tile | undefined
): Tile | undefined => {
  if (!target) {
    return undefined;
  }

  if (
    target !== tile &&
    knowledge.shouldBuildCity(dependencies, player, target)
  ) {
    if (memory.unitPathData.has(unit)) {
      return target;
    }

    const path = Path.for(unit, tile, target, dependencies.pathFinderRegistry);

    if (path) {
      memory.unitPathData.set(unit, path);

      return target;
    }
  }

  memory.unitTargetData.delete(unit);

  if (memory.unitPathData.get(unit)?.end() === target) {
    memory.unitPathData.delete(unit);
  }

  return undefined;
};

// The nearest site on the board that the worker can reach: claimed as its target, with the path to it, and taken off
//  the board.
const claimSite = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit,
  tile: Tile
): void => {
  const sites = memory.targets.goodSitesForCities.sort(
    (a: Tile, b: Tile): number => a.distanceFrom(tile) - b.distanceFrom(tile)
  );

  // Only worked out if there's a site to check.
  let reachable: Set<Tile> | null | undefined;

  for (const site of sites) {
    if (site === tile) {
      continue;
    }

    if (reachable === undefined) {
      reachable = reachableTiles(unit);
    }

    // On another continent: a search would cover the whole of this one and find nothing. Once ships have shown the
    //  players other continents, most of the board can be sites like that, and searching for each of them, for each
    //  worker with no site, every turn, was most of the game's time.
    if (reachable !== null && !reachable.has(site)) {
      continue;
    }

    const path = Path.for(unit, tile, site, dependencies.pathFinderRegistry);

    if (path) {
      sites.splice(sites.indexOf(site), 1);
      memory.unitTargetData.set(unit, site);
      memory.unitPathData.set(unit, path);

      return;
    }
  }
};

export const settlerWork = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  tile: Tile,
  target: Tile | undefined,
  { buildIrrigation, buildMine, buildRoad, foundCity }: ActionLookup
): void => {
  const site = siteToKeep(
    dependencies,
    player,
    memory,
    knowledge,
    unit,
    tile,
    target
  );

  if (foundCity && knowledge.shouldBuildCity(dependencies, player, tile)) {
    unit.action(foundCity);
  } else if (
    buildIrrigation &&
    knowledge.shouldIrrigate(dependencies, player, tile)
  ) {
    unit.action(buildIrrigation);
  } else if (buildMine && knowledge.shouldMine(dependencies, player, tile)) {
    unit.action(buildMine);
  } else if (buildRoad && knowledge.shouldRoad(dependencies, player, tile)) {
    unit.action(buildRoad);
  } else if (!site && memory.targets.goodSitesForCities.length) {
    claimSite(dependencies, memory, unit, tile);
  }
};

export default settlerWork;
