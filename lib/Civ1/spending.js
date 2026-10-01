"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1SpendingPolicy = void 0;
exports.civ1SpendingPolicy = {
    // 30 gold, and 10 more for each city: a few turns of improvements' upkeep, and the eighth of the treasury a city in
    //  disorder may spend (`Civ1/disorder`). In the arena (civ-clone/web-renderer#233), keeping back what v474.05's rates
    //  routine counts as plenty instead (the turn + 100, over which it puts a step more into science) left most players
    //  never spending at all by turn 150, and built fewer improvements and grew less than this, for no more advances by
    //  turn 300. Kept this low, the treasury rarely reaches the turn + 100, so that step of science mostly goes to tax,
    //  and the tax to builds.
    reserve: (dependencies, player) => 30 + 10 * dependencies.cityRegistry.getByPlayer(player).length,
    minTurns: 5,
    wonderRemaining: 0.25,
};
exports.default = exports.civ1SpendingPolicy;
//# sourceMappingURL=spending.js.map