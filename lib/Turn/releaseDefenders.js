"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseDefenders = void 0;
// Generic: a city with more fortified defenders than it keeps lets one go now and then, for `StandDown` to send where
//  it's needed (civ-clone/web-renderer#423). v474.05 clears each defender's fortified status one turn in eight, staggered
//  by unit (`AIEngine.cs` ~L925, `(unitID + turn) & 7`), and the unit fortifies again if its city still needs it. Here
//  a city considers it one turn in eight, staggered by city, and releases only a defender it can spare: the weakest,
//  and not one that martial law needs to keep order.
const defence_1 = require("../City/defence");
const UnitImprovements_1 = require("@civ-clone/library-unit/UnitImprovements");
const activate_1 = require("../Unit/activate");
// A stable number for `city`, to stagger the turns it considers letting a defender go.
const staggerOf = (city) => [...city.id()].reduce((total, character) => total + character.charCodeAt(0), 0);
const releaseDefenders = (dependencies, player, knowledge) => {
    const turn = dependencies.turn.value(), fortified = (unit) => dependencies.unitImprovementRegistry
        .getByUnit(unit)
        .some((improvement) => improvement instanceof UnitImprovements_1.Fortified);
    dependencies.cityRegistry.getByPlayer(player).forEach((city) => {
        const defenders = (0, defence_1.defendersIn)(dependencies, city), spare = defenders.length - (0, defence_1.defendersKept)(dependencies, knowledge, city);
        if (spare <= 0 || (staggerOf(city) + turn) % 8 !== 0) {
            return;
        }
        const [released] = defenders
            .filter((unit) => unit.player() === player &&
            fortified(unit) &&
            !(0, defence_1.keepsOrder)(dependencies, knowledge, city, unit))
            .sort((a, b) => a.defence().value() - b.defence().value());
        if (released) {
            (0, activate_1.default)(released);
        }
    });
};
exports.releaseDefenders = releaseDefenders;
exports.default = exports.releaseDefenders;
//# sourceMappingURL=releaseDefenders.js.map