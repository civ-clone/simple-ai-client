"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoundCapital = void 0;
// Generic: a worker founds its player's first city where it stands once the player has waited long enough for a good
//  site. Handles the action only when it founds the city; otherwise `WorkerTurn` carries on as usual.
const FoundsCities_1 = require("@civ-clone/base-unit-trait-founds-cities/FoundsCities");
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const foundCapital_1 = require("../../lib/Unit/foundCapital");
const unitTurnContextFor_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/unitTurnContextFor");
class FoundCapital extends AIStrategy_1.default {
    // `foundByTurn`: from this turn a player with no city founds one wherever its worker stands. By then a first worker
    //  has usually found a good site: over 40 arena games, every other capital was founded by turn 5.
    constructor(dependencies, knowledge, foundByTurn = 5) {
        super(dependencies, knowledge);
        this._foundByTurn = foundByTurn;
    }
    // A unit that `FoundsCities`.
    handles(action) {
        const value = action.value();
        return value instanceof Unit_1.default && value.hasTrait(FoundsCities_1.default);
    }
    attempt(action) {
        const { actions: { foundCity }, } = (0, unitTurnContextFor_1.default)(this.dependencies(), action);
        if (!foundCity ||
            !(0, foundCapital_1.default)(this.dependencies(), action.player(), this._foundByTurn)) {
            return false;
        }
        action.value().action(foundCity);
        return true;
    }
}
exports.FoundCapital = FoundCapital;
exports.default = FoundCapital;
//# sourceMappingURL=FoundCapital.js.map