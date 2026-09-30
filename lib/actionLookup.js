"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookupActions = void 0;
// Keyed by class name with its first letter lowered. A later action of the same class replaces an earlier one.
const lookupActions = (actions) => actions.reduce((object, entity) => ({
    ...object,
    [entity.constructor.name.replace(/^./, (char) => char.toLowerCase())]: entity,
}), {});
exports.lookupActions = lookupActions;
exports.default = exports.lookupActions;
//# sourceMappingURL=actionLookup.js.map