// Generic: a worker's terrain job (civ-clone/web-renderer#234): it picks the tile around the player's cities whose
//  improvement is worth most for the time it takes to get there and do it, by the ruleset's `TerrainPolicy`, claims
//  it, walks there, and does it. Then it picks the next. No two of the player's workers claim the same tile, nor a tile
//  some unit of the player's is heading for, such as a city site.
import Memory, { claimedTiles } from '../Memory';
import { ActionLookup, lookupActions } from '../actionLookup';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Path from '@civ-clone/core-world-path/Path';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
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

// Each player's workers' jobs, kept beside its memory.
const jobsByMemory: WeakMap<Memory, Map<Unit, TerrainJob>> = new WeakMap();

// How many jobs a worker tries to find a path to in a turn, best first, before giving up until its next turn.
export const PATH_TRIES = 3;

// How long a worker remembers each tile it found no path to, so that it doesn't search for one again each turn.
export const UNPATHABLE_TURNS = 10;

// The tiles each of the player's workers found no path to, each with the turn it found none.
const unpathableByMemory: WeakMap<
  Memory,
  Map<Unit, Map<Tile, number>>
> = new WeakMap();

// The tiles `unit` found no path to in the last `UNPATHABLE_TURNS` turns, each with the turn it found none, to add to.
//  Each is forgotten `UNPATHABLE_TURNS` turns after its own turn, however recently the others were found.
export const unpathableTiles = (
  memory: Memory,
  unit: Unit,
  turn: number
): Map<Tile, number> => {
  let byUnit = unpathableByMemory.get(memory);

  if (!byUnit) {
    byUnit = new Map();

    unpathableByMemory.set(memory, byUnit);
  }

  [...byUnit.keys()]
    .filter((other: Unit): boolean => other.destroyed())
    .forEach((other: Unit): boolean => byUnit!.delete(other));

  let tiles = byUnit.get(unit);

  if (!tiles) {
    tiles = new Map();

    byUnit.set(unit, tiles);
  }

  [...tiles.entries()]
    .filter(([, found]): boolean => turn - found >= UNPATHABLE_TURNS)
    .forEach(([tile]): boolean => tiles!.delete(tile));

  return tiles;
};

// How long the player remembers a job a worker found it had no action for, such as irrigation with no water beside
//  the tile, unless what's around the tile changes sooner (`jobCircumstances`). Only `hasOpenTerrainJob` uses it: at
//  worst, once a period, a city builds a worker for jobs none could do, which finds that out again.
export const UNDOABLE_TURNS = 20;

// A job a worker had no action for: the turn it found that, and the circumstances it found it in.
interface UndoableJob {
  circumstances: string;
  turn: number;
}

// The jobs the player's workers found they had no action for, by tile and improvement.
const undoableByMemory: WeakMap<
  Memory,
  Map<Tile, Map<TerrainImprovement, UndoableJob>>
> = new WeakMap();

const undoableJobsFor = (
  memory: Memory
): Map<Tile, Map<TerrainImprovement, UndoableJob>> => {
  let undoable = undoableByMemory.get(memory);

  if (!undoable) {
    undoable = new Map();

    undoableByMemory.set(memory, undoable);
  }

  return undoable;
};

// What a job's doability could depend on, whatever the ruleset, as a key that changes when any of it does: the
//  improvements on the tile and the tiles around it (irrigation from an irrigated neighbour, say) and the advances the
//  player has (roads on Rivers with Bridge Building, say). Anything else is caught by `UNDOABLE_TURNS`.
const jobCircumstances = (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
): string => {
  const improvements = [tile, ...tile.getNeighbours()].reduce(
      (total: number, tile: Tile): number =>
        total + dependencies.tileImprovementRegistry.getByTile(tile).length,
      0
    ),
    advances = dependencies.playerResearchRegistry
      .getBy('player', player)
      .reduce(
        (total: number, research: PlayerResearch): number =>
          total + research.complete().length,
        0
      );

  return `${improvements}:${advances}`;
};

// Notes that a worker of the player's has no action for `improvement` on `tile`.
export const rememberUndoableJob = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  { improvement, tile }: TerrainJob
): void => {
  const undoable = undoableJobsFor(memory);

  if (!undoable.has(tile)) {
    undoable.set(tile, new Map());
  }

  undoable.get(tile)!.set(improvement, {
    circumstances: jobCircumstances(dependencies, player, tile),
    turn: dependencies.turn.value(),
  });
};

