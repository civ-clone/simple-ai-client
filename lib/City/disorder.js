"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preventDisorder = exports.calmCities = exports.hurry = exports.buildToCalm = exports.calmCity = exports.releaseEntertainers = exports.leastValuableWorkedTiles = exports.willGrow = exports.inDisorder = void 0;
// Generic: keeps the player's cities out of civil disorder before its turn ends (civ-clone/web-renderer#156), rather
//  than reacting once the engine has found them in it. The ruleset's own `CivilDisorder` rules say whether a city is in
//  disorder: this only changes what the city's citizens do and what it builds, and asks those rules again after each
//  change.
//
// It runs once the player's units have moved (`AfterTurn`), because where they stand changes how unhappy a city is:
//  martial law, units away from home. Nothing between then and the engine's own check at the player's next turn start
//  puts the Entertainers back to work. `assignWorkers` (run by `reviewCities`, and by the engine's `TileReassigned` and
//  growth rules) only places citizens who have no job, and a city that shrinks loses its specialists first. So a city
//  calmed here is still calm when the engine checks, unless something else changes first: an enemy stands on a tile
//  it works, or it loses a unit. A city that will grow at that turn start is calmed for the size it will be.
const Yields_1 = require("@civ-clone/library-city/Yields");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Yield_1 = require("@civ-clone/core-yield/Yield");
const assignWorkers_1 = require("@civ-clone/library-city/lib/assignWorkers");
const foodBalance = (city) => (0, reduceYields_1.reduceYield)(city.yields(), Yields_1.Food);
// Whether the ruleset's rules find `city` in civil disorder as it stands, or, given `extraUnhappiness`, with that many
//  more unhappy citizens. Those take the place of content (or failing that, happy) citizens rather than adding to them,
//  which can only make disorder likelier, so this errs on the side of an Entertainer too many.
const inDisorder = (dependencies, city, extraUnhappiness = 0) => {
    const yields = city.yields();
    if (extraUnhappiness > 0) {
        yields.push(new Yields_1.Unhappiness(extraUnhappiness));
    }
    return dependencies.ruleRegistry
        .process(CivilDisorder_1.default, city, yields)
        .some((result) => result);
};
exports.inDisorder = inDisorder;
// Whether `city` will grow at the player's next turn start, with the food it has now.
const willGrow = (dependencies, city) => {
    const cityGrowth = dependencies.cityGrowthRegistry.getByCity(city);
    return (cityGrowth.progress().value() + foodBalance(city) >=
        cityGrowth.cost().value());
};
exports.willGrow = willGrow;
// Whether `city` is in disorder as it stands (`now`), or will be once it grows at the next turn start (`growth`).
const disorderRisk = (dependencies, policy, city) => {
    if ((0, exports.inDisorder)(dependencies, city)) {
        return 'now';
    }
    if (!(0, exports.willGrow)(dependencies, city)) {
        return null;
    }
    const unhappiness = policy.unhappinessOnGrowth(dependencies, city);
    return unhappiness > 0 && (0, exports.inDisorder)(dependencies, city, unhappiness)
        ? 'growth'
        : null;
};
// The tiles `city` works, other than its centre, in the order their citizens are made Entertainers: the least food
//  first, then the fewest shields, then the least trade, so the city keeps as much food as it can. Ties keep the order
//  the tiles were taken in.
const leastValuableWorkedTiles = (dependencies, city) => dependencies.workedTileRegistry
    .getByCity(city)
    .map((workedTile) => workedTile.tile())
    .filter((tile) => tile !== city.tile())
    .map((tile) => [
    tile,
    (0, reduceYields_1.reduceYields)(tile.yields(city.player()), Yields_1.Food, Yields_1.Production, Yields_1.Trade),
])
    .sort(([, a], [, b]) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
    .map(([tile]) => tile);
exports.leastValuableWorkedTiles = leastValuableWorkedTiles;
// Puts `city`'s Entertainers, the ruleset's first kind of specialist (what a citizen becomes when taken off a tile),
//  back to work on the best tiles free, as `assignWorkers` places any citizen without a job. A citizen with no tile to
//  work becomes one again. Other kinds of specialist are left as they are.
const releaseEntertainers = (dependencies, knowledge, city) => {
    const [DefaultType] = dependencies.availableSpecialistRegistry.entries();
    if (!DefaultType) {
        return;
    }
    const entertainers = dependencies.specialistRegistry
        .getByCity(city)
        .filter((specialist) => specialist instanceof DefaultType);
    if (entertainers.length === 0) {
        return;
    }
    dependencies.specialistRegistry.unregister(...entertainers);
    knowledge.assignWorkers(dependencies, city);
};
exports.releaseEntertainers = releaseEntertainers;
// Takes `tile`'s citizen off it to be an Entertainer, or puts an Entertainer back on it, as a player clicking the tile
//  on the city map does.
const toggleTile = (dependencies, city, tile) => (0, assignWorkers_1.changeWorkedTile)(city, tile, dependencies.playerWorldRegistry, dependencies.cityGrowthRegistry, dependencies.workedTileRegistry, dependencies.specialistRegistry, dependencies.availableSpecialistRegistry);
// Starts from `city` with every Entertainer back at work, then makes Entertainers from its least valuable worked tiles
//  (`leastValuableWorkedTiles`), one at a time, until the ruleset's rules find it calm, both as it is and, if it will
//  grow, at its new size. Returns `null` once it's calm, or why it couldn't be calmed (`UncalmedReason`).
//
// An Entertainer that would leave the city short of food isn't made, and none after it: the tiles that follow give at
//  least as much food. Short of food means a deficit, even one the food store would cover for a turn (that's where
//  civ-clone/web-renderer#154's luxury rate comes in). An Entertainer the city only needs at its new size isn't made
//  if it would stop the city growing either. An Entertainer taken from a tile that gives no food is always made.
//
// A city that can't be calmed keeps the Entertainers that keep it calm as it stands, if any do, and otherwise has them
//  all put back to work: they'd cost it food and shields and leave it in disorder all the same.
const calmCity = (dependencies, knowledge, city, policy) => {
    (0, exports.releaseEntertainers)(dependencies, knowledge, city);
    let risk = disorderRisk(dependencies, policy, city);
    if (risk === null) {
        return null;
    }
    const taken = [];
    // How many of `taken` keep the city calm as it stands, once that's known.
    let calmAsItStands = risk === 'growth' ? 0 : null, reason = 'tiles';
    for (const tile of (0, exports.leastValuableWorkedTiles)(dependencies, city)) {
        const before = foodBalance(city);
        toggleTile(dependencies, city, tile);
        const after = foodBalance(city), lessFood = after < before;
        if (lessFood && after < 0) {
            reason = 'food';
        }
        else if (lessFood && risk === 'growth' && !(0, exports.willGrow)(dependencies, city)) {
            reason = 'growth';
        }
        else {
            taken.push(tile);
            risk = disorderRisk(dependencies, policy, city);
            if (risk === null) {
                return null;
            }
            if (risk === 'growth' && calmAsItStands === null) {
                calmAsItStands = taken.length;
            }
            continue;
        }
        toggleTile(dependencies, city, tile);
        break;
    }
    if (calmAsItStands === null) {
        (0, exports.releaseEntertainers)(dependencies, knowledge, city);
        return reason;
    }
    taken
        .slice(calmAsItStands)
        .forEach((tile) => toggleTile(dependencies, city, tile));
    return reason;
};
exports.calmCity = calmCity;
// For a city that started the turn in disorder: builds the first of `improvements` it can (one it has already isn't
//  available), unless it's building one of them already. It doesn't switch when it has more shields in hand than the
//  improvement costs, since the rest would be thrown away when it's finished. Returns what the city is building to calm
//  itself, or `null`.
const buildToCalm = (dependencies, city, improvements) => {
    const cityBuild = dependencies.cityBuildRegistry.getByCity(city), building = cityBuild.building();
    if (building !== null && improvements.includes(building.item())) {
        return building.item();
    }
    const available = cityBuild.available(), [buildItem] = improvements
        .map((improvement) => available.find((buildItem) => buildItem.item() === improvement))
        .filter((buildItem) => buildItem !== undefined);
    if (!buildItem || cityBuild.progress().value() > buildItem.cost().value()) {
        return null;
    }
    cityBuild.build(buildItem.item());
    return buildItem.item();
};
exports.buildToCalm = buildToCalm;
// Spends up to `share` of the player's treasury on what `city` is building: the whole of it, through the treasury, if
//  the ruleset's price is within that, or otherwise as many shields as that buys at the same price per shield. That's
//  exact for an improvement, whose price is the same for each shield left. Returns what it spent.
const hurry = (dependencies, player, city, share) => {
    const cityBuild = dependencies.cityBuildRegistry.getByCity(city), remaining = cityBuild.remaining();
    if (cityBuild.building() === null || !(remaining > 0)) {
        return 0;
    }
    for (const treasury of dependencies.playerTreasuryRegistry.getByPlayer(player)) {
        const [spendCost] = treasury
            .cost(city)
            .filter((spendCost) => spendCost.resource() === treasury.yield());
        if (!spendCost) {
            continue;
        }
        const budget = Math.floor(treasury.value() * share), price = spendCost.value();
        if (price <= budget) {
            treasury.buy(city);
            return price;
        }
        const shields = Math.floor((budget * remaining) / price), cost = Math.ceil((shields * price) / remaining);
        if (shields < 1) {
            return 0;
        }
        cityBuild.add(new Yield_1.default(shields));
        treasury.subtract(cost);
        return cost;
    }
    return 0;
};
exports.hurry = hurry;
// Calms each of the player's cities again (`calmCity`), after something that changes how happy they all are at once,
//  such as the luxury rate. Unlike `preventDisorder`, it doesn't switch production or buy anything: that was done
//  already. Notes the cities left in disorder in `memory` afresh.
const calmCities = (dependencies, player, memory, knowledge, policy) => {
    memory.uncalmedCities.clear();
    dependencies.cityRegistry.getByPlayer(player).forEach((city) => {
        const reason = (0, exports.calmCity)(dependencies, knowledge, city, policy);
        if (reason !== null) {
            memory.uncalmedCities.set(city, reason);
        }
    });
};
exports.calmCities = calmCities;
// The whole pass over the player's cities, at the end of its turn. Notes in `memory` the cities left in disorder, and
//  why, for whatever can calm them another way (civ-clone/web-renderer#154's luxury rate).
const preventDisorder = (dependencies, player, memory, knowledge, policy) => {
    memory.uncalmedCities.clear();
    dependencies.cityRegistry.getByPlayer(player).forEach((city) => {
        if (policy.wasInDisorder(dependencies, city) &&
            (0, exports.buildToCalm)(dependencies, city, policy.calmingImprovements) !== null) {
            (0, exports.hurry)(dependencies, player, city, policy.purchaseShare);
        }
        const reason = (0, exports.calmCity)(dependencies, knowledge, city, policy);
        if (reason !== null) {
            memory.uncalmedCities.set(city, reason);
        }
    });
};
exports.preventDisorder = preventDisorder;
exports.default = exports.preventDisorder;
//# sourceMappingURL=disorder.js.map