"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitTurnContextFor = void 0;
// Generic: the context of the unit turn a mandatory action stands for, created by whichever unit strategy asks first
//  and shared by the rest, so it's read (and the move history seeded) once per action, as before the split.
const unitTurnContext_1 = require("../../lib/Unit/unitTurnContext");
// Keyed by the action object, which `Player#mandatoryAction` creates afresh each time, so nothing outlives its action.
const contexts = new WeakMap();
const unitTurnContextFor = (dependencies, action) => {
    let context = contexts.get(action);
    if (!context) {
        context = (0, unitTurnContext_1.default)(dependencies, dependencies.memoryRegistry.memoryFor(action.player()), action.value());
        contexts.set(action, context);
    }
    return context;
};
exports.unitTurnContextFor = unitTurnContextFor;
exports.default = exports.unitTurnContextFor;
//# sourceMappingURL=unitTurnContextFor.js.map