// Whether a worker of the player's found it had no action for `improvement` on `tile`, in the last `UNDOABLE_TURNS`
//  turns and with nothing around the tile changed since. Anything older or changed is forgotten.
export const isKnownUndoable = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  { improvement, tile }: TerrainJob
): boolean => {
  const byImprovement = undoableJobsFor(memory).get(tile),
    found = byImprovement?.get(improvement);

  if (!found) {
    return false;
  }

  if (
    dependencies.turn.value() - found.turn < UNDOABLE_TURNS &&
    found.circumstances === jobCircumstances(dependencies, player, tile)
  ) {
    return true;
  }

  byImprovement!.delete(improvement);

  return false;
};

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
//  it, on a tile it can reach that no other unit of the player's has claimed, and that it could actually do there. Not
//  on any of `excluded`.
export const chooseTerrainJob = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  policy: TerrainPolicy,
  unit: Unit,
  excluded: Set<Tile> = new Set()
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
        !excluded.has(tile) &&
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

  // Best first, until one the worker could do: each tile is asked about once however many of its jobs are ranked.
  for (const [job] of ranked) {
    if (actionsAt(job.tile)[actionFor[job.improvement]]) {
      return job;
    }

    // With no moves left a unit is offered no actions at all, which says nothing about the job.
    if (unit.moves().value() >= 0.1) {
      rememberUndoableJob(dependencies, player, memory, job);
    }
  }

  return null;
};

// Whether a worker on `reachable` tiles would find a terrain job no unit of the player's has claimed, by the policy:
//  for production, whether a worker built now would have something to do (`lib/Civ1/buildItemInCity`). It can't ask
//  whether a worker could do the job there, as `chooseTerrainJob` does, which takes a unit with moves left, so it
//  leaves out the jobs the player's workers have found they have no action for (`isKnownUndoable`).
export const hasOpenTerrainJob = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  policy: TerrainPolicy,
  reachable: Set<Tile>
): boolean => {
  const claimed = claimedTiles(memory);

  terrainJobs(memory).forEach((job: TerrainJob): void => {
    claimed.add(job.tile);
  });

  return dependencies.cityRegistry
    .getByPlayer(player)
    .some((city: City): boolean =>
      city
        .tiles()
        .entries()
        .some(
          (tile: Tile): boolean =>
            reachable.has(tile) &&
            !claimed.has(tile) &&
            dependencies.cityRegistry.getByTile(tile) === null &&
            policy.jobs(dependencies, player, tile).some(
              ({ improvement, value }: TerrainJobValue): boolean =>
                value > 0 &&
                !isKnownUndoable(dependencies, player, memory, {
                  improvement,
                  tile,
                })
            )
        )
    );
};

// Forgets `unit`'s job, and the path to it, so nothing sends the unit on to a job it no longer has.
export const dropTerrainJob = (memory: Memory, unit: Unit): void => {
  const jobs = terrainJobs(memory),
    job = jobs.get(unit);

  if (!job) {
    return;
  }

  jobs.delete(unit);

  if (memory.unitPathData.get(unit)?.end() === job.tile) {
    memory.unitPathData.delete(unit);
  }
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
  const jobs = terrainJobs(memory),
    turn = dependencies.turn.value(),
    // A job's tile can be reachable by its terrain and still have no path to it: those are tried no more for a while.
    unpathable = unpathableTiles(memory, unit, turn);

  let job = jobs.get(unit);

  if (job && !stillWorthDoing(dependencies, player, policy, job)) {
    dropTerrainJob(memory, unit);

    job = undefined;
  }

  // The job, and a path to it: the next best each time there's none, up to `PATH_TRIES` searches.
  for (let searches = 0; ; ) {
    if (!job) {
      job =
        chooseTerrainJob(
          dependencies,
          player,
          memory,
          policy,
          unit,
          new Set(unpathable.keys())
        ) ?? undefined;

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
      dropTerrainJob(memory, unit);

      return false;
    }

    if (memory.unitPathData.get(unit)?.end() === job.tile) {
      break;
    }

    const path = Path.for(
      unit,
      unit.tile(),
      job.tile,
      dependencies.pathFinderRegistry
    );

    if (path) {
      memory.unitPathData.set(unit, path);

      break;
    }

    unpathable.set(job.tile, turn);
    jobs.delete(unit);
    job = undefined;

    if (++searches >= PATH_TRIES) {
      return false;
    }
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
