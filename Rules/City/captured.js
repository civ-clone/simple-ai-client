"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Captured_1 = require("@civ-clone/core-city/Rules/Captured");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const SimpleAIClient_1 = require("../../SimpleAIClient");
const getRules = (unitRegistry = UnitRegistry_1.instance, clientRegistry = ClientRegistry_1.instance) => [
    new Captured_1.default(new Criterion_1.default((city, player) => clientRegistry.getByPlayer(player) instanceof SimpleAIClient_1.default), new Effect_1.default((city, player, capturingPlayer) => clientRegistry.getByPlayer(player).cityLost(city, capturingPlayer, false))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=captured.js.map