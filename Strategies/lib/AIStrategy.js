"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIStrategy = void 0;
const Strategy_1 = require("@civ-clone/core-strategy/Strategy");
class AIStrategy extends Strategy_1.default {
    constructor(dependencies, knowledge) {
        super(dependencies.ruleRegistry);
        this._dependencies = dependencies;
        this._knowledge = knowledge;
    }
    dependencies() {
        return this._dependencies;
    }
    knowledge() {
        return this._knowledge;
    }
    memoryFor(player) {
        return this._dependencies.memoryRegistry.memoryFor(player);
    }
}
exports.AIStrategy = AIStrategy;
exports.default = AIStrategy;
//# sourceMappingURL=AIStrategy.js.map