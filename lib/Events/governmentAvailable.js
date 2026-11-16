"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listen = exports.GOVERNMENT_AVAILABLE = void 0;
const SimpleAIClient_1 = require("../../SimpleAIClient");
exports.GOVERNMENT_AVAILABLE = 'player:government:available';
// Engines already listened to, so registering the rules for a game twice doesn't answer each offer twice.
const listening = new WeakSet();
const listen = (engine, clientRegistry) => {
    if (listening.has(engine)) {
        return;
    }
    listening.add(engine);
    engine.on(exports.GOVERNMENT_AVAILABLE, (player, GovernmentType) => {
        const [client] = clientRegistry.getBy('player', player);
        if (client instanceof SimpleAIClient_1.default) {
            client.governmentAvailable(GovernmentType);
        }
    });
};
exports.listen = listen;
exports.default = exports.listen;
//# sourceMappingURL=governmentAvailable.js.map