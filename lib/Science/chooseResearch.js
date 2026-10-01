"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseResearch = void 0;
// Draws from the random number generator once, and only when there's something to choose from: among the `wanted`
//  advances available or, if there are none, among everything available. Once a player has every advance it wants,
//  and so has stopped researching, that's everything available: the engine still asks it to choose, but its science
//  rate is 0, so nothing comes of it.
const chooseResearch = (dependencies, playerResearch, wanted = []) => {
    const available = playerResearch.available(), availableWanted = available.filter((AdvanceType) => wanted.includes(AdvanceType)), choices = availableWanted.length > 0 ? availableWanted : available;
    if (choices.length) {
        playerResearch.research(choices[Math.floor(choices.length * dependencies.randomNumberGenerator())]);
    }
};
exports.chooseResearch = chooseResearch;
exports.default = exports.chooseResearch;
//# sourceMappingURL=chooseResearch.js.map