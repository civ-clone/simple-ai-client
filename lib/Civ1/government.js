"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickGovernment = exports.startRevolution = exports.preferredGovernment = exports.republicScore = exports.defaultGovernmentPolicy = void 0;
// Civ1: the AI's government (civ-clone/web-renderer#231), after v474.05's AI: OpenCivOne `AIEngine.cs`
//  `F0_25fb_0004_RecalculateStatsAndPolicies`, L340-366, every eighth turn (staggered by player), in this order:
//  1. Despotism, while what the player's cities spend supporting units would be free under it and outweighs what
//     Despotism costs their best tiles (`Var_e3c2`, summed in `CityWorker.cs` L1912-1916 and L3749-3752);
//  2. The Republic, if known, while its trade outweighs the unhappiness of the units away from home (`Var_db42`,
//     `CityWorker.cs` L1918-1925 and L3757-3760: `republicScore` below);
//  3. Communism, if known, with more than 10 cities;
//  4. Monarchy, if known.
// It never chooses Democracy. The original changes government on the spot, with no Anarchy
//  (`Diplomacy.cs` `F0_2517_04a1_ChangeCurrentGovernment`, L192ff, the AI's branch).
//
// Here, as for a human player, every change is a revolution and a spell of Anarchy. The revolution is the loaded
//  ruleset's, whichever it is: its `RevolutionTerms` rule (`base-government-change`) names its save key and interim
//  government, and `base-government-change`'s `lib/revolution` starts and finishes it as the ruleset's own wrappers do
//  (civ1-government's for Civ1, civ2-government's for Civ2). With no such rule the player never revolts. So:
//  - the player leaves Despotism as soon as it knows any other government, and never goes back to it by choice: step 1
//    would cost it Anarchy twice over, to and from it (and the save that raised the issue had a player stuck in it);
//  - once out of Despotism, it changes government only when the choice above comes out differently, and no sooner than
//    the policy's `revolutionTurns` after its last revolution;
//  - with none of 2-4 to choose, it takes the first of Monarchy, Communism and The Republic it knows, and Democracy only
//    when it knows none of those: Civ1's Democracy needs Philosophy and Literacy, not The Republic, so it can be the
//    first government a player learns, where the original would stay in Despotism.
const traits_1 = require("@civ-clone/core-unit/traits");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const revolution_1 = require("@civ-clone/base-government-change/lib/revolution");
const Types_1 = require("@civ-clone/library-unit/Types");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const MilitaryUnhappinessTolerance_1 = require("@civ-clone/base-leader-personality/Rules/Player/MilitaryUnhappinessTolerance");
const Yields_1 = require("@civ-clone/library-city/Yields");
const terms_1 = require("@civ-clone/base-government-change/lib/terms");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const combine_1 = require("@civ-clone/base-leader-personality/lib/combine");
exports.defaultGovernmentPolicy = {
    revolutionTurns: 40,
};
// The turn of each player's last revolution, by its `PlayerGovernment`.
const lastRevolution = new WeakMap();
// v474.05's case for The Republic: for each of the player's cities, a point for each tile it works that gives trade
//  (The Republic adds one to each), less, for each unit of the city's that can attack and is away from it (or is an
//  aircraft), 7 − Ideology, or 5 − Ideology with a Marketplace: each such unit makes a citizen unhappy under The
//  Republic. Ideology is the leader's `MilitaryUnhappinessTolerance` (`base-leader-personality`). 0 or more favours
//  The Republic.
const republicScore = (dependencies, player) => {
    const tolerance = (0, combine_1.sum)(dependencies.ruleRegistry, MilitaryUnhappinessTolerance_1.default, player);
    return dependencies.cityRegistry
        .getByPlayer(player)
        .reduce((total, city) => {
        const tradeTiles = dependencies.workedTileRegistry
            .getByCity(city)
            .filter((workedTile) => (0, reduceYields_1.reduceYield)(workedTile.tile().yields(player), Yields_1.Trade) > 0).length, unitsAway = dependencies.unitRegistry
            .getByCity(city)
            .filter((unit) => unit.attack().value() > 0 &&
            ((0, traits_1.isA)(unit, Types_1.Air) || unit.tile() !== city.tile())).length, perUnit = (dependencies.cityImprovementRegistry
            .getByCity(city)
            .some((improvement) => improvement instanceof CityImprovements_1.Marketplace)
            ? 5
            : 7) - tolerance;
        return total + tradeTiles - perUnit * unitsAway;
    }, 0);
};
exports.republicScore = republicScore;
// The government the player would choose of those `available` to it.
const preferredGovernment = (dependencies, player, available) => {
    var _a;
    const knows = (GovernmentType) => available.includes(GovernmentType);
    if (knows(Governments_1.Republic) && (0, exports.republicScore)(dependencies, player) >= 0) {
        return Governments_1.Republic;
    }
    if (knows(Governments_1.Communism) &&
        dependencies.cityRegistry.getByPlayer(player).length > 10) {
        return Governments_1.Communism;
    }
    return (_a = [Governments_1.Monarchy, Governments_1.Communism, Governments_1.Republic, Governments_1.Democracy].find(knows)) !== null && _a !== void 0 ? _a : Governments_1.Despotism;
};
exports.preferredGovernment = preferredGovernment;
const playerGovernmentOf = (dependencies, player) => dependencies.playerGovernmentRegistry.getByPlayer(player);
// At the start of the player's turn: a revolution if it would choose another government than the one it has, through
//  the ruleset's interim government (Anarchy) like a human player, then `ChooseGovernment` once it's over.
const startRevolution = (dependencies, player, policy = exports.defaultGovernmentPolicy) => {
    const terms = (0, terms_1.revolutionTerms)(dependencies.ruleRegistry);
    if (terms === null) {
        return;
    }
    const playerGovernment = playerGovernmentOf(dependencies, player), turn = dependencies.turn.value(), last = lastRevolution.get(playerGovernment);
    if (playerGovernment.is(terms.Interim) ||
        (0, revolution_1.pendingRevolution)(terms.key, playerGovernment, dependencies.pendingEffectRegistry) !== null ||
        (!playerGovernment.is(Governments_1.Despotism) &&
            last !== undefined &&
            turn - last < policy.revolutionTurns)) {
        return;
    }
    const preferred = (0, exports.preferredGovernment)(dependencies, player, playerGovernment.available());
    if (playerGovernment.is(preferred) || preferred === Governments_1.Despotism) {
        return;
    }
    lastRevolution.set(playerGovernment, turn);
    (0, revolution_1.revolution)(terms.key, terms.Interim, playerGovernment, dependencies.pendingEffectRegistry, dependencies.ruleRegistry, dependencies.turn, 'chosen');
};
exports.startRevolution = startRevolution;
// Once the interim is over: the government it would choose now. Whatever started the revolution (this player's
//  choice, or its cities' disorder), it is the ruleset's, under its key.
const pickGovernment = (dependencies, playerGovernment) => {
    const terms = (0, terms_1.revolutionTerms)(dependencies.ruleRegistry);
    if (terms === null) {
        return;
    }
    (0, revolution_1.chooseGovernment)(terms.key, playerGovernment, (0, exports.preferredGovernment)(dependencies, playerGovernment.player(), playerGovernment.available()), dependencies.pendingEffectRegistry, dependencies.turn);
};
exports.pickGovernment = pickGovernment;
//# sourceMappingURL=government.js.map