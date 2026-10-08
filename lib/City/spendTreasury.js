"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spendTreasury = exports.purchases = void 0;
const CityImprovement_1 = require("@civ-clone/core-city-improvement/CityImprovement");
const Types_1 = require("@civ-clone/library-unit/Types");
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
        if (((0, defence_1.wantsDefender)(dependencies, city) &&
            (0, defence_1.isDefenderType)(dependencies, item)) ||
            ((0, defence_1.wantsMartialLawUnit)(dependencies, knowledge, city, yields) &&
                knowledge.martialLaw.wouldUse(dependencies, item))) {
            return 'defender';
        }
        return isA(Types_1.Worker, item) &&
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