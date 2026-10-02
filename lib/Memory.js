"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMemory = exports.forgetDestroyedUnits = exports.forgetUnit = exports.claimedTiles = void 0;
// The tiles some unit of the player's is already heading for: its target, or where its path ends.
const claimedTiles = (memory) => new Set([
    ...memory.unitTargetData.values(),
    ...[...memory.unitPathData.values()].map((path) => path.end()),
]);
exports.claimedTiles = claimedTiles;
// Drops everything remembered about `unit`.
const forgetUnit = (memory, unit) => {
    memory.lastUnitMoves.delete(unit);
    memory.unitPathData.delete(unit);
    memory.unitTargetData.delete(unit);
};
exports.forgetUnit = forgetUnit;
// Drops what's remembered about units that have since been destroyed, however that happened (in combat, founding a
//  city, disbanded, lost at sea), so the maps don't grow for ever and a dead unit's path or target claims no tile.
const forgetDestroyedUnits = (memory) => [memory.lastUnitMoves, memory.unitTargetData, memory.unitPathData].forEach((map) => [...map.keys()]
    .filter((unit) => unit.destroyed())
    .forEach((unit) => map.delete(unit)));
exports.forgetDestroyedUnits = forgetDestroyedUnits;
const createMemory = () => ({
    lastUnitMoves: new Map(),
    surveyedTurn: null,
    targets: {
        citiesToLiberate: [],
        enemyCitiesToAttack: [],
        enemyUnitsToAttack: [],
        goodSitesForCities: [],
        landTilesToExplore: [],
        seaTilesToExplore: [],
        undefendedCities: [],
    },
    uncalmedCities: new Map(),
    unitPathData: new Map(),
    unitTargetData: new Map(),
});
exports.createMemory = createMemory;
//# sourceMappingURL=Memory.js.map