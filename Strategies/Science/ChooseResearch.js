"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseResearch = void 0;
// Generic: picks what to research next, at random from what's available, preferring the advances the player's leader
//  wants (`wantedAdvances`), or, for a player bound to its land, the way to a transport first
//  (`lib/Player/islandBound`, civ-clone/web-renderer#632). Always handles the choice.
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const PlayerResearch_1 = require("@civ-clone/core-science/PlayerResearch");
const chooseResearch_1 = require("../../lib/Science/chooseResearch");
const islandBound_1 = require("../../lib/Player/islandBound");
const transportResearch_1 = require("../../lib/Science/transportResearch");
const wantedAdvances_1 = require("../../lib/Science/wantedAdvances");
class ChooseResearch extends AIStrategy_1.default {
    handles(action) {
        return action.value() instanceof PlayerResearch_1.default;
    }
    attempt(action) {
        var _a;
        const playerResearch = action.value(), player = playerResearch.player(), toTransport = (0, islandBound_1.default)(this.dependencies(), this.knowledge(), player, this.memoryFor(player))
            ? (0, transportResearch_1.default)(this.dependencies(), playerResearch)
            : null;
        if (toTransport !== null) {
            playerResearch.research(toTransport);
            return true;
        }
        (0, chooseResearch_1.default)(this.dependencies(), playerResearch, (_a = (0, wantedAdvances_1.default)(this.dependencies(), playerResearch.player())) !== null && _a !== void 0 ? _a : []);
        return true;
    }
}
exports.ChooseResearch = ChooseResearch;
exports.default = ChooseResearch;
//# sourceMappingURL=ChooseResearch.js.map