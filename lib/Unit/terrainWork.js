"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terrainWork = exports.dropTerrainJob = exports.chooseTerrainJob = exports.terrainJobs = exports.unpathableTiles = exports.UNPATHABLE_TURNS = exports.PATH_TRIES = void 0;
const actionLookup_1 = require("../actionLookup");
const Path_1 = require("@civ-clone/core-world-path/Path");
const moveUnit_1 = require("./moveUnit");
const orders_1 = require("./orders");
const reachable_1 = require("./reachable");
const actionFor = {
    irrigation: 'buildIrrigation',
    mine: 'buildMine',
    road: 'buildRoad',
};
// Each player's workers' jobs, kept beside its memory.
const jobsByMemory = new WeakMap();
// How many jobs a worker tries to find a path to in a turn, best first, before giving up until its next turn.
exports.PATH_TRIES = 3;
// How long a worker remembers the tiles it found no path to, so that it doesn't search for one again each turn.
exports.UNPATHABLE_TURNS = 10;
// The tiles each of the player's workers found no path to, and the turn it started remembering them.
const unpathableByMemory = new WeakMap();
// The tiles `unit` found no path to in the last `UNPATHABLE_TURNS` turns, to add to.
const unpathableTiles = (memory, unit, turn) => {
    let byUnit = unpathableByMemory.get(memory);
    if (!byUnit) {
        byUnit = new Map();
        unpathableByMemory.set(memory, byUnit);
    }
    [...byUnit.keys()]
        .filter((other) => other.destroyed())
        .forEach((other) => byUnit.delete(other));
    let entry = byUnit.get(unit);
    if (!entry || turn - entry.since >= exports.UNPATHABLE_TURNS) {
        entry = { since: turn, tiles: new Set() };
        byUnit.set(unit, entry);
    }
    return entry.tiles;
};
exports.unpathableTiles = unpathableTiles;
// The player's workers' jobs, less those of workers that have since been destroyed.
const terrainJobs = (memory) => {
    let jobs = jobsByMemory.get(memory);
    if (!jobs) {
        jobs = new Map();
        jobsByMemory.set(memory, jobs);
    }
    [...jobs.keys()]
        .filter((unit) => unit.destroyed())
        .forEach((unit) => jobs.delete(unit));
    return jobs;
};
exports.terrainJobs = terrainJobs;
// Whether `job` is still worth doing: the policy still values that improvement of its tile.
const stillWorthDoing = (dependencies, player, policy, job) => policy
    .jobs(dependencies, player, job.tile)
    .some(({ improvement, value }) => improvement === job.improvement && value > 0);
