"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldFoundCapital = void 0;
// From turn `foundByTurn`, a player with no city founds one wherever its worker has got to. Until then its workers
//  look for a good site as usual. A player that loses every city later in the game founds a new one at once.
const shouldFoundCapital = (dependencies, player, foundByTurn) => dependencies.turn.value() >= foundByTurn &&
    dependencies.cityRegistry.getByPlayer(player).length === 0;
exports.shouldFoundCapital = shouldFoundCapital;
exports.default = exports.shouldFoundCapital;
//# sourceMappingURL=foundCapital.js.map