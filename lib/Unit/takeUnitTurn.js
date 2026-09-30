"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeUnitTurn = void 0;
const Types_1 = require("@civ-clone/library-unit/Types");
const assignMission_1 = require("./assignMission");
const garrison_1 = require("./garrison");
const actionLookup_1 = require("../actionLookup");
const moveUnit_1 = require("./moveUnit");
const settlerWork_1 = require("./settlerWork");
const unloadTransport_1 = require("./unloadTransport");
// Not `async`: returns the move executor's own promise when the unit moves, and `null` when its turn ended without
//  moving, so the caller awaits exactly where the inline version did.
const takeUnitTurn = (dependencies, player, memory, knowledge, unit) => {
    const tile = unit.tile(), target = memory.unitTargetData.get(unit), actions = unit.actions(), { buildIrrigation, buildMine, buildRoad, fortify, foundCity, unload } = (0, actionLookup_1.default)(actions), tileUnits = dependencies.unitRegistry.getByTile(tile), lastUnitMoves = memory.lastUnitMoves.get(unit);
    if (!lastUnitMoves) {
        memory.lastUnitMoves.set(unit, [unit.tile()]);
    }
    if ((0, unloadTransport_1.default)(memory, unit, tile, unload)) {
        return null;
    }
    if (unit instanceof Types_1.Worker) {
        (0, settlerWork_1.default)(dependencies, player, memory, knowledge, unit, tile, target, {
            buildIrrigation,
            buildMine,
            buildRoad,
            foundCity,
        });
        return (0, moveUnit_1.default)(dependencies, player, memory, knowledge, unit);
    }
    if ((0, garrison_1.default)(dependencies, unit, tile, tileUnits, fortify)) {
        return null;
    }
    if (!target) {
        (0, assignMission_1.default)(dependencies, memory, unit);
    }
    return (0, moveUnit_1.default)(dependencies, player, memory, knowledge, unit);
};
exports.takeUnitTurn = takeUnitTurn;
exports.default = exports.takeUnitTurn;
//# sourceMappingURL=takeUnitTurn.js.map