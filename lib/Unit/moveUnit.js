"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.travelToPathEnd = exports.moveUnit = exports.hasStepWorthTaking = exports.actionToTake = exports.actionsToTake = void 0;
// Generic: the move executor. Follows the unit's path while it has one, otherwise takes the best-scored neighbouring
//  step, until the unit has no moves left, negotiating with any neighbours it meets on the way.
const Actions_1 = require("@civ-clone/library-unit/Actions");
const negotiate_1 = require("../Diplomacy/negotiate");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
const scoreUnitMove_1 = require("./scoreUnitMove");
const shouldAttack_1 = require("../shouldAttack");
// Whether any step from where `unit` stands scores above nothing: a hut, an enemy, unknown tiles it could go on to, a
//  tile it's heading towards, and so on. Without one, the greedy step would pick among steps worth nothing at random.
// The actions on a tile the AI will take. A Diplomat only steals: v474.05's computer players never sabotage, incite
//  or subvert a city (Rome on 640K a Day, p353), or establish embassies, investigate cities or meet kings, and buying
//  units isn't something this AI plans for yet (civ-clone/web-renderer#58).
const actionsToTake = (actions) => actions.filter((action) => !(action instanceof Actions_1.EstablishEmbassy ||
    action instanceof Actions_1.InvestigateCity ||
    action instanceof Actions_1.IndustrialSabotage ||
    action instanceof Actions_1.InciteRevolt ||
    action instanceof Actions_1.MeetWithKing ||
    action instanceof Actions_1.BribeUnit));
exports.actionsToTake = actionsToTake;
// The action the AI takes on a tile, of `actions`, or none: the first it will take, unless that would break a peace
//  treaty with a player it isn't strong enough to fight (`shouldAttack`).
const actionToTake = (dependencies, player, actions) => {
    const [action] = (0, exports.actionsToTake)(actions);
    if (!action ||
        ((action instanceof Actions_1.SneakAttack ||
            action instanceof Actions_1.SneakCaptureCity ||
            action instanceof Actions_1.SneakStealTechnology) &&
            !(0, shouldAttack_1.default)(dependencies, player, action.enemy()))) {
        return null;
    }
    // The `instanceof` checks narrow it to types that aren't assignable to `Action` (civ-clone/web-renderer#21).
    return action;
};
exports.actionToTake = actionToTake;
const hasStepWorthTaking = (dependencies, player, memory, knowledge, unit) => unit
    .tile()
    .getNeighbours()
    .some((tile) => (0, scoreUnitMove_1.default)(dependencies, player, memory, knowledge, unit, tile) > 0);
exports.hasStepWorthTaking = hasStepWorthTaking;
const IDLE_CHECKS = 3;
const moveUnit = async (dependencies, player, memory, knowledge, unit, { stopAtPathEnd = false, wander = true, onIdle } = {}) => {
    let loopCheck = 0, idleChecks = 0;
    while (unit.active() && unit.moves().value() >= 0.1) {
        if (loopCheck++ > 1e3) {
            console.log('SimpleAIClient#moveUnit: loopCheck: aborting');
            console.log(`${unit.player().civilization().name()} ${unit.constructor.name}`);
            console.log(unit.actions());
            console.log(unit.actionsForNeighbours());
            (0, orders_1.noOrders)(dependencies, unit);
            return;
        }
        const path = memory.unitPathData.get(unit);
        if (!path && stopAtPathEnd) {
            return;
        }
        if (path) {
            const target = path.shift(), 
            // Only a neighbour can be moved to. Once a step is blocked, the rest of the path is further away each time
            //  round, and asking for the actions on a distant tile runs a path search to see whether `GoTo` is on offer:
            //  40% of a late-game turn (civ-clone/web-renderer#306).
            moves = target && target.isNeighbourOf(unit.tile())
                ? unit.actions(target).filter((action) => action instanceof Actions_1.Move)
                : [], 
            // Passing through, fly over a `City` or `Carrier` rather than landing on it, which would end the turn.
            [move] = path.length > 0 && unit.moves().value() > 1
                ? [
                    ...moves.filter((action) => action.constructor === Actions_1.Move),
                    ...moves,
                ]
                : moves;
            if ((move instanceof Actions_1.SneakCaptureCity &&
                !(0, shouldAttack_1.default)(dependencies, player, move.enemy())) ||
                (move &&
                    !knowledge.canReturnAfter(dependencies, player, unit, move))) {
                memory.unitPathData.delete(unit);
                continue;
            }
            if (move) {
                unit.action(move);
                if (path.length === 0) {
                    memory.unitPathData.delete(unit);
                }
                await (0, negotiate_1.default)(dependencies, player, unit);
                continue;
            }
            if (path.length > 0) {
                // restart the loop
                continue;
            }
            memory.unitPathData.delete(unit);
        }
        const [target] = unit
            .tile()
            .getNeighbours()
            .map((tile) => [
            tile,
            (0, scoreUnitMove_1.default)(dependencies, player, memory, knowledge, unit, tile),
        ])
            .filter(([, score]) => wander ? score > -1 : score > 0)
            .sort(([, a], [, b]) => b - a ||
            // if there's no difference, sort randomly
            Math.floor(dependencies.randomNumberGenerator() * 3) - 1)
            .map(([tile]) => tile);
        if (!target) {
            if (onIdle && idleChecks++ < IDLE_CHECKS && onIdle()) {
                continue;
            }
            // TODO: could do something a bit more intelligent here
            (0, orders_1.noOrders)(dependencies, unit);
            return;
        }
        const action = (0, exports.actionToTake)(dependencies, player, unit.actions(target)), lastMoves = memory.lastUnitMoves.get(unit) || [], currentTarget = memory.unitTargetData.get(unit);
        if (!action) {
            // TODO: could do something a bit more intelligent here
            (0, orders_1.noOrders)(dependencies, unit);
            return;
        }
        if (currentTarget === target) {
            memory.unitTargetData.delete(unit);
        }
        lastMoves.push(target);
        memory.lastUnitMoves.set(unit, lastMoves.slice(-50));
        unit.action(action);
    }
    await (0, negotiate_1.default)(dependencies, player, unit);
    // If we're here, we still have some moves left, let's clear them up.
    // TODO: This might not be necessary, just remove all checks for >= .1 moves left...
    if (unit.moves().value() > 0) {
        (0, orders_1.noOrders)(dependencies, unit);
    }
};
exports.moveUnit = moveUnit;
// Walks `unit` along its path and stops where the path ends, with any moves to spare left to the caller: how a worker
//  gets to its terrain job (`TerrainWork`).
const travelToPathEnd = (dependencies, player, memory, knowledge, unit) => (0, exports.moveUnit)(dependencies, player, memory, knowledge, unit, {
    stopAtPathEnd: true,
    wander: false,
});
exports.travelToPathEnd = travelToPathEnd;
exports.default = exports.moveUnit;
//# sourceMappingURL=moveUnit.js.map