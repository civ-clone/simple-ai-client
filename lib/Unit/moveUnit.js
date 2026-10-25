"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.travelToPathEnd = exports.moveUnit = exports.hasStepWorthTaking = exports.actionToTake = exports.breaksTreaty = exports.actionsToTake = void 0;
// Generic: the move executor. Follows the unit's path while it has one, otherwise takes the best-scored neighbouring
//  step, until the unit has no moves left, negotiating with any neighbours it meets on the way.
const Actions_1 = require("@civ-clone/library-unit/Actions");
const Types_1 = require("@civ-clone/library-unit/Types");
const negotiate_1 = require("../Diplomacy/negotiate");
const coastalPath_1 = require("./coastalPath");
const orders_1 = require("@civ-clone/base-strategy-ai/lib/Unit/orders");
const scoreUnitMove_1 = require("./scoreUnitMove");
const shuffle_1 = require("../shuffle");
// Whether any step from where `unit` stands scores above nothing: a hut, an enemy, unknown tiles it could go on to, a
//  tile it's heading towards, and so on. Without one, the greedy step would pick among steps worth nothing at random.
// The actions on a tile the AI will take. A Diplomat only steals: v474.05's computer players never sabotage, incite
//  or subvert a city (Rome on 640K a Day, p353), or establish embassies, investigate cities or meet kings, and buying
//  units isn't something this AI plans for yet (civ-clone/web-renderer#58). Nor does it call off a move onto a treaty
//  partner's land, or choose what a Senate overrules: both only spend its moves (civ-clone/web-renderer#287).
const actionsToTake = (actions) => actions.filter((action) => !(action instanceof Actions_1.EstablishEmbassy ||
    action instanceof Actions_1.InvestigateCity ||
    action instanceof Actions_1.IndustrialSabotage ||
    action instanceof Actions_1.InciteRevolt ||
    action instanceof Actions_1.MeetWithKing ||
    action instanceof Actions_1.BribeUnit ||
    action instanceof Actions_1.AbortMove ||
    action instanceof Actions_1.Overruled));
exports.actionsToTake = actionsToTake;
// Whether `action` would break a peace treaty. A computer player keeps its treaties: it ends one only by declaring war
//  when it meets the other player, or by quietly dropping a peace it never meant (civ-clone/web-renderer#427), so
//  nothing it does on the map breaks one. An action breaks one when it has an `enemy()`, which is what civ1-unit's
//  `moved/break-peace-treaty` rule ends the peace with: a sneak attack, capture, move or pillage, or a Diplomat's.
const breaksTreaty = (action) => typeof (action === null || action === void 0 ? void 0 : action.enemy) === 'function';
exports.breaksTreaty = breaksTreaty;
// The action the AI takes on a tile, of `actions`, or none: the first it will take, unless that would break a peace
//  treaty (`breaksTreaty`).
const actionToTake = (dependencies, player, actions) => {
    const [action] = (0, exports.actionsToTake)(actions);
    if (!action || (0, exports.breaksTreaty)(action)) {
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
// The most steps that cost nothing a unit takes off its path in one call, for each move it has a turn. Along a railroad
//  a step costs nothing, and a unit stepping back and forth there kept every move it had, and its player's turn never
//  ended (civ-clone/web-renderer#377). Steps that cost something end when its moves do.
const FREE_STEPS_PER_MOVE = 3;
// Takes `action` for `unit`, and returns whether it did anything: moved the unit, spent some of its moves or ended its
//  turn. A step that does none of those is chosen again each time round, until the loop check gives up
//  (civ-clone/web-renderer#446).
const takeAction = (unit, action) => {
    const tile = unit.tile(), moves = unit.moves().value();
    unit.action(action);
    return (!unit.active() || unit.tile() !== tile || unit.moves().value() !== moves);
};
const moveUnit = async (dependencies, player, memory, knowledge, unit, { stopAtPathEnd = false, wander = true, onIdle } = {}) => {
    var _a;
    let loopCheck = 0, idleChecks = 0, freeSteps = 0, 
    // The places a ship has looked for a way along the coast to (`coastalPath`), once each.
    alongCoast = new Set();
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
            const destination = (_a = path.end()) !== null && _a !== void 0 ? _a : target;
            if (move &&
                destination &&
                !(0, exports.breaksTreaty)(move) &&
                !knowledge.canReturnAfter(dependencies, player, unit, move) &&
                unit instanceof Types_1.Naval &&
                !alongCoast.has(destination)) {
                // A ship the ruleset keeps near the coast takes the way along it to the same place, if there is one
                //  (civ-clone/web-renderer#632). Without one, the path goes, and a new mission (`onIdle`) can send it
                //  somewhere else: each place is tried once a turn.
                const coastal = (0, coastalPath_1.default)(unit, destination);
                alongCoast.add(destination);
                if (coastal !== null) {
                    memory.unitPathData.set(unit, coastal);
                    continue;
                }
            }
            if ((0, exports.breaksTreaty)(move) ||
                (move &&
                    !knowledge.canReturnAfter(dependencies, player, unit, move))) {
                memory.unitPathData.delete(unit);
                continue;
            }
            if (move) {
                if (!takeAction(unit, move)) {
                    memory.unitPathData.delete(unit);
                    (0, orders_1.noOrders)(dependencies, unit);
                    return;
                }
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
        // The step straight on from the unit's last one. Among steps that score the same, a unit carries straight on, and
        //  otherwise picks one at random: it used to drift north, the first step listed (civ-clone/web-renderer#284).
        const lastSteps = memory.lastUnitMoves.get(unit) || [], [from, to] = lastSteps.slice(-2), heading = from && to === unit.tile()
            ? from
                .getNeighbouringDirections()
                .find((direction) => from.getNeighbour(direction) === to)
            : undefined, ahead = heading ? unit.tile().getNeighbour(heading) : null;
        // Shuffled before sorting (which is stable), so that the other steps that score the same are equally likely to be
        //  taken.
        const [target] = (0, shuffle_1.default)(unit
            .tile()
            .getNeighbours()
            .map((tile) => [
            tile,
            (0, scoreUnitMove_1.default)(dependencies, player, memory, knowledge, unit, tile),
        ])
            .filter(([, score]) => wander ? score > -1 : score > 0), () => dependencies.randomNumberGenerator())
            .sort(([tileA, a], [tileB, b]) => b - a || Number(tileB === ahead) - Number(tileA === ahead))
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
        const movesBefore = unit.moves().value();
        if (!takeAction(unit, action)) {
            (0, orders_1.noOrders)(dependencies, unit);
            return;
        }
        if (unit.active() &&
            unit.moves().value() >= movesBefore &&
            ++freeSteps >= Math.max(1, unit.movement().value()) * FREE_STEPS_PER_MOVE) {
            (0, orders_1.noOrders)(dependencies, unit);
            return;
        }
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