"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildItemInCity = exports.rankWithUnits = exports.rankImprovements = exports.rankScored = exports.leaderWeight = exports.chooseUnit = exports.isFoundingSettlers = exports.isAttacker = exports.defaultProductionPolicy = void 0;
// Civ1: what a city builds next: a defender while it has fewer than it wants or martial law could use another unit,
//  and otherwise what it needs most of one ranking (civ-clone/web-renderer#378): explorers while there's land to
//  explore that they could reach from the city, Settlers while they'd have a city site or a terrain job to go to,
//  attackers while there's a war to fight, a defender for a city of the player's that has none, each scored by how far
//  the player is short of what it wants, against the improvements and Wonders the ruleset's `BuildPriority` scores
//  (civ-clone/web-renderer#194), all weighed by the leader. A Wonder only in the player's most productive city, one at
//  a time; never a Palace or a ship. Apart from a missing defender, each is only started if the city can finish it
//  within the policy's `buildTurns` for its kind, at its net shields; when nothing is left that it can, the cheapest
//  improvement worth having (civ-clone/web-renderer#212). Apart from a missing defender, explorers and Settlers, no
//  unit is started that would leave the city no shields to spare once it has to support it
//  (civ-clone/web-renderer#229).
const BuildWeight_1 = require("@civ-clone/base-leader-personality/Rules/Player/BuildWeight");
const Expansion_1 = require("@civ-clone/base-leader-personality/Rules/Player/Expansion");
const combine_1 = require("@civ-clone/base-leader-personality/lib/combine");
const Yields_1 = require("@civ-clone/core-unit/Yields");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const defence_1 = require("../City/defence");
const Types_1 = require("@civ-clone/library-unit/Types");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const knowledge_1 = require("./knowledge");
const explorers_1 = require("../City/explorers");
const explorers_2 = require("../City/explorers");
const terrain_1 = require("./terrain");
const terrainWork_1 = require("@civ-clone/base-strategy-terrain-work/lib/Unit/terrainWork");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const buildTime_1 = require("../City/buildTime");
const wonders_1 = require("./wonders");
const rankBuildItems_1 = require("@civ-clone/core-city-build/lib/rankBuildItems");
exports.defaultProductionPolicy = {
    attackersPerCity: 1,
    explorers: 3,
    explorersPerCity: 2,
    maxExplorers: 6,
    settlers: 3,
    settlersPerCity: 0.5,
    buildTurns: {
        improvement: 40,
        unit: 10,
        wonder: 100,
    },
    wonderShields: 2,
    needs: {
        army: 0.09,
        attacker: 4,
        explorer: 6,
        fortification: 2,
        reinforcement: 3,
        settlers: 4,
        wonder: 3,
    },
};
// A unit built to attack rather than defend.
const isAttacker = (unit) => unit instanceof Types_1.Land && unit.attack().value() > unit.defence().value();
exports.isAttacker = isAttacker;
// A land unit that can fight and is out of the player's cities: exploring, or on its way to a target.
const isExploring = (dependencies, unit) => unit instanceof Types_1.Land &&
    !(unit instanceof Types_1.Worker) &&
    unit.attack().value() > 0 &&
    dependencies.cityRegistry.getByTile(unit.tile()) === null;
