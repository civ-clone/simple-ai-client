"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Raid = void 0;
const Strategy_1 = require("@civ-clone/core-strategy/Strategy");
const carriesUnits_1 = require("../../lib/Unit/carriesUnits");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
const raid_1 = require("../../lib/Barbarian/raid");
class Raid extends Strategy_1.default {
    constructor(dependencies) {
        super(dependencies.ruleRegistry);
        this._dependencies = dependencies;
    }
    handles(action) {
        return (0, isUnitAction_1.default)(action);
    }
    attempt(action) {
        const unit = action.value();
        if ((0, carriesUnits_1.isFerry)(unit, this._dependencies.ruleRegistry)) {
            (0, raid_1.sail)(this._dependencies, action.player(), unit);
        }
        else {
            (0, raid_1.raid)(this._dependencies, action.player(), unit);
        }
        return true;
    }
}
exports.Raid = Raid;
exports.default = Raid;
//# sourceMappingURL=Raid.js.map