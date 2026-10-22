"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarbarianClient = exports.createBarbarianStrategies = void 0;
const Dependencies_1 = require("@civ-clone/base-strategy-ai/lib/Dependencies");
const StrategyRegistry_1 = require("@civ-clone/core-strategy/StrategyRegistry");
const BuildRaiders_1 = require("./Strategies/Barbarian/BuildRaiders");
const EndTurn_1 = require("@civ-clone/base-player-action-end-turn/EndTurn");
const Raid_1 = require("./Strategies/Barbarian/Raid");
const StrategyAIClient_1 = require("@civ-clone/core-strategy-ai-client/StrategyAIClient");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const core_game_1 = require("@civ-clone/core-game");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
// The barbarians' strategies: their units' turns, and what their cities build. Nothing else is offered to them:
//  `civ1-barbarians` keeps research, revolutions and negotiation away from the barbarian player.
const createBarbarianStrategies = (dependencies) => [new Raid_1.default(dependencies), new BuildRaiders_1.default(dependencies)];
exports.createBarbarianStrategies = createBarbarianStrategies;
/**
 * The barbarians' client (civ-clone/web-renderer#169): an `AIClient`, so `isHuman` and the hooks that tell a computer
 * player from a person treat it as one, with a strategy pack of its own rather than `SimpleAIClient`'s, which plans
 * for a civilization. A host gives it to the player `civ1-barbarians` spawns, when `player:spawned` names a barbarian.
 */
class BarbarianClient extends StrategyAIClient_1.default {
    constructor(player, dependencies = (0, Dependencies_1.dependenciesFor)(core_game_1.defaultGame), strategyRegistry = new StrategyRegistry_1.StrategyRegistry()) {
        super(player, strategyRegistry, dependencies.randomNumberGenerator);
        if (strategyRegistry.length === 0) {
            strategyRegistry.register(...(0, exports.createBarbarianStrategies)(dependencies));
        }
    }
    // As `SimpleAIClient`: one unit's failed move shouldn't cost the rest of the raid, so that unit stands down.
    actionFailed(action, error) {
        const item = action.value();
        if (!(item instanceof Unit_1.default)) {
            throw error;
        }
        console.error(`BarbarianClient: ${item.constructor.name} could not act: ${error instanceof Error ? error.message : String(error)}`);
        (0, orders_1.skipUnit)((0, Dependencies_1.dependenciesFor)(core_game_1.defaultGame), item);
        return true;
    }
    // The turn ends at the first action no strategy handles, which should be `EndTurn`.
    unhandledAction(action) {
        if (action instanceof EndTurn_1.default) {
            return;
        }
        console.log(`BarbarianClient: can't process '${action.constructor.name}'`);
    }
}
exports.BarbarianClient = BarbarianClient;
exports.default = BarbarianClient;
//# sourceMappingURL=BarbarianClient.js.map