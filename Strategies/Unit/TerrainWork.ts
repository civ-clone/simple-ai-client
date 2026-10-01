// Generic: a worker improves the terrain around the player's cities (civ-clone/web-renderer#234): it takes a terrain
//  job, or carries on with one, when it has no city site to settle and none it can reach, or when the player wants
//  more workers on terrain jobs than it has, by the ruleset's `TerrainPolicy` (`lib/Unit/terrainWork`). Handles the
//  action only when the worker has a job to get on with; otherwise `WorkerTurn` carries on as usual.
//
// For one worker of a human player's ("automate Settlers"), `attempt` does the next sensible terrain job: with no
//  survey in the player's memory, there's no city site to keep it from one.
import terrainWork, {
  TerrainPolicy,
  terrainJobs,
} from '../../lib/Unit/terrainWork';
import AIStrategy from '../lib/AIStrategy';
import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { Worker } from '@civ-clone/library-unit/Types';
import reachableTiles from '../../lib/Unit/reachable';
import unitTurnContextFor from '../lib/unitTurnContextFor';

export class TerrainWork extends AIStrategy {
  private _policy: TerrainPolicy;

  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy: TerrainPolicy
  ) {
    super(dependencies, knowledge);

    this._policy = policy;
  }

  handles(action: PlayerAction): boolean {
    return action.value() instanceof Worker;
  }

  async attempt(action: PlayerAction<Unit>): Promise<boolean> {
    const player = action.player(),
      unit = action.value(),
      memory = this.memoryFor(player),
      jobs = terrainJobs(memory),
      { actions, target, tile } = unitTurnContextFor(
        this.dependencies(),
        action
      );

    const job = jobs.get(unit);

    // Until it has started work, a worker settles rather than improves terrain if it can: it's on its way to a city
    //  site or standing on one, or there's a site it can reach and the player has the terrain workers it wants without
    //  it.
    if (!job || job.tile !== tile) {
      const others = [...jobs.keys()].filter(
        (other: Unit): boolean => other !== unit
      ).length;

      if (
        target ||
        (actions.foundCity &&
          this.knowledge().shouldBuildCity(
            this.dependencies(),
            player,
            tile
          )) ||
        (others >= this._policy.workersWanted(this.dependencies(), player) &&
          this.siteInReach(unit, tile, memory.targets.goodSitesForCities))
      ) {
        if (job) {
          jobs.delete(unit);

          if (memory.unitPathData.get(unit)?.end() === job.tile) {
            memory.unitPathData.delete(unit);
          }
        }

        return false;
      }
    }

    return terrainWork(
      this.dependencies(),
      player,
      memory,
      this.knowledge(),
      this._policy,
      unit,
      actions
    );
  }

  private siteInReach(unit: Unit, tile: Tile, sites: Tile[]): boolean {
    if (!sites.some((site: Tile): boolean => site !== tile)) {
      return false;
    }

    const reachable = reachableTiles(unit);

    return sites.some(
      (site: Tile): boolean =>
        site !== tile && (reachable === null || reachable.has(site))
    );
  }
}

export default TerrainWork;
