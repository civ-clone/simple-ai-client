"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUsefulWonder = void 0;
// Civ1: whether a Wonder would do anything for a player (civ-clone/web-renderer#212). An obsolete Wonder does nothing,
//  and Civ1 makes one obsolete as soon as anyone discovers the advance that obsoletes it. The Lighthouse and Magellan's
//  Expedition only help ships, so they do nothing for a player with none.
const Wonders_1 = require("@civ-clone/civ1-wonder/Wonders");
const Types_1 = require("@civ-clone/library-unit/Types");
const obsolete_1 = require("@civ-clone/civ1-wonder/Rules/lib/obsolete");
const forShips = [Wonders_1.Lighthouse, Wonders_1.MagellansExpedition];
const isUsefulWonder = (dependencies, player, WonderType) => !(0, obsolete_1.isObsolete)(WonderType, dependencies.playerResearchRegistry) &&
    (!forShips.includes(WonderType) ||
        dependencies.unitRegistry
            .getByPlayer(player)
            .some((unit) => unit instanceof Types_1.Naval));
exports.isUsefulWonder = isUsefulWonder;
exports.default = exports.isUsefulWonder;
//# sourceMappingURL=wonders.js.map