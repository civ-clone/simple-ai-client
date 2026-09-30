"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildItemInCity = exports.isAttacker = exports.defaultProductionPolicy = void 0;
// Civ1: what a city builds next: a defender while it has fewer than it wants, explorers while there's land to explore
//  and the player has fewer out than it wants, Settlers, attackers while there's a war to fight and the player has
//  fewer than it wants, a defender for a city of the player's that has none, a Wonder in the player's most productive
//  city, and otherwise a random pick of the rest, never a Palace or a ship.
const Yields_1 = require("@civ-clone/core-unit/Yields");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const defence_1 = require("../City/defence");
const Types_1 = require("@civ-clone/library-unit/Types");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Yields_2 = require("@civ-clone/civ1-world/Yields");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
exports.defaultProductionPolicy = {
    attackersPerCity: 1,
    explorers: 3,
    explorersPerCity: 2,
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
const production = (city) => (0, reduceYields_1.reduceYield)(city.yields(), Yields_2.Production);
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
        cities.every((other) => production(other) <= production(city)));
};
// Also run from `unitDestroyed`, during combat and so perhaps during another player's turn. It draws from the random
//  number generator on every call, whether or not the draw is used.
const buildItemInCity = (dependencies, player, targets, city, policy = exports.defaultProductionPolicy) => {
    const cityBuild = dependencies.cityBuildRegistry.getByCity(city), available = cityBuild.available(), restrictions = [CityImprovements_1.Palace, Units_1.Settlers], availableFiltered = available.filter((buildItem) => !restrictions.includes(buildItem.item()) &&
        !Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item()) &&
        // Ships are built on purpose, where there's sea to explore, not picked at random.
        !Object.prototype.isPrototypeOf.call(Types_1.Naval, buildItem.item())), availableWonders = available.filter((buildItem) => Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableUnits = availableFiltered.filter((buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item())), randomSelection = availableFiltered[Math.floor(availableFiltered.length * dependencies.randomNumberGenerator())].item(), 
    // The unit among `buildItems` with the most `YieldType`, if any.
    getUnitByYield = (YieldType, buildItems = availableUnits) => {
        const [[UnitType] = []] = buildItems
            .map((buildItem) => [
            buildItem.item(),
            baseYield(dependencies, buildItem.item(), YieldType),
        ])
            .sort(([, a], [, b]) => b - a);
        return UnitType;
    }, getDefensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Defence)))(), 
    // Only a unit that counts as an attacker, so that building one gets the player closer to what it wants.
    getOffensiveUnit = () => getUnitByYield(Yields_1.Attack, availableUnits.filter((buildItem) => isAttackerType(dependencies, buildItem.item())));
    if ((0, defence_1.defendersIn)(dependencies, city).length <
        (0, defence_1.defendersWanted)(dependencies, city) &&
        getDefensiveUnit()) {
        cityBuild.build(getDefensiveUnit());
        return;
    }
    const cityGrowth = dependencies.cityGrowthRegistry.getByCity(cityBuild.city()), cities = dependencies.cityRegistry.getByPlayer(player).length;
    if (targets.landTilesToExplore.length > 0 &&
        unitsAndOrders(dependencies, player, (unit) => isExploring(dependencies, unit), (item) => isExplorerType(dependencies, item)) <
            policy.explorers + policy.explorersPerCity * cities) {
        // The cheapest land unit that can fight.
        const [explorer] = availableUnits
            .filter((buildItem) => isExplorerType(dependencies, buildItem.item()))
            .sort((a, b) => a.cost().value() - b.cost().value());
        if (explorer) {
            cityBuild.build(explorer.item());
            return;
        }
    }
    // Always Build Cities
    if (available.some((buildItem) => buildItem.item() === Units_1.Settlers) &&
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
    if (targets.undefendedCities.length && getDefensiveUnit()) {
        cityBuild.build(getDefensiveUnit());
        return;
    }
    // One Wonder at a time, in the city that can build it soonest. (This used to need a single Production yield over 4,
    //  but a city's yields come one per tile and unit, so no city ever had one.)
    if (availableWonders.length > 0 &&
        shouldBuildWonder(dependencies, player, city)) {
        const wonders = availableWonders.map((cityBuild) => cityBuild.item());
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