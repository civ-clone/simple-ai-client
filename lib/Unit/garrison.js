"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.garrison = void 0;
const defence_1 = require("../City/defence");
const UnitImprovements_1 = require("@civ-clone/library-unit/UnitImprovements");
// Returns whether the unit fortified. `tileUnits` is what was on `tile` when the unit's turn began.
const garrison = (dependencies, unit, tile, tileUnits, fortify, knowledge) => {
    // TODO: check for defence values and activate weaker for disband/upgrade/scouting
    const [cityUnitWithLowerDefence] = tileUnits.filter((tileUnit) => dependencies.unitImprovementRegistry
        .getByUnit(tileUnit)
        .some((improvement) => improvement instanceof UnitImprovements_1.Fortified) && unit.defence().value() > tileUnit.defence().value()), city = dependencies.cityRegistry.getByTile(tile);
    if (fortify &&
        city &&
        (cityUnitWithLowerDefence ||
            tileUnits.filter(defence_1.isDefender).length <=
                (0, defence_1.defendersWanted)(dependencies, city) ||
            (0, defence_1.keepsOrder)(dependencies, knowledge, city, unit))) {
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