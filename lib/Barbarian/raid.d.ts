import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import NavalTransport from '@civ-clone/base-unit-type-naval-transport/NavalTransport';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const POLAR_ROWS = 2;
export declare const STRANDED_EVERY = 4;
export declare const TOO_FAR = 8;
export declare const LANDING_DISTANCE = 8;
export declare const LEADER_FOLLOWS = 4;
export declare const LEADER_GIVES_UP_EVERY = 8;
export declare const LEADER_GIVES_UP_FROM = 4;
export declare const leaderGivesUp: (
  turn: number,
  fromCity: number | null
) => boolean;
export declare const liveCities: (dependencies: Dependencies) => City[];
export declare const nearestCity: (tile: Tile, cities: City[]) => City | null;
export type Step = {
  action: Action;
  score: number;
  to: Tile;
};
/**
 * The best step from where `unit` stands, scored as v474.05 does (`AIEngine.cs` L2412-2440): 0–5 at random, +6 onto
 * irrigation or a mine, +4 onto any square but the unit's own city, +99 to attack a unit that isn't a Diplomat, +2 for
 * each axis on which the step agrees with the way to `target` (straight on scores +4, a diagonal +2). An enemy city
 * next door is always entered, defended or not. `null` when no neighbour can be stepped onto or attacked.
 */
export declare const bestStep: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile | null
) => Step | null;
/**
 * The leader (the group's Diplomat): he stays with a stack, and otherwise walks to a friendly unit within 4 squares,
 * stopping when he reaches it. With nobody to walk to he waits, until he is far enough from any city to give up
 * (civ-clone/web-renderer#171). He never enters a city.
 */
export declare const leader: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => void;
/**
 * A raider's turn: off the map near the poles; every fourth turn, gone if stranded; in a city of its own, held when
 * alone or a defender; otherwise marching on the nearest city of a civilization worth raiding on its continent,
 * attacking what it meets, and holding a city it takes.
 */
export declare const raid: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => void;
/**
 * A raiding ship's turn: off the map near the poles; gone once empty; lands its raiders beside it when a city is
 * within 8 (`tryLanding`), before and after sailing; otherwise sails for the city with the best gold for the distance
 * that it can reach a sea square beside, or is gone when there is none.
 */
export declare const sail: (
  dependencies: Dependencies,
  player: Player,
  ship: NavalTransport
) => void;
