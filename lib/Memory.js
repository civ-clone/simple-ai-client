"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMemory = void 0;
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