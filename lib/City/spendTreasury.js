"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spendTreasury = exports.purchases = void 0;
// Generic: at the end of the player's turn, spends what its treasury holds over a reserve on finishing what its cities
//  are building (civ-clone/web-renderer#233), at the ruleset's own price (`PlayerTreasury#cost` and `#buy`), a whole
//  build at a time. A treasury that's never spent is no use to anyone.
//
// What's worth buying, most valuable first:
//  1. a unit that can defend a city short of defenders, or one martial law would use in a city short of those
//     (`City/defence`), the cheapest first;
//  2. an improvement, or a worker (Settlers) in a city that can spare the citizen, that the city would otherwise take
//     at least the policy's `minTurns` to finish at its net shields: the most turns saved per gold first, which is the
//     city that makes the fewest shields;
//  3. a Wonder, but only once no more than the policy's `wonderRemaining` share of it is left to build.
// Nothing else: other units are only built when a city can make them soon, and anything else a ruleset lets a city
//  build (Civ1's spaceship parts) isn't an improvement.
//
// As in v474.05 (OpenCivOne `CityWorker.cs`, where the AI buys only into a build with shields in it already), nothing
//  is bought before the city has put a shield into it: the ruleset charges double for a build not yet started.
const traits_1 = require("@civ-clone/core-unit/traits");
const Terraforms_1 = require("@civ-clone/base-unit-trait-terraforms/Terraforms");
const CityImprovement_1 = require("@civ-clone/core-city-improvement/CityImprovement");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const buildTime_1 = require("./buildTime");
const defence_1 = require("./defence");
const kindOrder = ['defender', 'build', 'wonder'];
// More turns than any build is worth waiting for, standing in for a city that makes no shields to spare.
const NEVER = 1000;
const isA = (Type, item) => Object.prototype.isPrototypeOf.call(Type, item);
// The treasury the ruleset sells builds for, and its price for what `city` is building, or `null`.
const priceOf = (treasuries, city) => {
    for (const treasury of treasuries) {
        const [spendCost] = treasury
            .cost(city)
            .filter((spendCost) => spendCost.resource() === treasury.yield());
        if (spendCost) {
            return [treasury, spendCost.value()];
        }
    }
    return null;
};
// What `city` is building, if it's worth buying, and of what kind.
const kindOf = (dependencies, knowledge, policy, city, building, turnsLeft, yields) => {
    const item = building.item();
    if (isA(Unit_1.default, item)) {
        // Only a unit that would meet what the city is short of: one that can defend it, or one martial law would use.
        if (((0, defence_1.wantsDefender)(dependencies, knowledge, city) &&
            (0, defence_1.isDefenderType)(dependencies, item)) ||
            ((0, defence_1.wantsMartialLawUnit)(dependencies, knowledge, city, yields) &&
                knowledge.martialLaw.wouldUse(dependencies, item))) {
            return 'defender';
        }
        return (0, traits_1.hasTrait)(item, Terraforms_1.default, dependencies.ruleRegistry) &&
            dependencies.cityGrowthRegistry.getByCity(city).size() > 1 &&
            turnsLeft >= policy.minTurns
            ? 'build'
            : null;
    }
    if (isA(Wonder_1.default, item)) {
        return dependencies.cityBuildRegistry.getByCity(city).remaining() <=
            building.cost().value() * policy.wonderRemaining
            ? 'wonder'
            : null;
    }
    return isA(CityImprovement_1.default, item) && turnsLeft >= policy.minTurns
        ? 'build'
        : null;
};
// What's worth buying in the player's cities, most valuable first, at today's prices.
const purchases = (dependencies, knowledge, policy, player) => {
    const treasuries = dependencies.playerTreasuryRegistry.getByPlayer(player);
    return dependencies.cityRegistry
        .getByPlayer(player)
        .flatMap((city) => {
        const cityBuild = dependencies.cityBuildRegistry.getByCity(city), building = cityBuild.building(), remaining = cityBuild.remaining();
        if (building === null ||
            !(remaining > 0) ||
            cityBuild.progress().value() <= 0) {
            return [];
        }
        const price = priceOf(treasuries, city);
        if (price === null || price[1] <= 0) {
            return [];
        }
        const yields = city.yields(), shields = (0, buildTime_1.netShields)(city, yields), turnsLeft = shields > 0 ? Math.min(NEVER, Math.ceil(remaining / shields)) : NEVER, kind = kindOf(dependencies, knowledge, policy, city, building, turnsLeft, yields);
        if (kind === null) {
            return [];
        }
        return [
            {
                city,
                kind,
                price: price[1],
                value: kind === 'defender' ? 1 / price[1] : turnsLeft / price[1],
            },
        ];
    })
        .sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind) ||
        b.value - a.value);
};
exports.purchases = purchases;
// Buys what's worth buying, most valuable first, while the treasury holds the price over the policy's reserve. One
//  that costs too much is passed over for the next. Returns the gold spent.
const spendTreasury = (dependencies, knowledge, policy, player) => {
    const reserve = policy.reserve(dependencies, player);
    let spent = 0;
    (0, exports.purchases)(dependencies, knowledge, policy, player).forEach(({ city }) => {
        const price = priceOf(dependencies.playerTreasuryRegistry.getByPlayer(player), city);
        if (price === null) {
            return;
        }
        const [treasury, cost] = price;
        if (treasury.value() - cost < reserve) {
            return;
        }
        treasury.buy(city);
        spent += cost;
    });
    return spent;
};
exports.spendTreasury = spendTreasury;
exports.default = exports.spendTreasury;
//# sourceMappingURL=spendTreasury.js.map