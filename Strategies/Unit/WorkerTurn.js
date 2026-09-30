"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerTurn = void 0;
// Generic: a worker's turn: found a city, irrigate, mine or build a road where it stands, or else take a city site to
//  head for, then move. Always handles a worker.
const Types_1 = require("@civ-clone/library-unit/Types");
const AIStrategy_1 = require("../lib/AIStrategy");
const moveUnit_1 = require("../../lib/Unit/moveUnit");
const settlerWork_1 = require("../../lib/Unit/settlerWork");
const unitTurnContextFor_1 = require("../lib/unitTurnContextFor");
class WorkerTurn extends AIStrategy_1.default {
    handles(action) {
        return action.value() instanceof Types_1.Worker;
    }
    async attempt(action) {
        const player = action.player(), unit = action.value(), memory = this.memoryFor(player), { actions: { buildIrrigation, buildMine, buildRoad, foundCity }, target, tile, } = (0, unitTurnContextFor_1.default)(this.dependencies(), action);
        (0, settlerWork_1.default)(this.dependencies(), player, memory, this.knowledge(), unit, tile, target, {
            buildIrrigation,
            buildMine,
            buildRoad,
            foundCity,
        });
        await (0, moveUnit_1.default)(this.dependencies(), player, memory, this.knowledge(), unit);
        return true;
    }
}
exports.WorkerTurn = WorkerTurn;
exports.default = WorkerTurn;
//# sourceMappingURL=WorkerTurn.js.map