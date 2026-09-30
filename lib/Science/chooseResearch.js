"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseResearch = void 0;
// Draws from the random number generator only when there's something to choose from.
const chooseResearch = (dependencies, playerResearch) => {
    const available = playerResearch.available();
    if (available.length) {
        playerResearch.research(available[Math.floor(available.length * dependencies.randomNumberGenerator())]);
    }
};
exports.chooseResearch = chooseResearch;
exports.default = exports.chooseResearch;
//# sourceMappingURL=chooseResearch.js.map