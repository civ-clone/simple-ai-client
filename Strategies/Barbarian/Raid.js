"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Raid = void 0;
const NavalTransport_1 = require("@civ-clone/base-unit-type-naval-transport/NavalTransport");
const Strategy_1 = require("@civ-clone/core-strategy/Strategy");
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
        if (unit instanceof NavalTransport_1.default) {
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