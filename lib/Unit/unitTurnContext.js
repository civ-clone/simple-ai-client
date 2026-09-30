"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnitTurnContext = void 0;
// Generic: what a unit's turn reads once, at its start, before any of its steps: its tile, target, available actions
//  and the units beside it. Creating it also seeds the unit's move history.
const actionLookup_1 = require("../actionLookup");
// Create exactly one per unit turn: `unit.actions()` creates `Action`s, whose ids are part of the game's state.
const createUnitTurnContext = (dependencies, memory, unit) => {
    const tile = unit.tile(), target = memory.unitTargetData.get(unit), actions = unit.actions(), lookup = (0, actionLookup_1.lookupActions)(actions), tileUnits = dependencies.unitRegistry.getByTile(tile), lastUnitMoves = memory.lastUnitMoves.get(unit);
    if (!lastUnitMoves) {
        memory.lastUnitMoves.set(unit, [unit.tile()]);
    }
    return {
        actions: lookup,
        target,
        tile,
        tileUnits,
    };
};
exports.createUnitTurnContext = createUnitTurnContext;
exports.default = exports.createUnitTurnContext;
//# sourceMappingURL=unitTurnContext.js.map