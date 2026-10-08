"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Garrison = void 0;
// Generic: a unit in one of the player's cities fortifies there if the city needs more defenders, or if it can relieve
//  a weaker one, and makes the city its home. Handles the action only when it fortifies.
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const garrison_1 = require("../../lib/Unit/garrison");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
const unitTurnContextFor_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/unitTurnContextFor");
class Garrison extends AIStrategy_1.default {
    handles(action) {
        return (0, isUnitAction_1.default)(action);
    }
    attempt(action) {
        const { actions: { fortify, setHomeCity }, tile, tileUnits, } = (0, unitTurnContextFor_1.default)(this.dependencies(), action);
        return (0, garrison_1.default)(this.dependencies(), action.value(), tile, tileUnits, fortify, this.knowledge(), setHomeCity);
    }
}
exports.Garrison = Garrison;
exports.default = Garrison;
//# sourceMappingURL=Garrison.js.map