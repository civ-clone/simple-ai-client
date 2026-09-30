"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildItemInCity = void 0;
// Civ1: what a city builds next: defenders first, then Settlers, attackers when there's a war to fight, and otherwise
//  a random pick of what's available, never a Palace.
const Yields_1 = require("@civ-clone/core-unit/Yields");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const UnitImprovements_1 = require("@civ-clone/civ1-unit/UnitImprovements");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const Yields_2 = require("@civ-clone/civ1-world/Yields");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
// Also run from `unitDestroyed`, during combat and so perhaps during another player's turn. It draws from the random
//  number generator on every call, whether or not the draw is used.
const buildItemInCity = (dependencies, player, targets, city) => {
    const tile = city.tile(), cityBuild = dependencies.cityBuildRegistry.getByCity(city), tileUnits = dependencies.unitRegistry.getByTile(tile), available = cityBuild.available(), restrictions = [CityImprovements_1.Palace, Units_1.Settlers], availableFiltered = available.filter((buildItem) => !restrictions.includes(buildItem.item()) &&
        // TODO: Add auto-wonders or have more logic around this
        !Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableWonders = available.filter((buildItem) => Object.prototype.isPrototypeOf.call(Wonder_1.default, buildItem.item())), availableUnits = availableFiltered.filter((buildItem) => Object.prototype.isPrototypeOf.call(Unit_1.default, buildItem.item())), randomSelection = availableFiltered[Math.floor(availableFiltered.length * dependencies.randomNumberGenerator())].item(), getUnitByYield = (YieldType) => {
        const [[UnitType]] = availableUnits
            .map((buildItem) => {
            const UnitType = buildItem.item(), unitYield = new YieldType();
            dependencies.ruleRegistry.process(Yield_1.BaseYield, UnitType, unitYield);
            return [UnitType, unitYield];
        })
            .sort(([, unitYieldA], [, unitYieldB]) => unitYieldB.value() - unitYieldA.value());
        return UnitType;
    }, getDefensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Defence)))(), getOffensiveUnit = ((UnitType) => () => UnitType || (UnitType = getUnitByYield(Yields_1.Attack)))();
    if (dependencies.unitRegistry.getByTile(tile).length < 2 &&
        getDefensiveUnit()) {
        cityBuild.build(getDefensiveUnit());
        return;
    }
    const cityGrowth = dependencies.cityGrowthRegistry.getByCity(cityBuild.city());
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
    if (targets.citiesToLiberate.length > 0 ||
        targets.enemyCitiesToAttack.length > 0 ||
        targets.enemyUnitsToAttack.length > 4) {
        cityBuild.build(getOffensiveUnit());
        return;
    }
    if (
    // TODO: the inner `filter` returns an array, which is always truthy, so this counts every unit on the tile. Kept:
    //  #153 changes no play.
    tileUnits.filter((unit) => dependencies.unitImprovementRegistry
        .getByUnit(unit)
        .filter((improvement) => improvement instanceof UnitImprovements_1.Fortified)).length < 2 ||
        targets.undefendedCities.length) {
        cityBuild.build(getDefensiveUnit());
        return;
    }
    // If we have resources to burn, build a wonder
    if (cityBuild
        .city()
        .yields()
        .filter((cityYield) => cityYield instanceof Yields_2.Production)
        .some((cityYield) => cityYield.value() > 4)) {
        const wonders = availableWonders.map((cityBuild) => cityBuild.item());
        cityBuild.build(wonders[Math.floor(dependencies.randomNumberGenerator() * wonders.length)]);
    }
    // TODO: replaces the Wonder chosen above, so this never builds one. Kept: #153 changes no play.
    if (randomSelection) {
        cityBuild.build(randomSelection);
    }
};
exports.buildItemInCity = buildItemInCity;
exports.default = exports.buildItemInCity;
//# sourceMappingURL=buildItemInCity.js.map