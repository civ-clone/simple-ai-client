"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerTurn = void 0;
// Generic: a worker's turn: found a city, irrigate, mine or build a road where it stands, or else take a city site to
//  head for, then move. With no site to head for and no step worth taking, it joins one of the player's cities, or
//  waits in one (`lib/Unit/idleWorker`), rather than step back and forth at random (civ-clone/web-renderer#230,
//  #243). Always handles a worker.
const moveUnit_1 = require("../../lib/Unit/moveUnit");
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const Types_1 = require("@civ-clone/library-unit/Types");
const idleWorker_1 = require("../../lib/Unit/idleWorker");
const overseas_1 = require("../../lib/Unit/overseas");
const settlerWork_1 = require("../../lib/Unit/settlerWork");
const unitTurnContextFor_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/unitTurnContextFor");
class WorkerTurn extends AIStrategy_1.default {
    handles(action) {
        return action.value() instanceof Types_1.Worker;
    }
    async attempt(action) {
        const player = action.player(), unit = action.value(), memory = this.memoryFor(player), { actions, target, tile } = (0, unitTurnContextFor_1.default)(this.dependencies(), action), { buildIrrigation, buildMine, buildRoad, foundCity } = actions;
        // One of the founders its leader sends overseas while there are still sites at home, with no site of its own yet:
        //  it goes for one overseas, if there is one it could be ferried to (`lib/Unit/overseas`, civ-clone/web-renderer#374).
        if (!memory.unitTargetData.has(unit) &&
            (0, overseas_1.settlesOverseas)(this.dependencies(), player, unit)) {
            const passenger = (0, overseas_1.planPassenger)(this.dependencies(), player, memory, unit, 'founder', memory.targets.goodSitesForCities);
            if (passenger) {
                if (!(0, overseas_1.travel)(this.dependencies(), player, memory, unit, passenger)) {
                    await (0, moveUnit_1.default)(this.dependencies(), player, memory, this.knowledge(), unit);
                }
                return true;
            }
        }
        (0, settlerWork_1.default)(this.dependencies(), player, memory, this.knowledge(), unit, tile, target, {
            buildIrrigation,
            buildMine,
            buildRoad,
            foundCity,
        });
        // `TerrainWork` has found it no terrain job, and `settlerWork` no site and nothing to do where it stands.
        if (!unit.destroyed() &&
            unit.active() &&
            unit.moves().value() >= 0.1 &&
            unit.tile() === tile &&
            !memory.unitTargetData.has(unit) &&
            !(0, moveUnit_1.hasStepWorthTaking)(this.dependencies(), player, memory, this.knowledge(), unit)) {
            // A city site on another landmass, with nothing to do here: it goes overseas (`lib/Unit/overseas`,
            //  civ-clone/web-renderer#374), from its port.
            const passenger = (0, overseas_1.planPassenger)(this.dependencies(), player, memory, unit, 'founder', memory.targets.goodSitesForCities);
            if (passenger) {
                if (!(0, overseas_1.travel)(this.dependencies(), player, memory, unit, passenger)) {
                    await (0, moveUnit_1.default)(this.dependencies(), player, memory, this.knowledge(), unit);
                }
                return true;
            }
            await (0, idleWorker_1.default)(this.dependencies(), player, memory, this.knowledge(), unit, actions);
            return true;
        }
        await (0, moveUnit_1.default)(this.dependencies(), player, memory, this.knowledge(), unit);
        return true;
    }
}
exports.WorkerTurn = WorkerTurn;
exports.default = WorkerTurn;
//# sourceMappingURL=WorkerTurn.js.map