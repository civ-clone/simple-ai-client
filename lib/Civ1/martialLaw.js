"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civ1MartialLawPolicy = void 0;
// Civ1: martial law, as `civ1-city-happiness`'s `Cost` rule has it: under Anarchy, Communism, Despotism or Monarchy
//  each unit in a city keeps one of its unhappy citizens content, up to four. The rule keeps both in its own closure, so
//  they're repeated here; how many units it uses, and how many citizens are unhappy, are asked of the rule itself.
const Governments_1 = require("@civ-clone/civ1-government/Governments");
exports.civ1MartialLawPolicy = {
    limit: (dependencies, city) => dependencies.playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(Governments_1.Anarchy, Governments_1.Communism, Governments_1.Despotism, Governments_1.Monarchy)
        ? 4
        : 0,
};
exports.default = exports.civ1MartialLawPolicy;
//# sourceMappingURL=martialLaw.js.map