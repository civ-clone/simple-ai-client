"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUnitAction = void 0;
const Unit_1 = require("@civ-clone/core-unit/Unit");
const isUnitAction = (action) => action.value() instanceof Unit_1.default;
exports.isUnitAction = isUnitAction;
exports.default = exports.isUnitAction;
//# sourceMappingURL=isUnitAction.js.map