// Whether one of the player's units is Settlers it has for founding cities, and so counts towards the policy's
//  `settlers` (and keeps its home city from building more): all of its Settlers but its terrain workers
//  (civ-clone/web-renderer#234), as many as Civ1's terrain policy wants, the first to take their jobs. Settlers on
//  terrain jobs beyond those still count: they took a job for want of a city site, and leaving them all out had cities
//  build Settlers for jobs alone, which cost players score and shields by turn 300 in the arena.
const isFoundingSettlers = (dependencies, player, unit) => {
    if (!(unit instanceof Units_1.Settlers)) {
        return false;
    }
    const jobs = (0, terrainWork_1.terrainJobs)(dependencies.memoryRegistry.memoryFor(player));
    return (!jobs.has(unit) ||
        ![...jobs.keys()]
            .slice(0, terrain_1.civ1TerrainPolicy.workersWanted(dependencies, player))
            .includes(unit));
};
exports.isFoundingSettlers = isFoundingSettlers;
// Whether Settlers built in `city` would have something to do: a city site on the board they could walk to, or a
//  terrain job there no unit of the player's has claimed. With neither, they'd join a city (`lib/Unit/idleWorker`),
//  which gives back the citizen they cost but not the shields.
const settlersWouldHaveWork = (dependencies, player, targets, city) => {
    const reachable = (0, explorers_2.landReachableFrom)(city.tile());
    return (targets.goodSitesForCities.some((tile) => reachable.has(tile)) ||
        (0, terrainWork_1.hasOpenTerrainJob)(dependencies, player, dependencies.memoryRegistry.memoryFor(player), terrain_1.civ1TerrainPolicy, reachable));
};
// The value of a unit type's `YieldType` (`Attack`, `Defence`) before anything modifies it.
const baseYield = (dependencies, item, YieldType) => {
    const unitYield = new YieldType();
    dependencies.ruleRegistry.process(Yield_1.BaseYield, item, unitYield);
    return unitYield.value();
};
const isLandUnitType = (item) => Object.prototype.isPrototypeOf.call(Types_1.Land, item);
// A unit type built to attack rather than defend, as `isAttacker` judges a unit.
const isAttackerType = (dependencies, item) => isLandUnitType(item) &&
    baseYield(dependencies, item, Yields_1.Attack) >
        baseYield(dependencies, item, Yields_1.Defence);
// A unit type that can explore: a land unit that can fight, not a worker.
const isExplorerType = (dependencies, item) => isLandUnitType(item) &&
    !Object.prototype.isPrototypeOf.call(Types_1.Worker, item) &&
    baseYield(dependencies, item, Yields_1.Attack) > 0;
// How many of the player's units match `isUnit`, and how many more its cities are building that match `isType`, so
//  that cities choosing in the same turn don't all build the last one wanted.
const unitsAndOrders = (dependencies, player, isUnit, isType) => dependencies.unitRegistry.getByPlayer(player).filter(isUnit).length +
    dependencies.cityRegistry
        .getByPlayer(player)
        .filter((city) => {
        const building = dependencies.cityBuildRegistry
            .getByCity(city)
            .building();
        return building !== null && isType(building.item());
    }).length;
// The unit among `buildItems` to build for its `YieldType` (`Attack` for an attacker, `Defence` for a defender), its
//  cost weighed against its strength (civ-clone/web-renderer#212): of the units `city` can finish within the policy's
//  `buildTurns.unit`, the most `YieldType` per shield, then the most `YieldType`, then the cheapest. When it can finish
//  none of them that soon, the one it can finish soonest, then the cheapest, if `orSoonest`; otherwise none. Units with
//  no `YieldType` aren't considered. Obsolete units are never among `buildItems`: the ruleset doesn't offer them.
const chooseUnit = (dependencies, city, buildItems, YieldType, policy = exports.defaultProductionPolicy, orSoonest = false, turnsToBuild = (0, buildTime_1.default)(dependencies, city)) => {
    const candidates = buildItems
        .map((buildItem) => ({
        UnitType: buildItem.item(),
        cost: buildItem.cost().value(),
        strength: baseYield(dependencies, buildItem.item(), YieldType),
        turns: turnsToBuild(buildItem),
    }))
        .filter(({ strength }) => strength > 0), soon = candidates.filter(({ turns }) => (0, buildTime_1.finishesWithin)(turns, policy.buildTurns.unit)), [best] = soon.length > 0 || !orSoonest
        ? soon.sort((a, b) => b.strength / b.cost - a.strength / a.cost ||
            b.strength - a.strength ||
            a.cost - b.cost)
        : candidates.sort((a, b) => (a.turns === b.turns ? 0 : a.turns - b.turns) ||
            a.cost - b.cost ||
            b.strength - a.strength);
    return best === null || best === void 0 ? void 0 : best.UnitType;
};
exports.chooseUnit = chooseUnit;
// Whether `city` should be the one to build the player's next Wonder: none of its cities is building one, and none
//  produces more.
const shouldBuildWonder = (dependencies, player, city) => {
    const cities = dependencies.cityRegistry.getByPlayer(player);
    return (!cities.some((other) => {
        const building = dependencies.cityBuildRegistry
            .getByCity(other)
            .building();
        return (building !== null &&
            Object.prototype.isPrototypeOf.call(Wonder_1.default, building.item()));
    }) &&
        cities.every((other) => (0, buildTime_1.netShields)(other) <= (0, buildTime_1.netShields)(city)));
};
// Improvements only worth building on purpose: the fallback leaves them until last.
const onPurposeOnly = [CityImprovements_1.Barracks, CityImprovements_1.CityWalls];
// The order `buildItemInCity` falls back on, when a city needs nothing it can finish soon: improvements worth having,
//  then units it can support, then Barracks and City Walls, which cost upkeep for nothing in peace, then units it can't.
const fallbackRank = (buildItem, affordable) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item())
    ? affordable
        ? 1
        : 3
    : onPurposeOnly.includes(buildItem.item())
        ? 2
        : 0;
