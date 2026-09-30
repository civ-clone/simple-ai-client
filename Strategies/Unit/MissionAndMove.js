"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionAndMove = void 0;
// Generic: the fallback for any unit: a unit with no target takes the first mission it qualifies for, then the move
//  executor runs. Always handles a unit.
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
        const player = action.player(), unit = action.value(), memory = this.memoryFor(player), { target } = (0, unitTurnContextFor_1.default)(this.dependencies(), action);
        if (!target) {
            (0, assignMission_1.default)(this.dependencies(), memory, unit);
        }
        await (0, moveUnit_1.default)(this.dependencies(), player, memory, this.knowledge(), unit);
        return true;
    }
}
exports.MissionAndMove = MissionAndMove;
exports.default = MissionAndMove;
//# sourceMappingURL=MissionAndMove.js.map