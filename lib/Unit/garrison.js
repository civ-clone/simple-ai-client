"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.garrison = void 0;
const UnitImprovements_1 = require("@civ-clone/library-unit/UnitImprovements");
// Returns whether the unit fortified. `tileUnits` is what was on `tile` when the unit's turn began.
const garrison = (dependencies, unit, tile, tileUnits, fortify) => {
    // TODO: check for defence values and activate weaker for disband/upgrade/scouting
    const [cityUnitWithLowerDefence] = tileUnits.filter((tileUnit) => dependencies.unitImprovementRegistry
        .getByUnit(tileUnit)
        .some((improvement) => improvement instanceof UnitImprovements_1.Fortified) &&
        // TODO: compares the `Yield`s, not their values, so it's never true. Kept: #153 changes no play.
        unit.defence() > tileUnit.defence()), city = dependencies.cityRegistry.getByTile(tile);
    if (fortify &&
        city &&
        (cityUnitWithLowerDefence ||
            tileUnits.length <=
                Math.ceil(dependencies.cityGrowthRegistry.getByCity(city).size() / 5))) {
        unit.action(fortify);
        if (cityUnitWithLowerDefence) {
            cityUnitWithLowerDefence.activate();
        }
        return true;
    }
    return false;
};
exports.garrison = garrison;
exports.default = exports.garrison;
//# sourceMappingURL=garrison.js.map