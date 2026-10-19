"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canNegotiate = exports.handleNegotiation = exports.choosers = void 0;
const AIClient_1 = require("@civ-clone/core-ai-client/AIClient");
const ChoiceMeta_1 = require("@civ-clone/core-client/ChoiceMeta");
const Initiate_1 = require("@civ-clone/core-diplomacy/Negotiation/Initiate");
const Negotiation_1 = require("@civ-clone/core-diplomacy/Negotiation");
const Resolution_1 = require("@civ-clone/core-diplomacy/Proposal/Resolution");
const mayNegotiate_1 = require("@civ-clone/library-diplomacy/lib/mayNegotiate");
const awaitTimeout = (delay, reason) => new Promise((resolve, reject) => setTimeout(() => (reason === undefined ? resolve() : reject(reason)), delay));
// Who chooses the next step of `negotiation` from `offered`: the player whose steps they are, or, when they're more
//  than one player's, whoever the last interaction was for. Usually those are the same, but not always: after the
//  hand-over in a meeting at peace, the other player's acknowledgement is for the computer player, and the next move
//  is the other player's (civ-clone/web-renderer#450). The page's own client asks the same way.
const choosers = (negotiation, offered) => {
    const actors = Array.from(new Set(offered.map((step) => step.by()))), lastInteraction = negotiation.lastInteraction();
    if (actors.length === 1) {
        return actors;
    }
    return lastInteraction !== null
        ? lastInteraction.for()
        : negotiation.players().slice(1);
};
exports.choosers = choosers;
const handleNegotiation = async (dependencies, player, other) => {
    const negotiation = new Negotiation_1.default(player, other, dependencies.ruleRegistry);
    negotiation.proceed(new Initiate_1.default(player, negotiation, dependencies.ruleRegistry));
    while (!negotiation.terminated()) {
        // The steps on offer, worked out once for the first player asked: each call makes new actions.
        let offered = negotiation.nextSteps();
        const players = (0, exports.choosers)(negotiation, offered);
        await players.reduce(async (promise, participant) => promise
            .then(async () => {
            const client = dependencies.clientRegistry.getByPlayer(participant), nextSteps = offered !== null && offered !== void 0 ? offered : negotiation.nextSteps(), resultPromise = Promise.race([
                client.chooseFromList(new ChoiceMeta_1.ChoiceMeta(nextSteps, 'negotiation.next-step', negotiation)),
                client instanceof AIClient_1.default
                    ? awaitTimeout(500, new Error(`Timeout waiting for ${client.player().id()} (${client.player().civilization().sourceClass().name}) - sent ${nextSteps.length} options`))
                    : new Promise(() => { }),
            ]);
            offered = null;
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