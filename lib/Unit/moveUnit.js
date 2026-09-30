"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveUnit = void 0;
// Generic: the move executor. Follows the unit's path while it has one, otherwise takes the best-scored neighbouring
//  step, until the unit has no moves left, negotiating with any neighbours it meets on the way.
const Actions_1 = require("@civ-clone/library-unit/Actions");
const negotiate_1 = require("../Diplomacy/negotiate");
const orders_1 = require("./orders");
const scoreUnitMove_1 = require("./scoreUnitMove");
const shouldAttack_1 = require("../shouldAttack");
const moveUnit = async (dependencies, player, memory, knowledge, unit) => {
    let loopCheck = 0;
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
        if (path) {
            const target = path.shift(), moves = unit.actions(target).filter((action) => action instanceof Actions_1.Move), 
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
            .filter(([, score]) => score > -1)
            .sort(([, a], [, b]) => b - a ||
            // if there's no difference, sort randomly
            Math.floor(dependencies.randomNumberGenerator() * 3) - 1)
            .map(([tile]) => tile);
        if (!target) {
            // TODO: could do something a bit more intelligent here
            (0, orders_1.noOrders)(dependencies, unit);
            return;
        }
        const actions = unit.actions(target), [action] = actions, lastMoves = memory.lastUnitMoves.get(unit) || [], currentTarget = memory.unitTargetData.get(unit);
        if (!action ||
            ((action instanceof Actions_1.SneakAttack || action instanceof Actions_1.SneakCaptureCity) &&
                !(0, shouldAttack_1.default)(dependencies, player, action.enemy()))) {
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
exports.default = exports.moveUnit;
//# sourceMappingURL=moveUnit.js.map