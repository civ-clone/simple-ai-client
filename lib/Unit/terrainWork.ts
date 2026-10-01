// Generic: a worker's terrain job (civ-clone/web-renderer#234): it picks the tile around the player's cities whose
//  improvement is worth most for the time it takes to get there and do it, by the ruleset's `TerrainPolicy`, claims
//  it, walks there, and does it. Then it picks the next. No two of the player's workers claim the same tile, nor a tile
//  some unit of the player's is heading for, such as a city site.
import Memory from '../Memory';
import { ActionLookup, lookupActions } from '../actionLookup';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import moveUnit from './moveUnit';
import { noOrders } from './orders';
import reachableTiles from './reachable';

export type TerrainImprovement = 'irrigation' | 'mine' | 'road';

// What doing `improvement` to a tile would be worth, by the ruleset: `value` each turn once it's done, for the
//  `turns` of a worker's work it takes.
export interface TerrainJobValue {
  improvement: TerrainImprovement;
  value: number;
  turns: number;
}

// The ruleset's part. `Civ1/terrain` has Civ1's.
export interface TerrainPolicy {
  // What each improvement `tile` could still have is worth to `player`, if anything. A tile not worth improving has
  //  none.
  jobs(
    dependencies: Dependencies,
    player: Player,
    tile: Tile
  ): TerrainJobValue[];
  // How many of the player's workers to keep on terrain jobs even while there are city sites for them to settle.
  workersWanted(dependencies: Dependencies, player: Player): number;
}

export interface TerrainJob {
  improvement: TerrainImprovement;
  tile: Tile;
}

const actionFor: { [K in TerrainImprovement]: keyof ActionLookup } = {
  irrigation: 'buildIrrigation',
  mine: 'buildMine',
  road: 'buildRoad',
};

// How many of the best-scored jobs are checked against what the worker could actually do there before giving up.
const JOBS_TRIED = 5;

// Each player's workers' jobs, kept beside its memory.
const jobsByMemory: WeakMap<Memory, Map<Unit, TerrainJob>> = new WeakMap();

// The player's workers' jobs, less those of workers that have since been destroyed.
export const terrainJobs = (memory: Memory): Map<Unit, TerrainJob> => {
  let jobs = jobsByMemory.get(memory);

  if (!jobs) {
    jobs = new Map();

    jobsByMemory.set(memory, jobs);
  }

  [...jobs.keys()]
    .filter((unit: Unit): boolean => unit.destroyed())
    .forEach((unit: Unit): boolean => jobs!.delete(unit));

  return jobs;
};

// Whether `job` is still worth doing: the policy still values that improvement of its tile.
const stillWorthDoing = (
  dependencies: Dependencies,
  player: Player,
  policy: TerrainPolicy,
  job: TerrainJob
): boolean =>
  policy
    .jobs(dependencies, player, job.tile)
    .some(
      ({ improvement, value }: TerrainJobValue): boolean =>
        improvement === job.improvement && value > 0
    );

// The best job for `unit` on the tiles of the player's cities: worth most for the turns it takes to walk there and do
//  it, on a tile it can reach that no other unit of the player's has claimed, and that it could actually do there.
export const chooseTerrainJob = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  policy: TerrainPolicy,
  unit: Unit
): TerrainJob | null => {
  const jobs = terrainJobs(memory),
    reachable = reachableTiles(unit),
    // Where the player's other units are heading, or working.
    claimed = new Set<Tile>([
      ...[...memory.unitTargetData.entries()]
        .filter(([other]): boolean => other !== unit)
        .map(([, tile]): Tile => tile),
      ...[...memory.unitPathData.entries()]
        .filter(([other]): boolean => other !== unit)
        .map(([, path]): Tile => path.end()),
      ...[...jobs.entries()]
        .filter(([other]): boolean => other !== unit)
        .map(([, job]): Tile => job.tile),
    ]),
    tiles = new Set<Tile>(
      dependencies.cityRegistry
        .getByPlayer(player)
        .flatMap((city: City): Tile[] => city.tiles().entries())
    ),
    // `unit.actions` creates `Action`s, so each tile is asked about once at most.
    possible = new Map<Tile, ActionLookup>(),
    actionsAt = (tile: Tile): ActionLookup => {
      if (!possible.has(tile)) {
        possible.set(tile, lookupActions(unit.actions(tile, tile)));
      }

      return possible.get(tile)!;
    };

  const ranked = [...tiles]
    .filter(
      (tile: Tile): boolean =>
        tile.isLand() &&
        dependencies.cityRegistry.getByTile(tile) === null &&
        !claimed.has(tile) &&
        (reachable === null || reachable.has(tile))
    )
    .flatMap((tile: Tile): [TerrainJob, number][] =>
      policy
        .jobs(dependencies, player, tile)
        .filter(({ value }: TerrainJobValue): boolean => value > 0)
        .map(
          ({
            improvement,
            value,
            turns,
          }: TerrainJobValue): [TerrainJob, number] => [
            { improvement, tile },
            value / (turns + tile.distanceFrom(unit.tile())),
          ]
        )
    )
    .sort(([, a], [, b]): number => b - a);

  for (const [job] of ranked.slice(0, JOBS_TRIED)) {
    if (actionsAt(job.tile)[actionFor[job.improvement]]) {
      return job;
    }
  }

  return null;
};

// Starts `job` if `unit` is on its tile and can. Returns whether it did.
const startJob = (
  unit: Unit,
  job: TerrainJob,
  actions: ActionLookup
): boolean => {
  const action = actions[actionFor[job.improvement]];

  if (unit.tile() !== job.tile || !action) {
    return false;
  }

  unit.action(action as Action);

  return true;
};

// Carries on with `unit`'s job, or picks one: walks it towards its job's tile, or does the job there. Returns whether
//  it had a job to get on with. `actions` are what the unit can do where it stood at the start of its turn.
export const terrainWork = async (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  policy: TerrainPolicy,
  unit: Unit,
  actions: ActionLookup
): Promise<boolean> => {
  const jobs = terrainJobs(memory);

  let job = jobs.get(unit);

  if (job && !stillWorthDoing(dependencies, player, policy, job)) {
    jobs.delete(unit);

    job = undefined;
  }

  if (!job) {
    job =
      chooseTerrainJob(dependencies, player, memory, policy, unit) ?? undefined;

    if (!job) {
      return false;
    }

    jobs.set(unit, job);
  }

  if (startJob(unit, job, actions)) {
    return true;
  }

  if (unit.tile() === job.tile) {
    // It can't do the job after all.
    jobs.delete(unit);

    return false;
  }

  if (memory.unitPathData.get(unit)?.end() !== job.tile) {
    const path = Path.for(
      unit,
      unit.tile(),
      job.tile,
      dependencies.pathFinderRegistry
    );

    if (!path) {
      jobs.delete(unit);

      return false;
    }

    memory.unitPathData.set(unit, path);
  }

  await moveUnit(dependencies, player, memory, knowledge, unit, {
    stopAtPathEnd: true,
    wander: false,
  });

  if (
    unit.active() &&
    unit.moves().value() >= 0.1 &&
    !startJob(unit, job, lookupActions(unit.actions()))
  ) {
    noOrders(dependencies, unit);
  }

  return true;
};

export default terrainWork;
