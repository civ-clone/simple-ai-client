"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instance = exports.MemoryRegistry = void 0;
// Generic: each player's working memory, created the first time it's asked for and kept as long as the player is.
const Memory_1 = require("./Memory");
// Keyed by the `Player` object, and players belong to one game, so one registry can serve every game in a process.
//  It keeps no player alive.
class MemoryRegistry {
    constructor() {
        this._memories = new WeakMap();
    }
    memoryFor(player) {
        let memory = this._memories.get(player);
        if (!memory) {
            memory = (0, Memory_1.createMemory)();
            this._memories.set(player, memory);
        }
        return memory;
    }
}
exports.MemoryRegistry = MemoryRegistry;
exports.instance = new MemoryRegistry();
exports.default = MemoryRegistry;
//# sourceMappingURL=MemoryRegistry.js.map