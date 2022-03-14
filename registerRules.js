"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const captured_1 = require("./Rules/City/captured");
const destroyed_1 = require("./Rules/City/destroyed");
const defeated_1 = require("./Rules/Unit/defeated");
RuleRegistry_1.instance.register(...(0, captured_1.default)(), ...(0, defeated_1.default)(), ...(0, destroyed_1.default)());
//# sourceMappingURL=registerRules.js.map