// How much `player`'s leader favours building `buildItem` (`BuildWeight`), 1 for no preference.
const leaderWeight = (dependencies, player) => (buildItem) => (0, combine_1.product)(dependencies.ruleRegistry, BuildWeight_1.default, player, buildItem.item());
exports.leaderWeight = leaderWeight;
// What `city` needs most of `buildItems`, by the ruleset's `BuildPriority` (`rankBuildItems`, as a player's city on
//  Auto ranks them), weighed by the leader's preferences (civ-clone/web-renderer#194).
const rankScored = (dependencies, player, city, buildItems, yields = city.yields()) => (0, rankBuildItems_1.default)(dependencies.cityBuildRegistry.getByCity(city), dependencies.ruleRegistry, () => true, (0, exports.leaderWeight)(dependencies, player), buildItems, yields);
exports.rankScored = rankScored;
const rankImprovements = (dependencies, player, city, buildItems, yields = city.yields()) => (0, exports.rankScored)(dependencies, player, city, buildItems, yields).map(({ buildItem }) => buildItem);
exports.rankImprovements = rankImprovements;
// Not `localeCompare`, which depends on the host's locale, as in `rankBuildItems`.
const compareNames = (a, b) => a < b ? -1 : a > b ? 1 : 0;
// `ranked` together, an item that appears more than once scoring what its entries add up to, highest first, then the
//  cheaper, then by name, as `rankBuildItems` breaks ties. Anything scoring 0 or less is left out.
const rankWithUnits = (ranked) => [
    ...ranked
        .reduce((scores, { buildItem, score }) => {
        var _a, _b;
        const same = (_a = [...scores.keys()].find((other) => other.item() === buildItem.item())) !== null && _a !== void 0 ? _a : buildItem;
        return scores.set(same, ((_b = scores.get(same)) !== null && _b !== void 0 ? _b : 0) + score);
    }, new Map())
        .entries(),
]
    .map(([buildItem, score]) => ({ buildItem, score }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score ||
    a.buildItem.cost().value() - b.buildItem.cost().value() ||
    compareNames(a.buildItem.item().name, b.buildItem.item().name));
exports.rankWithUnits = rankWithUnits;
// Also run from `unitDestroyed`, during combat and so perhaps during another player's turn.
const buildItemInCity = (dependencies, player, targets, city, policy = exports.defaultProductionPolicy, knowledge = knowledge_1.default) => {
    const cityBuild = dependencies.cityBuildRegistry.getByCity(city), available = cityBuild.available(), restrictions = [CityImprovements_1.Palace, Units_1.Settlers], availableFiltered = available.filter((buildItem) => !restrictions.includes(buildItem.item()) &&
        !Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item()) &&
        // Ships are built on purpose, where there's sea to explore, not ranked here.
        !Object.prototype.isPrototypeOf.call(Types_1.Naval, buildItem.item())), availableWonders = available.filter((buildItem) => Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableUnits = availableFiltered.filter((buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item())), yields = city.yields(), shields = (0, buildTime_1.netShields)(city, yields), turnsToBuild = (0, buildTime_1.default)(dependencies, city, shields), isUnitItem = (buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item()), 
    // Whether the city would still have shields to spare once it had another unit to support (civ-clone/web-renderer#229).
    //  Under Monarchy every unit costs a shield, and a city whose units eat all it makes builds nothing else.
    //  Diplomats and Caravans cost no support, so they're always affordable.
    affordable = (buildItem) => !isUnitItem(buildItem) ||
        shields -
            knowledge.unitSupport(dependencies, city, buildItem.item()) >
            0, 
    // The units the city can support another of, for anything but a defender it's missing.
    affordableUnits = availableUnits.filter(affordable), 
    // A defender for this city: the soonest it can, if it can't finish one within the policy's turns.
    getDefensiveUnit = ((UnitType) => () => UnitType ||
        (UnitType = (0, exports.chooseUnit)(dependencies, city, availableUnits, Yields_1.Defence, policy, true, turnsToBuild)))(), 
    // Only a unit that counts as an attacker, so that building one gets the player closer to what it wants.
    getOffensiveUnit = () => (0, exports.chooseUnit)(dependencies, city, affordableUnits.filter((buildItem) => isAttackerType(dependencies, buildItem.item())), Yields_1.Attack, policy, false, turnsToBuild);
    if ((0, defence_1.wantsUnit)(dependencies, knowledge, city) && getDefensiveUnit()) {
        cityBuild.build(getDefensiveUnit());
        return;
    }
    const cityGrowth = dependencies.cityGrowthRegistry.getByCity(cityBuild.city()), cities = dependencies.cityRegistry.getByPlayer(player).length, weight = (0, exports.leaderWeight)(dependencies, player), itemFor = (item) => available.find((buildItem) => buildItem.item() === item), 
    // The units the player is short of, each scored by how short it is: `policy.needs` for one it wants and has none
    //  of, less for each it has or has on order, and weighed by the leader unless `weighed` is false
    //  (civ-clone/web-renderer#378).
    unitNeeds = [], addNeed = (buildItem, need, have, wanted, weighed = true) => {
        if (buildItem === undefined || wanted <= 0 || have >= wanted) {
            return;
        }
        unitNeeds.push({
            buildItem,
            score: ((need * (wanted - have)) / wanted) *
                (weighed ? weight(buildItem) : 1),
        });
    };
    // Explorers count whether they're exploring or not: a unit out of the player's cities with nothing left that it can
    //  reach to explore is still one more than the player needs. And only land a unit from this city could reach counts:
    //  the coast of another continent, seen from a ship or across the water, kept the list from ever emptying.
    if ((0, explorers_1.default)(city, targets.landTilesToExplore) > 0) {
        // The cheapest land unit that can fight, if the city can finish it within the policy's turns, whether or not the city
        //  has shields to spare to support it. With units that have nothing left to do standing down rather than wandering
        //  (civ-clone/web-renderer#230), explorers are what explores, and keeping them to cities with shields to spare cost
        //  players a tenth of what they had explored by turn 300 in the arena.
        const [explorer] = availableUnits
            .filter((buildItem) => isExplorerType(dependencies, buildItem.item()) &&
            (0, buildTime_1.finishesWithin)(turnsToBuild(buildItem), policy.buildTurns.unit))
            .sort((a, b) => a.cost().value() - b.cost().value());
        addNeed(explorer, policy.needs.explorer, unitsAndOrders(dependencies, player, (unit) => isExploring(dependencies, unit), (item) => isExplorerType(dependencies, item)), Math.min(policy.maxExplorers, policy.explorers + policy.explorersPerCity * cities), 
        // Exploring is for every leader, not only those who favour fighting units: weighing explorers by the leader cost
        //  a seventh of the land explored by turn 150 in the arena.
        false);
    }
    // Always Build Cities
    if (!dependencies.unitRegistry
        .getByCity(cityBuild.city())
        .some((unit) => (0, exports.isFoundingSettlers)(dependencies, player, unit)) &&
        cityGrowth.size() > 1 &&
        // With no city site they could walk to and no terrain job, they'd join a city (civ-clone/web-renderer#243).
        settlersWouldHaveWork(dependencies, player, targets, city)) {
        addNeed(itemFor(Units_1.Settlers), policy.needs.settlers, unitsAndOrders(dependencies, player, (unit) => (0, exports.isFoundingSettlers)(dependencies, player, unit), (item) => item === Units_1.Settlers), (0, combine_1.product)(dependencies.ruleRegistry, Expansion_1.default, player) *
            (policy.settlers + Math.floor(policy.settlersPerCity * cities)));
    }
    if (targets.citiesToLiberate.length > 0 ||
        targets.enemyCitiesToAttack.length > 0 ||
        targets.enemyUnitsToAttack.length > 4) {
        addNeed(itemFor(getOffensiveUnit()), policy.needs.attacker, unitsAndOrders(dependencies, player, exports.isAttacker, (item) => isAttackerType(dependencies, item)), policy.attackersPerCity * cities);
    }
    // An army, however peaceful the world.
    addNeed(itemFor(getOffensiveUnit()), policy.needs.army, 0, 1);
    // A defender for another city, only one this city can finish within the policy's turns.
    if (targets.undefendedCities.length > 0) {
        addNeed(itemFor((0, exports.chooseUnit)(dependencies, city, affordableUnits, Yields_1.Defence, policy, false, turnsToBuild)), policy.needs.reinforcement, 0, 1);
    }
    // One Wonder at a time, in the city that makes the most shields, and only one that would do something for the player
    //  that the city makes enough shields to finish within the policy's turns.
    const wonders = shields >= policy.wonderShields &&
        shouldBuildWonder(dependencies, player, city)
        ? availableWonders.filter((buildItem) => (0, buildTime_1.finishesWithin)(turnsToBuild(buildItem), policy.buildTurns.wonder) &&
            (0, wonders_1.default)(dependencies, player, buildItem.item()))
        : [];
    // What the city needs most, the units above against the improvements and Wonders it needs by the ruleset's
    //  `BuildPriority`, as a player's city on Auto ranks them (civ-clone/web-renderer#194), all weighed by the leader
    //  (civ-clone/web-renderer#378). Barracks and City Walls are among the improvements it could need, but are only
    //  needed at war.
    const [needed] = (0, exports.rankWithUnits)([
        ...unitNeeds,
        ...(0, exports.rankScored)(dependencies, player, city, [
            ...availableFiltered.filter((buildItem) => !isUnitItem(buildItem) &&
                (0, buildTime_1.finishesWithin)(turnsToBuild(buildItem), policy.buildTurns.improvement)),
        ], yields).map(({ buildItem, score }) => ({
            buildItem,
            score: onPurposeOnly.includes(buildItem.item())
                ? Math.min(score, policy.needs.fortification)
                : score,
        })),
        ...(0, exports.rankScored)(dependencies, player, city, wonders, yields),
        ...wonders.map((buildItem) => ({
            buildItem,
            score: policy.needs.wonder * weight(buildItem),
        })),
    ]);
    if (needed) {
        cityBuild.build(needed.buildItem.item());
        return;
    }
    // Nothing it needs that it can finish soon, so the cheapest thing worth having once it can (`fallbackRank`).
    const [cheapest] = [...availableFiltered].sort((a, b) => fallbackRank(a, affordable(a)) - fallbackRank(b, affordable(b)) ||
        a.cost().value() - b.cost().value());
    if (cheapest) {
        cityBuild.build(cheapest.item());
    }
};
exports.buildItemInCity = buildItemInCity;
exports.default = exports.buildItemInCity;
//# sourceMappingURL=buildItemInCity.js.map