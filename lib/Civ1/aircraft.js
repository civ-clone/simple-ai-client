"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aircraftCanReturn = exports.aircraftFuel = void 0;
// Civ1: aircraft fuel, from Civ1's aircraft ranges, and whether an aircraft could still get home after an action.
const turnEnd_1 = require("@civ-clone/civ1-unit/Rules/Player/turnEnd");
const Units_1 = require("@civ-clone/civ1-unit/Units");
const Actions_1 = require("@civ-clone/civ1-unit/Actions");
const carriersFor_1 = require("../Unit/carriersFor");
const movesBetween_1 = require("../movesBetween");
// How many more moves an aircraft can make before it must be back in one of our `City`s or `Carrier`s, or `null` for
//  any other `Unit`.
const aircraftFuel = (dependencies, unit) => {
    var _a, _b, _c;
    const [, range] = (_a = turnEnd_1.aircraftRange.find(([UnitType]) => unit instanceof UnitType)) !== null && _a !== void 0 ? _a : [];
    if (range === undefined) {
        return null;
    }
    const turnsAloft = (_c = (_b = dependencies.strategyNoteRegistry
        .getByKey((0, turnEnd_1.turnsAloftKey)(unit))) === null || _b === void 0 ? void 0 : _b.value()) !== null && _c !== void 0 ? _c : 0;
    return (unit.moves().value() +
        Math.max(0, range - turnsAloft - 1) * unit.movement().value());
};
exports.aircraftFuel = aircraftFuel;
// Whether an aircraft can still get home after taking `action`: moving costs 1 and a `Fighter` pays 1 to attack from
//  where it is, but a `Bomber`'s attack ends its turn wherever it is.
const aircraftCanReturn = (dependencies, player, unit, action) => {
    const fuel = (0, exports.aircraftFuel)(dependencies, unit);
    if (fuel === null) {
        return true;
    }
    const moving = action instanceof Actions_1.Move, from = moving ? action.to() : unit.tile(), remaining = !moving && unit instanceof Units_1.Bomber
        ? fuel - unit.moves().value()
        : fuel - 1;
    return [
        ...dependencies.cityRegistry
            .getByPlayer(player)
            .map((city) => city.tile()),
        ...(0, carriersFor_1.default)(dependencies, player, unit).map((carrier) => carrier.tile()),
    ].some((tile) => (0, movesBetween_1.default)(from, tile) <= remaining);
};
exports.aircraftCanReturn = aircraftCanReturn;
//# sourceMappingURL=aircraft.js.map