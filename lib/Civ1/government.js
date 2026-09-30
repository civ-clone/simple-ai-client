"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRevolution = void 0;
// Civ1: the AI's government, a revolution to Monarchy once it's known.
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const revolution_1 = require("@civ-clone/civ1-government/lib/revolution");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
// Through a revolution, like a human player: Anarchy first, then `ChooseGovernment` once it's over.
const startRevolution = (dependencies, player) => {
    const [playerGovernment] = dependencies.playerGovernmentRegistry.filter((playerGovernment) => playerGovernment.player() === player), [playerResearch] = dependencies.playerResearchRegistry.filter((playerScience) => playerScience.player() === player);
    if (playerResearch.completed(Advances_1.Monarchy) &&
        !playerGovernment.is(Governments_1.Monarchy, Governments_1.Anarchy) &&
        (0, revolution_1.pendingRevolution)(playerGovernment, dependencies.pendingEffectRegistry) ===
            null) {
        (0, revolution_1.revolution)(playerGovernment, dependencies.pendingEffectRegistry, dependencies.ruleRegistry, dependencies.turn);
    }
};
exports.startRevolution = startRevolution;
//# sourceMappingURL=government.js.map