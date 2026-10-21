// Generic: the move executor. Follows the unit's path while it has one, otherwise takes the best-scored neighbouring
//  step, until the unit has no moves left, negotiating with any neighbours it meets on the way.
import {
  BribeUnit,
  EstablishEmbassy,
  IndustrialSabotage,
  InciteRevolt,
  InvestigateCity,
  MeetWithKing,
  Move,
  SneakAttack,
  SneakCaptureCity,
  SneakStealTechnology,
} from '@civ-clone/library-unit/Actions';
import Action from '@civ-clone/core-unit/Action';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import canNegotiate from '../Diplomacy/negotiate';
import { noOrders } from '@civ-clone/base-strategy-ai/lib/Unit/orders';
import scoreUnitMove from './scoreUnitMove';
import shuffle from '../shuffle';

// Whether any step from where `unit` stands scores above nothing: a hut, an enemy, unknown tiles it could go on to, a
//  tile it's heading towards, and so on. Without one, the greedy step would pick among steps worth nothing at random.
// The actions on a tile the AI will take. A Diplomat only steals: v474.05's computer players never sabotage, incite
//  or subvert a city (Rome on 640K a Day, p353), or establish embassies, investigate cities or meet kings, and buying
//  units isn't something this AI plans for yet (civ-clone/web-renderer#58).
export const actionsToTake = (actions: Action[]): Action[] =>
  actions.filter(
    (action: Action): boolean =>
      !(
        action instanceof EstablishEmbassy ||
        action instanceof InvestigateCity ||
        action instanceof IndustrialSabotage ||
        action instanceof InciteRevolt ||
        action instanceof MeetWithKing ||
        action instanceof BribeUnit
      )
  );

// Whether `action` would break a peace treaty. A computer player keeps its treaties: it ends one only by declaring war
//  when it meets the other player, or by quietly dropping a peace it never meant (civ-clone/web-renderer#427), so
//  nothing it does on the map breaks one.
export const breaksTreaty = (action: unknown): boolean =>
  action instanceof SneakAttack ||
  action instanceof SneakCaptureCity ||
  action instanceof SneakStealTechnology;

// The action the AI takes on a tile, of `actions`, or none: the first it will take, unless that would break a peace
//  treaty (`breaksTreaty`).
export const actionToTake = (
  dependencies: Dependencies,
  player: Player,
  actions: Action[]
): Action | null => {
  const [action] = actionsToTake(actions);

  if (!action || breaksTreaty(action)) {
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

// The most steps that cost nothing a unit takes off its path in one call, for each move it has a turn. Along a railroad
//  a step costs nothing, and a unit stepping back and forth there kept every move it had, and its player's turn never
//  ended (civ-clone/web-renderer#377). Steps that cost something end when its moves do.
const FREE_STEPS_PER_MOVE = 3;

// Takes `action` for `unit`, and returns whether it did anything: moved the unit, spent some of its moves or ended its
//  turn. A step that does none of those is chosen again each time round, until the loop check gives up
//  (civ-clone/web-renderer#446).
const takeAction = (unit: Unit, action: Action): boolean => {
  const tile = unit.tile(),
    moves = unit.moves().value();

  unit.action(action);

  return (
    !unit.active() || unit.tile() !== tile || unit.moves().value() !== moves
  );
};

export const moveUnit = async (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  { stopAtPathEnd = false, wander = true, onIdle }: MoveOptions = {}
): Promise<void> => {
  let loopCheck = 0,
    idleChecks = 0,
    freeSteps = 0;

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
        // Only a neighbour can be moved to. Once a step is blocked, the rest of the path is further away each time
        //  round, and asking for the actions on a distant tile runs a path search to see whether `GoTo` is on offer:
        //  40% of a late-game turn (civ-clone/web-renderer#306).
        moves =
          target && target.isNeighbourOf(unit.tile())
            ? unit.actions(target).filter((action) => action instanceof Move)
            : [],
        // Passing through, fly over a `City` or `Carrier` rather than landing on it, which would end the turn.
        [move] =
          path.length > 0 && unit.moves().value() > 1
            ? [
                ...moves.filter((action) => action.constructor === Move),
                ...moves,
              ]
            : moves;

      if (
        breaksTreaty(move) ||
        (move &&
          !knowledge.canReturnAfter(dependencies, player, unit, move as Action))
      ) {
        memory.unitPathData.delete(unit);

        continue;
      }

      if (move) {
        if (!takeAction(unit, move as Action)) {
          memory.unitPathData.delete(unit);
          noOrders(dependencies, unit);

          return;
        }

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

    // The step straight on from the unit's last one. Among steps that score the same, a unit carries straight on, and
    //  otherwise picks one at random: it used to drift north, the first step listed (civ-clone/web-renderer#284).
    const lastSteps = memory.lastUnitMoves.get(unit) || [],
      [from, to] = lastSteps.slice(-2),
      heading =
        from && to === unit.tile()
          ? from
              .getNeighbouringDirections()
              .find((direction) => from.getNeighbour(direction) === to)
          : undefined,
      ahead = heading ? unit.tile().getNeighbour(heading) : null;

    // Shuffled before sorting (which is stable), so that the other steps that score the same are equally likely to be
    //  taken.
    const [target] = shuffle(
      unit
        .tile()
        .getNeighbours()
        .map((tile: Tile): [Tile, number] => [
          tile,
          scoreUnitMove(dependencies, player, memory, knowledge, unit, tile),
        ])
        .filter(([, score]: [Tile, number]): boolean =>
          wander ? score > -1 : score > 0
        ),
      (): number => dependencies.randomNumberGenerator()
    )
      .sort(
        ([tileA, a]: [Tile, number], [tileB, b]: [Tile, number]): number =>
          b - a || Number(tileB === ahead) - Number(tileA === ahead)
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

    const movesBefore = unit.moves().value();

    if (!takeAction(unit, action as Action)) {
      noOrders(dependencies, unit);

      return;
    }

    if (
      unit.active() &&
      unit.moves().value() >= movesBefore &&
      ++freeSteps >= Math.max(1, unit.movement().value()) * FREE_STEPS_PER_MOVE
    ) {
      noOrders(dependencies, unit);

      return;
    }
  }

  await canNegotiate(dependencies, player, unit);

  // If we're here, we still have some moves left, let's clear them up.
  // TODO: This might not be necessary, just remove all checks for >= .1 moves left...
  if (unit.moves().value() > 0) {
    noOrders(dependencies, unit);
  }
};

// Walks `unit` along its path and stops where the path ends, with any moves to spare left to the caller: how a worker
//  gets to its terrain job (`TerrainWork`).
export const travelToPathEnd = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit
): Promise<void> =>
  moveUnit(dependencies, player, memory, knowledge, unit, {
    stopAtPathEnd: true,
    wander: false,
  });

export default moveUnit;
