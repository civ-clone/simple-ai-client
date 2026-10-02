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
// Here, as for a human player, every change is a revolution and a spell of Anarchy (`civ1-government`), so:
//  - the player leaves Despotism as soon as it knows any other government, and never goes back to it by choice: step 1
//    would cost it Anarchy twice over, to and from it (and the save that raised the issue had a player stuck in it);
//  - once out of Despotism, it changes government only when the choice above comes out differently, and no sooner than
//    the policy's `revolutionTurns` after its last revolution;
//  - with none of 2-4 to choose, it takes the first of Monarchy, Communism and The Republic it knows, and Democracy only
//    when it knows none of those: Civ1's Democracy needs Philosophy and Literacy, not The Republic, so it can be the
//    first government a player learns, where the original would stay in Despotism.
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const revolution_1 = require("@civ-clone/civ1-government/lib/revolution");
const Types_1 = require("@civ-clone/library-unit/Types");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Yields_1 = require("@civ-clone/library-city/Yields");
const traits_1 = require("../traits");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
exports.defaultGovernmentPolicy = {
    revolutionTurns: 40,
};
// The turn of each player's last revolution, by its `PlayerGovernment`.
const lastRevolution = new WeakMap();
// v474.05's case for The Republic: for each of the player's cities, a point for each tile it works that gives trade
//  (The Republic adds one to each), less, for each unit of the city's that can attack and is away from it (or is an
//  aircraft), 7 − Ideology, or 5 − Ideology with a Marketplace: each such unit makes a citizen unhappy under The
//  Republic. 0 or more favours The Republic.
const republicScore = (dependencies, player) => {
    const playerIdeology = (0, traits_1.ideology)(dependencies, player);
    return dependencies.cityRegistry
        .getByPlayer(player)
        .reduce((total, city) => {
        const tradeTiles = dependencies.workedTileRegistry
            .getByCity(city)
            .filter((workedTile) => (0, reduceYields_1.reduceYield)(workedTile.tile().yields(player), Yields_1.Trade) > 0).length, unitsAway = dependencies.unitRegistry
            .getByCity(city)
            .filter((unit) => unit.attack().value() > 0 &&
            (unit instanceof Types_1.Air || unit.tile() !== city.tile())).length, perUnit = (dependencies.cityImprovementRegistry
            .getByCity(city)
            .some((improvement) => improvement instanceof CityImprovements_1.Marketplace)
            ? 5
            : 7) - playerIdeology;
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
//  Anarchy like a human player, then `ChooseGovernment` once it's over.
const startRevolution = (dependencies, player, policy = exports.defaultGovernmentPolicy) => {
    const playerGovernment = playerGovernmentOf(dependencies, player), turn = dependencies.turn.value(), last = lastRevolution.get(playerGovernment);
    if (playerGovernment.is(Governments_1.Anarchy) ||
        (0, revolution_1.pendingRevolution)(playerGovernment, dependencies.pendingEffectRegistry) !==
            null ||
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
    (0, revolution_1.revolution)(playerGovernment, dependencies.pendingEffectRegistry, dependencies.ruleRegistry, dependencies.turn);
};
exports.startRevolution = startRevolution;
// Once the Anarchy is over: the government it would choose now.
const pickGovernment = (dependencies, playerGovernment) => (0, revolution_1.chooseGovernment)(playerGovernment, (0, exports.preferredGovernment)(dependencies, playerGovernment.player(), playerGovernment.available()), dependencies.pendingEffectRegistry, dependencies.turn);
exports.pickGovernment = pickGovernment;
//# sourceMappingURL=government.js.map