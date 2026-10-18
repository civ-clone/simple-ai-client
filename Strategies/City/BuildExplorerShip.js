"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildExplorerShip = void 0;
// Generic: a coastal city builds a transport for passengers waiting in it to go overseas, or a ship to explore the
//  sea with, when the player has more than one city and no ship (`lib/City/explorerShip`). Handles the choice only then; otherwise the ruleset's production choice
//  (`ChooseProduction`) makes it.
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const CityBuild_1 = require("@civ-clone/core-city-build/CityBuild");
const explorerShip_1 = require("../../lib/City/explorerShip");
class BuildExplorerShip extends AIStrategy_1.default {
    handles(action) {
        return action.value() instanceof CityBuild_1.default;
    }
    attempt(action) {
        var _a;
        const player = action.player(), cityBuild = action.value(), memory = this.memoryFor(player), ship = (_a = (0, explorerShip_1.ferryShipFor)(this.dependencies(), player, memory, cityBuild.city())) !== null && _a !== void 0 ? _a : (0, explorerShip_1.default)(this.dependencies(), player, memory.targets, cityBuild.city(), this.knowledge());
        if (ship === null) {
            return false;
        }
        cityBuild.build(ship);
        return true;
    }
}
exports.BuildExplorerShip = BuildExplorerShip;
exports.default = BuildExplorerShip;
//# sourceMappingURL=BuildExplorerShip.js.map