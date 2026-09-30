"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMemory = exports.forgetDestroyedUnits = exports.claimedTiles = void 0;
// The tiles some unit of the player's is already heading for: its target, or where its path ends.
const claimedTiles = (memory) => new Set([
    ...memory.unitTargetData.values(),
    ...[...memory.unitPathData.values()].map((path) => path.end()),
]);
exports.claimedTiles = claimedTiles;
// Drops the targets and paths of units that have since been destroyed, so they neither leak nor claim tiles.
const forgetDestroyedUnits = (memory) => [memory.unitTargetData, memory.unitPathData].forEach((map) => [...map.keys()]
    .filter((unit) => unit.destroyed())
    .forEach((unit) => map.delete(unit)));
exports.forgetDestroyedUnits = forgetDestroyedUnits;
const createMemory = () => ({
    lastUnitMoves: new Map(),
    targets: {
        citiesToLiberate: [],
        enemyCitiesToAttack: [],
        enemyUnitsToAttack: [],
        goodSitesForCities: [],
        landTilesToExplore: [],
        seaTilesToExplore: [],
        undefendedCities: [],
    },
    unitPathData: new Map(),
    unitTargetData: new Map(),
});
exports.createMemory = createMemory;
//# sourceMappingURL=Memory.js.map