"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const SimpleAIClient_1 = require("../../SimpleAIClient");
const getRules = (unitRegistry = UnitRegistry_1.instance, clientRegistry = ClientRegistry_1.instance) => [
    new Defeated_1.default(new Criterion_1.default((unit) => clientRegistry.getByPlayer(unit.player()) instanceof SimpleAIClient_1.default), new Effect_1.default((unit, by) => clientRegistry.getByPlayer(unit.player()).unitDestroyed(unit, by && by.player()))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=defeated.js.map