// The best job for `unit` on the tiles of the player's cities: worth most for the turns it takes to walk there and do
//  it, on a tile it can reach that no other unit of the player's has claimed, and that it could actually do there. Not
//  on any of `excluded`.
const chooseTerrainJob = (dependencies, player, memory, policy, unit, excluded = new Set()) => {
    const jobs = (0, exports.terrainJobs)(memory), reachable = (0, reachable_1.default)(unit), 
    // Where the player's other units are heading, or working.
    claimed = new Set([
        ...[...memory.unitTargetData.entries()]
            .filter(([other]) => other !== unit)
            .map(([, tile]) => tile),
        ...[...memory.unitPathData.entries()]
            .filter(([other]) => other !== unit)
            .map(([, path]) => path.end()),
        ...[...jobs.entries()]
            .filter(([other]) => other !== unit)
            .map(([, job]) => job.tile),
    ]), tiles = new Set(dependencies.cityRegistry
        .getByPlayer(player)
        .flatMap((city) => city.tiles().entries())), 
    // `unit.actions` creates `Action`s, so each tile is asked about once at most.
    possible = new Map(), actionsAt = (tile) => {
        if (!possible.has(tile)) {
            possible.set(tile, (0, actionLookup_1.lookupActions)(unit.actions(tile, tile)));
        }
        return possible.get(tile);
    };
    const ranked = [...tiles]
        .filter((tile) => tile.isLand() &&
        dependencies.cityRegistry.getByTile(tile) === null &&
        !claimed.has(tile) &&
        !excluded.has(tile) &&
        (reachable === null || reachable.has(tile)))
        .flatMap((tile) => policy
        .jobs(dependencies, player, tile)
        .filter(({ value }) => value > 0)
        .map(({ improvement, value, turns, }) => [
        { improvement, tile },
        value / (turns + tile.distanceFrom(unit.tile())),
    ]))
        .sort(([, a], [, b]) => b - a);
    // Best first, until one the worker could do: each tile is asked about once however many of its jobs are ranked.
    for (const [job] of ranked) {
        if (actionsAt(job.tile)[actionFor[job.improvement]]) {
            return job;
        }
    }
    return null;
};
exports.chooseTerrainJob = chooseTerrainJob;
// Forgets `unit`'s job, and the path to it, so nothing sends the unit on to a job it no longer has.
const dropTerrainJob = (memory, unit) => {
    var _a;
    const jobs = (0, exports.terrainJobs)(memory), job = jobs.get(unit);
    if (!job) {
        return;
    }
    jobs.delete(unit);
    if (((_a = memory.unitPathData.get(unit)) === null || _a === void 0 ? void 0 : _a.end()) === job.tile) {
        memory.unitPathData.delete(unit);
    }
};
exports.dropTerrainJob = dropTerrainJob;
// Starts `job` if `unit` is on its tile and can. Returns whether it did.
const startJob = (unit, job, actions) => {
    const action = actions[actionFor[job.improvement]];
    if (unit.tile() !== job.tile || !action) {
        return false;
    }
    unit.action(action);
    return true;
};
// Carries on with `unit`'s job, or picks one: walks it towards its job's tile, or does the job there. Returns whether
//  it had a job to get on with. `actions` are what the unit can do where it stood at the start of its turn.
const terrainWork = async (dependencies, player, memory, knowledge, policy, unit, actions) => {
    var _a, _b;
    const jobs = (0, exports.terrainJobs)(memory), 
    // A job's tile can be reachable by its terrain and still have no path to it: those are tried no more for a while.
    unpathable = (0, exports.unpathableTiles)(memory, unit, dependencies.turn.value());
    let job = jobs.get(unit);
    if (job && !stillWorthDoing(dependencies, player, policy, job)) {
        (0, exports.dropTerrainJob)(memory, unit);
        job = undefined;
    }
    // The job, and a path to it: the next best each time there's none, up to `PATH_TRIES` searches.
    for (let searches = 0;;) {
        if (!job) {
            job =
                (_a = (0, exports.chooseTerrainJob)(dependencies, player, memory, policy, unit, unpathable)) !== null && _a !== void 0 ? _a : undefined;
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
            (0, exports.dropTerrainJob)(memory, unit);
            return false;
        }
        if (((_b = memory.unitPathData.get(unit)) === null || _b === void 0 ? void 0 : _b.end()) === job.tile) {
            break;
        }
        const path = Path_1.default.for(unit, unit.tile(), job.tile, dependencies.pathFinderRegistry);
        if (path) {
            memory.unitPathData.set(unit, path);
            break;
        }
        unpathable.add(job.tile);
        jobs.delete(unit);
        job = undefined;
        if (++searches >= exports.PATH_TRIES) {
            return false;
        }
    }
    await (0, moveUnit_1.default)(dependencies, player, memory, knowledge, unit, {
        stopAtPathEnd: true,
        wander: false,
    });
    if (unit.active() &&
        unit.moves().value() >= 0.1 &&
        !startJob(unit, job, (0, actionLookup_1.lookupActions)(unit.actions()))) {
        (0, orders_1.noOrders)(dependencies, unit);
    }
    return true;
};
exports.terrainWork = terrainWork;
exports.default = exports.terrainWork;
//# sourceMappingURL=terrainWork.js.map