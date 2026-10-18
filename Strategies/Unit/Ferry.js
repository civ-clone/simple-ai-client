"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ferry = void 0;
// Generic: a transport's turn as a ferry (`lib/Unit/ferry`): taking passengers overseas, or sailing to a port where
//  they're waiting (civ-clone/web-renderer#211, #374). Handles the action only then; otherwise the transport explores
//  (`MissionAndMove`).
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const Types_1 = require("@civ-clone/library-unit/Types");
const ferry_1 = require("../../lib/Unit/ferry");
const isUnitAction_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/isUnitAction");
class Ferry extends AIStrategy_1.default {
    handles(action) {
        return (0, isUnitAction_1.default)(action) && action.value() instanceof Types_1.NavalTransport;
    }
    attempt(action) {
        const player = action.player();
        return (0, ferry_1.default)(this.dependencies(), player, this.memoryFor(player), this.knowledge(), action.value());
    }
}
exports.Ferry = Ferry;
exports.default = Ferry;
//# sourceMappingURL=Ferry.js.map