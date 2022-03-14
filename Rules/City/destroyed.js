"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Destroyed_1 = require("@civ-clone/core-city/Rules/Destroyed");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const SimpleAIClient_1 = require("../../SimpleAIClient");
const getRules = (unitRegistry = UnitRegistry_1.instance, clientRegistry = ClientRegistry_1.instance) => [
    new Destroyed_1.default(new Criterion_1.default((city) => clientRegistry.getByPlayer(city.player()) instanceof SimpleAIClient_1.default), new Effect_1.default((city, player) => clientRegistry.getByPlayer(city.player()).cityLost(city, player, true))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=destroyed.js.map