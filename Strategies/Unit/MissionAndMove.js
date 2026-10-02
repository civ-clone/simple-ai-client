"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionAndMove = void 0;
// Generic: a unit with no target and no path to follow takes the first mission it qualifies for, then the move executor
//  runs. Handles every unit but one with nothing to do: no mission, nothing to head for and no step worth taking,
//  which it leaves to the next strategy (`StandDown`) rather than have it wander (civ-clone/web-renderer#230). An
//  aircraft is always handled, as before.
const AIStrategy_1 = require("../lib/AIStrategy");
const assignMission_1 = require("../../lib/Unit/assignMission");
const isUnitAction_1 = require("../lib/isUnitAction");
const moveUnit_1 = require("../../lib/Unit/moveUnit");
const unitTurnContextFor_1 = require("../lib/unitTurnContextFor");
class MissionAndMove extends AIStrategy_1.default {
    handles(action) {
        return (0, isUnitAction_1.default)(action);
    }
    async attempt(action) {
        const player = action.player(), unit = action.value(), memory = this.memoryFor(player), { target } = (0, unitTurnContextFor_1.default)(this.dependencies(), action), isAircraft = this.knowledge().isAircraft(this.dependencies(), unit);
        // A unit already on its way somewhere keeps going: its path ends where the last mission sent it, and the survey
        //  no longer offers that tile to anyone else.
        if (!target && !memory.unitPathData.has(unit)) {
            (0, assignMission_1.default)(this.dependencies(), memory, unit);
        }
        if (!isAircraft &&
            !target &&
            !memory.unitPathData.has(unit) &&
            !(0, moveUnit_1.hasStepWorthTaking)(this.dependencies(), player, memory, this.knowledge(), unit)) {
            return false;
        }
        await (0, moveUnit_1.default)(this.dependencies(), player, memory, this.knowledge(), unit, {
            wander: isAircraft,
            // A unit whose path ends with moves to spare and no step worth taking takes its next mission straight away,
            //  rather than standing still for the rest of the turn: an explorer that had walked to the edge of the known
            //  map stopped there until its next turn.
            onIdle: () => {
                if (memory.unitTargetData.has(unit)) {
                    return false;
                }
                (0, assignMission_1.default)(this.dependencies(), memory, unit);
                return memory.unitPathData.has(unit);
            },
        });
        return true;
    }
}
exports.MissionAndMove = MissionAndMove;
exports.default = MissionAndMove;
//# sourceMappingURL=MissionAndMove.js.map