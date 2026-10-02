"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainWork = void 0;
// Generic: a worker improves the terrain around the player's cities (civ-clone/web-renderer#234): it takes a terrain
//  job, or carries on with one, when it has no city site to settle and none it can reach, or when the player wants
//  more workers on terrain jobs than it has, by the ruleset's `TerrainPolicy` (`lib/Unit/terrainWork`). Otherwise it
//  drops any job it has. Handles the action only when the worker has a job to get on with; otherwise `WorkerTurn`
//  carries on as usual.
//
// For one worker of a human player's ("automate Settlers"), `attempt` does the next sensible terrain job: with no
//  survey in the player's memory, there's no city site to keep it from one.
const terrainWork_1 = require("../../lib/Unit/terrainWork");
const AIStrategy_1 = require("../lib/AIStrategy");
const Types_1 = require("@civ-clone/library-unit/Types");
const reachable_1 = require("../../lib/Unit/reachable");
const unitTurnContextFor_1 = require("../lib/unitTurnContextFor");
class TerrainWork extends AIStrategy_1.default {
    constructor(dependencies, knowledge, policy) {
        super(dependencies, knowledge);
        this._policy = policy;
    }
    handles(action) {
        return action.value() instanceof Types_1.Worker;
    }
    async attempt(action) {
        const player = action.player(), unit = action.value(), memory = this.memoryFor(player), jobs = (0, terrainWork_1.terrainJobs)(memory), { actions, target, tile } = (0, unitTurnContextFor_1.default)(this.dependencies(), action);
        // A worker settles rather than improves terrain if it can: it's on its way to a city site or standing on one, or
        //  there's a site it can reach and the player has the terrain workers it wants without it. Asked of every worker
        //  this is offered to: one at work is busy, and isn't offered.
        const others = [...jobs.keys()].filter((other) => other !== unit).length;
        if (target ||
            (actions.foundCity &&
                this.knowledge().shouldBuildCity(this.dependencies(), player, tile)) ||
            (others >= this._policy.workersWanted(this.dependencies(), player) &&
                this.siteInReach(unit, tile, memory.targets.goodSitesForCities))) {
            (0, terrainWork_1.dropTerrainJob)(memory, unit);
            return false;
        }
        return (0, terrainWork_1.default)(this.dependencies(), player, memory, this.knowledge(), this._policy, unit, actions);
    }
    siteInReach(unit, tile, sites) {
        if (!sites.some((site) => site !== tile)) {
            return false;
        }
        const reachable = (0, reachable_1.default)(unit);
        return sites.some((site) => site !== tile && (reachable === null || reachable.has(site)));
    }
}
exports.TerrainWork = TerrainWork;
exports.default = TerrainWork;
//# sourceMappingURL=TerrainWork.js.map