"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildItemInCity = exports.chooseUnit = exports.isAttacker = exports.defaultProductionPolicy = void 0;
// Civ1: what a city builds next: a defender while it has fewer than it wants or martial law could use another unit, explorers while there's land to explore
//  and the player has fewer out than it wants, Settlers, attackers while there's a war to fight and the player has
//  fewer than it wants, a defender for a city of the player's that has none, a Wonder in the player's most productive
//  city, and otherwise a random pick of the rest, never a Palace or a ship.
const Yields_1 = require("@civ-clone/core-unit/Yields");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const defence_1 = require("../City/defence");
const Types_1 = require("@civ-clone/library-unit/Types");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const knowledge_1 = require("./knowledge");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const buildTime_1 = require("../City/buildTime");
const wonders_1 = require("./wonders");
exports.defaultProductionPolicy = {
    attackersPerCity: 1,
    explorers: 3,
    explorersPerCity: 2,
    buildTurns: {
        settlers: 20,
        unit: 10,
        wonder: 40,
    },
    wonderShields: 5,
};
// A unit built to attack rather than defend.
const isAttacker = (unit) => unit instanceof Types_1.Land && unit.attack().value() > unit.defence().value();
exports.isAttacker = isAttacker;
// A land unit that can fight and is out of the player's cities: exploring, or on its way to a target.
const isExploring = (dependencies, unit) => unit instanceof Types_1.Land &&
    !(unit instanceof Types_1.Worker) &&
    unit.attack().value() > 0 &&
    dependencies.cityRegistry.getByTile(unit.tile()) === null;
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
        .filter(({ strength }) => strength > 0), soon = candidates.filter(({ turns }) => turns <= policy.buildTurns.unit), [best] = soon.length > 0 || !orSoonest
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
// Also run from `unitDestroyed`, during combat and so perhaps during another player's turn. It draws from the random
//  number generator on every call, whether or not the draw is used.
const buildItemInCity = (dependencies, player, targets, city, policy = exports.defaultProductionPolicy, knowledge = knowledge_1.default) => {
    const cityBuild = dependencies.cityBuildRegistry.getByCity(city), available = cityBuild.available(), restrictions = [CityImprovements_1.Palace, Units_1.Settlers], availableFiltered = available.filter((buildItem) => !restrictions.includes(buildItem.item()) &&
        !Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item()) &&
        // Ships are built on purpose, where there's sea to explore, not picked at random.
        !Object.prototype.isPrototypeOf.call(Types_1.Naval, buildItem.item())), availableWonders = available.filter((buildItem) => Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableUnits = availableFiltered.filter((buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item())), randomSelection = availableFiltered[Math.floor(availableFiltered.length * dependencies.randomNumberGenerator())].item(), shields = (0, buildTime_1.netShields)(city), turnsToBuild = (0, buildTime_1.default)(dependencies, city, shields), 
    // A defender for this city: the soonest it can, if it can't finish one within the policy's turns.
    getDefensiveUnit = ((UnitType) => () => UnitType ||
        (UnitType = (0, exports.chooseUnit)(dependencies, city, availableUnits, Yields_1.Defence, policy, true, turnsToBuild)))(), 
    // Only a unit that counts as an attacker, so that building one gets the player closer to what it wants.
    getOffensiveUnit = () => (0, exports.chooseUnit)(dependencies, city, availableUnits.filter((buildItem) => isAttackerType(dependencies, buildItem.item())), Yields_1.Attack, policy, false, turnsToBuild);
    if ((0, defence_1.wantsUnit)(dependencies, knowledge, city) && getDefensiveUnit()) {
        cityBuild.build(getDefensiveUnit());
        return;
    }
    const cityGrowth = dependencies.cityGrowthRegistry.getByCity(cityBuild.city()), cities = dependencies.cityRegistry.getByPlayer(player).length;
    if (targets.landTilesToExplore.length > 0 &&
        unitsAndOrders(dependencies, player, (unit) => isExploring(dependencies, unit), (item) => isExplorerType(dependencies, item)) <
            policy.explorers + policy.explorersPerCity * cities) {
        // The cheapest land unit that can fight, if the city can finish it within the policy's turns.
        const [explorer] = availableUnits
            .filter((buildItem) => isExplorerType(dependencies, buildItem.item()) &&
            turnsToBuild(buildItem) <= policy.buildTurns.unit)
            .sort((a, b) => a.cost().value() - b.cost().value());
        if (explorer) {
            cityBuild.build(explorer.item());
            return;
        }
    }
    // Always Build Cities, with Settlers the city can finish within the policy's turns.
    if (available.some((buildItem) => buildItem.item() === Units_1.Settlers &&
        turnsToBuild(buildItem) <= policy.buildTurns.settlers) &&
        !dependencies.unitRegistry
            .getByCity(cityBuild.city())
            .some((unit) => unit instanceof Units_1.Settlers) &&
        // TODO: use expansionist leader trait
        dependencies.unitRegistry
            .getByPlayer(player)
            .filter((unit) => unit instanceof Units_1.Settlers).length < 3 &&
        cityGrowth.size() > 1) {
        cityBuild.build(Units_1.Settlers);
        return;
    }
    const offensiveUnit = getOffensiveUnit();
    if (offensiveUnit &&
        (targets.citiesToLiberate.length > 0 ||
            targets.enemyCitiesToAttack.length > 0 ||
            targets.enemyUnitsToAttack.length > 4) &&
        unitsAndOrders(dependencies, player, exports.isAttacker, (item) => isAttackerType(dependencies, item)) <
            policy.attackersPerCity * cities) {
        cityBuild.build(offensiveUnit);
        return;
    }
    // A defender for another city, only one this city can finish within the policy's turns.
    const reinforcement = targets.undefendedCities.length > 0
        ? (0, exports.chooseUnit)(dependencies, city, availableUnits, Yields_1.Defence, policy, false, turnsToBuild)
        : undefined;
    if (reinforcement) {
        cityBuild.build(reinforcement);
        return;
    }
    // One Wonder at a time, in the city that can build it soonest, and only one that would do something for the player
    //  that the city makes enough shields to finish within the policy's turns.
    const usefulWonders = availableWonders.filter((buildItem) => turnsToBuild(buildItem) <= policy.buildTurns.wonder &&
        (0, wonders_1.default)(dependencies, player, buildItem.item()));
    if (usefulWonders.length > 0 &&
        shields >= policy.wonderShields &&
        shouldBuildWonder(dependencies, player, city)) {
        const wonders = usefulWonders.map((cityBuild) => cityBuild.item());
        cityBuild.build(wonders[Math.floor(dependencies.randomNumberGenerator() * wonders.length)]);
        return;
    }
    if (randomSelection) {
        cityBuild.build(randomSelection);
    }
};
exports.buildItemInCity = buildItemInCity;
exports.default = exports.buildItemInCity;
//# sourceMappingURL=buildItemInCity.js.map