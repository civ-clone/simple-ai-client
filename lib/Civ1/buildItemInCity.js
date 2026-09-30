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
        !Object.prototype.isPrototypeOf.call(Types_1.Naval, buildItem.item())), availableWonders = available.filter((buildItem) => Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableUnits = availableFiltered.filter((buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item())), randomSelection = availableFiltered[Math.floor(availableFiltered.length * dependencies.randomNumberGenerator())].item(), baseYield = (buildItem, YieldType) => {
        const unitYield = new YieldType();
        dependencies.ruleRegistry.process(Yield_1.BaseYield, buildItem.item(), unitYield);
        return unitYield;
    }, getUnitByYield = (YieldType) => {
        const [[UnitType]] = availableUnits
            .map((buildItem) => [
            buildItem.item(),
            baseYield(buildItem, YieldType),
        ])
            .sort(([, unitYieldA], [, unitYieldB]) => unitYieldB.value() - unitYieldA.value());
        return UnitType;
    }, getDefensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Defence)))(), getOffensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Attack)))();
    if ((0, defence_1.defendersIn)(dependencies, city).length <
        (0, defence_1.defendersWanted)(dependencies, city) &&
        getDefensiveUnit()) {
        cityBuild.build(getDefensiveUnit());
        return;
    }
    const cityGrowth = dependencies.cityGrowthRegistry.getByCity(cityBuild.city()), cities = dependencies.cityRegistry.getByPlayer(player).length;
    if (targets.landTilesToExplore.length > 0 &&
        dependencies.unitRegistry
            .getByPlayer(player)
            .filter((unit) => isExploring(dependencies, unit)).length <
            policy.explorers + policy.explorersPerCity * cities) {
        // The cheapest land unit that can fight.
        const [explorer] = availableUnits
            .filter((buildItem) => Object.prototype.isPrototypeOf.call(Types_1.Land, buildItem.item()) &&
            baseYield(buildItem, Yields_1.Attack).value() > 0)
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
    if ((targets.citiesToLiberate.length > 0 ||
        targets.enemyCitiesToAttack.length > 0 ||
        targets.enemyUnitsToAttack.length > 4) &&
        dependencies.unitRegistry.getByPlayer(player).filter(exports.isAttacker).length <
            policy.attackersPerCity * cities) {
        cityBuild.build(getOffensiveUnit());
        return;
    }
    if (targets.undefendedCities.length) {
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