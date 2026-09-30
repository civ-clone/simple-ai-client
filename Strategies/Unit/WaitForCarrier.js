"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitForCarrier = void 0;
// Generic: holds an aircraft back until the player's carriers have moved. Handles the action only when it does.
const AIStrategy_1 = require("../lib/AIStrategy");
const isUnitAction_1 = require("../lib/isUnitAction");
const waitForCarrier_1 = require("../../lib/Unit/waitForCarrier");
class WaitForCarrier extends AIStrategy_1.default {
    handles(action) {
        return (0, isUnitAction_1.default)(action);
    }
    attempt(action) {
        return (0, waitForCarrier_1.default)(this.dependencies(), action.player(), this.knowledge(), action.value());
    }
}
exports.WaitForCarrier = WaitForCarrier;
exports.default = WaitForCarrier;
//# sourceMappingURL=WaitForCarrier.js.map