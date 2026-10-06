// Generic: the move executor. Follows the unit's path while it has one, otherwise takes the best-scored neighbouring
//  step, until the unit has no moves left, negotiating with any neighbours it meets on the way.
import {
  BribeUnit,
  IndustrialSabotage,
  InciteRevolt,
  Move,
  SneakAttack,
  SneakCaptureCity,
  SneakStealTechnology,
} from '@civ-clone/library-unit/Actions';
import Action from '@civ-clone/core-unit/Action';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import canNegotiate from '../Diplomacy/negotiate';
import { noOrders } from './orders';
import scoreUnitMove from './scoreUnitMove';
import shouldAttack from '../shouldAttack';

// Whether any step from where `unit` stands scores above nothing: a hut, an enemy, unknown tiles it could go on to, a
//  tile it's heading towards, and so on. Without one, the greedy step would pick among steps worth nothing at random.
// The actions on a tile the AI will take. A Diplomat only steals: v474.05's computer players never sabotage, incite
//  or subvert a city (Rome on 640K a Day, p353), and buying units isn't something this AI plans for yet
//  (civ-clone/web-renderer#58).
export const actionsToTake = (actions: Action[]): Action[] =>
  actions.filter(
    (action: Action): boolean =>
      !(
        action instanceof IndustrialSabotage ||
        action instanceof InciteRevolt ||
        action instanceof BribeUnit
      )
  );

// The action the AI takes on a tile, of `actions`, or none: the first it will take, unless that would break a peace
//  treaty with a player it isn't strong enough to fight (`shouldAttack`).
export const actionToTake = (
  dependencies: Dependencies,
  player: Player,
  actions: Action[]
): Action | null => {
  const [action] = actionsToTake(actions);

  if (
    !action ||
    ((action instanceof SneakAttack ||
      action instanceof SneakCaptureCity ||
      action instanceof SneakStealTechnology) &&
      !shouldAttack(
        dependencies,
        player,
        (action as SneakAttack | SneakStealTechnology).enemy()
      ))
  ) {
    return null;
  }

  // The `instanceof` checks narrow it to types that aren't assignable to `Action` (civ-clone/web-renderer#21).
  return action as unknown as Action;
};

export const hasStepWorthTaking = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit
): boolean =>
  unit
    .tile()
    .getNeighbours()
    .some(
      (tile: Tile): boolean =>
        scoreUnitMove(dependencies, player, memory, knowledge, unit, tile) > 0
    );

export interface MoveOptions {
  // Whether, with no path, the unit takes a step worth nothing (picked at random among the best) rather than stopping.
  //  A unit that only wanders walks back and forth for ever (civ-clone/web-renderer#230).
  wander?: boolean;
  // Whether to stop, moves to spare and orders left to the caller, once the unit's path ends or fails, rather than
  //  carrying on with the greedy step: for a unit that has something to do where its path ends.
  stopAtPathEnd?: boolean;
  // With no path and no step worth taking, a chance to give the unit something else to do with the moves it has left,
  //  such as a new mission once the last one's path has ended: returns whether it set the unit a new path. Asked at
  //  most `IDLE_CHECKS` times a turn.
  onIdle?: () => boolean;
}

const IDLE_CHECKS = 3;

export const moveUnit = async (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  { stopAtPathEnd = false, wander = true, onIdle }: MoveOptions = {}
): Promise<void> => {
  let loopCheck = 0,
    idleChecks = 0;

  while (unit.active() && unit.moves().value() >= 0.1) {
    if (loopCheck++ > 1e3) {
      console.log('SimpleAIClient#moveUnit: loopCheck: aborting');
      console.log(
        `${unit.player().civilization().name()} ${unit.constructor.name}`
      );
      console.log(unit.actions());
      console.log(unit.actionsForNeighbours());
      noOrders(dependencies, unit);

      return;
    }

    const path = memory.unitPathData.get(unit);

    if (!path && stopAtPathEnd) {
      return;
    }

    if (path) {
      const target = path.shift(),
        moves = unit.actions(target).filter((action) => action instanceof Move),
        // Passing through, fly over a `City` or `Carrier` rather than landing on it, which would end the turn.
        [move] =
          path.length > 0 && unit.moves().value() > 1
            ? [
                ...moves.filter((action) => action.constructor === Move),
                ...moves,
              ]
            : moves;

      if (
        (move instanceof SneakCaptureCity &&
          !shouldAttack(dependencies, player, move.enemy())) ||
        (move &&
          !knowledge.canReturnAfter(dependencies, player, unit, move as Action))
      ) {
        memory.unitPathData.delete(unit);

        continue;
      }

      if (move) {
        unit.action(move as Action);

        if (path.length === 0) {
          memory.unitPathData.delete(unit);
        }

        await canNegotiate(dependencies, player, unit);

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
      .map((tile: Tile): [Tile, number] => [
        tile,
        scoreUnitMove(dependencies, player, memory, knowledge, unit, tile),
      ])
      .filter(([, score]: [Tile, number]): boolean =>
        wander ? score > -1 : score > 0
      )
      .sort(
        ([, a]: [Tile, number], [, b]: [Tile, number]): number =>
          b - a ||
          // if there's no difference, sort randomly
          Math.floor(dependencies.randomNumberGenerator() * 3) - 1
      )
      .map(([tile]: [Tile, number]): Tile => tile);

    if (!target) {
      if (onIdle && idleChecks++ < IDLE_CHECKS && onIdle()) {
        continue;
      }

      // TODO: could do something a bit more intelligent here
      noOrders(dependencies, unit);

      return;
    }

    const action = actionToTake(dependencies, player, unit.actions(target)),
      lastMoves = memory.lastUnitMoves.get(unit) || [],
      currentTarget = memory.unitTargetData.get(unit);

    if (!action) {
      // TODO: could do something a bit more intelligent here
      noOrders(dependencies, unit);

      return;
    }

    if (currentTarget === target) {
      memory.unitTargetData.delete(unit);
    }

    lastMoves.push(target);

    memory.lastUnitMoves.set(unit, lastMoves.slice(-50));

    unit.action(action as Action);
  }

  await canNegotiate(dependencies, player, unit);

  // If we're here, we still have some moves left, let's clear them up.
  // TODO: This might not be necessary, just remove all checks for >= .1 moves left...
  if (unit.moves().value() > 0) {
    noOrders(dependencies, unit);
  }
};

export default moveUnit;
