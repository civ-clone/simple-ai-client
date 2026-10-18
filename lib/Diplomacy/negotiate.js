"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canNegotiate = exports.handleNegotiation = void 0;
const AIClient_1 = require("@civ-clone/core-ai-client/AIClient");
const ChoiceMeta_1 = require("@civ-clone/core-client/ChoiceMeta");
const Initiate_1 = require("@civ-clone/core-diplomacy/Negotiation/Initiate");
const Negotiation_1 = require("@civ-clone/core-diplomacy/Negotiation");
const Resolution_1 = require("@civ-clone/core-diplomacy/Proposal/Resolution");
const mayNegotiate_1 = require("@civ-clone/library-diplomacy/lib/mayNegotiate");
const awaitTimeout = (delay, reason) => new Promise((resolve, reject) => setTimeout(() => (reason === undefined ? resolve() : reject(reason)), delay));
const handleNegotiation = async (dependencies, player, other) => {
    const negotiation = new Negotiation_1.default(player, other, dependencies.ruleRegistry);
    negotiation.proceed(new Initiate_1.default(player, negotiation, dependencies.ruleRegistry));
    while (!negotiation.terminated()) {
        const lastInteraction = negotiation.lastInteraction(), players = lastInteraction !== null
            ? lastInteraction.for()
            : negotiation.players().slice(1);
        await players.reduce(async (promise, participant) => promise
            .then(async () => {
            const client = dependencies.clientRegistry.getByPlayer(participant), nextSteps = negotiation.nextSteps(), resultPromise = Promise.race([
                client.chooseFromList(new ChoiceMeta_1.ChoiceMeta(nextSteps, 'negotiation.next-step', negotiation)),
                client instanceof AIClient_1.default
                    ? awaitTimeout(500, new Error(`Timeout waiting for ${client.player().id()} (${client.player().civilization().sourceClass().name}) - sent ${nextSteps.length} options`))
                    : new Promise(() => { }),
            ]);
            const interaction = await resultPromise;
            if (!interaction) {
                return;
            }
            negotiation.proceed(interaction);
            if (interaction instanceof Resolution_1.default) {
                await interaction.proposal().resolve(interaction);
            }
            // Sleep for a bit to ensure any other async actions have taken place
            await awaitTimeout(20);
        })
            .catch((reason) => console.error(reason)), Promise.resolve());
        if (negotiation.terminated()) {
            break;
        }
    }
    dependencies.interactionRegistry.register(negotiation);
    return negotiation;
};
exports.handleNegotiation = handleNegotiation;
// Negotiates, one after another, with each other player that has a unit next to `unit` and may negotiate with `player`
//  now.
const canNegotiate = async (dependencies, player, unit) => {
    const surroundingPlayers = Array.from(new Set(unit
        .tile()
        .getNeighbours()
        .flatMap((tile) => dependencies.unitRegistry
        .getByTile(tile)
        .map((tileUnit) => tileUnit.player())
        .filter((other) => other !== player))));
    if (surroundingPlayers.length === 0) {
        return;
    }
    await surroundingPlayers
        // How often players talk is the ruleset's to say (`MayNegotiate`).
        .filter((other) => (0, mayNegotiate_1.default)(player, other, dependencies.ruleRegistry, dependencies.interactionRegistry, dependencies.turn))
        .reduce((promise, other) => promise.then(() => (0, exports.handleNegotiation)(dependencies, player, other)), Promise.resolve());
};
exports.canNegotiate = canNegotiate;
exports.default = exports.canNegotiate;
//# sourceMappingURL=negotiate.js.map