"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandDown = void 0;
// Generic: a unit with nothing to do, which `MissionAndMove` has passed over, goes where a city wants it, is disbanded
//  if the ruleset's policy finds it isn't worth keeping, or stays in or heads for one of the player's cities
//  (`lib/Unit/standDown`). Always handles a unit.
const standDown_1 = require("../../lib/Unit/standDown");
const AIStrategy_1 = require("../lib/AIStrategy");
const isUnitAction_1 = require("../lib/isUnitAction");
const unitTurnContextFor_1 = require("../lib/unitTurnContextFor");
class StandDown extends AIStrategy_1.default {
    constructor(dependencies, knowledge, policy) {
        super(dependencies, knowledge);
        this._policy = policy;
    }
    handles(action) {
        return (0, isUnitAction_1.default)(action);
    }
    async attempt(action) {
        const { actions } = (0, unitTurnContextFor_1.default)(this.dependencies(), action);
        await (0, standDown_1.default)(this.dependencies(), action.player(), this.memoryFor(action.player()), this.knowledge(), this._policy, action.value(), actions);
        return true;
    }
}
exports.StandDown = StandDown;
exports.default = StandDown;
//# sourceMappingURL=StandDown.js.map