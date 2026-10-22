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
export declare const liveCities: (dependencies: Dependencies) => City[];
export declare const nearestCity: (tile: Tile, cities: City[]) => City | null;
export type Step = {
  action: Action;
  score: number;
  to: Tile;
};
/**
 * The best step from where `unit` stands, scored as v474.05 does: 0–5 at random, +6 onto irrigation or a mine, +99
 * to attack a unit that isn't a Diplomat, +2 for each axis towards `target`; an enemy city next door is always
 * entered. `null` when no neighbour can be stepped onto or attacked.
 */
export declare const bestStep: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  target: Tile | null
) => Step | null;
/**
 * The leader (the group's Diplomat): he stays with a stack, and otherwise walks to a friendly unit within 4 squares.
 * What becomes of him when he's stranded, and when he enters a city, is civ-clone/web-renderer#171.
 */
export declare const leader: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => void;
/**
 * A raider's turn: off the map near the poles; every fourth turn, gone if stranded; in a city, fortified when alone or
 * a defender; otherwise marching on the nearest city of a civilization worth raiding on its continent, attacking
 * what it meets.
 */
export declare const raid: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => void;
/**
 * A raiding ship's turn: gone once empty; within 8 of a city, lands everyone on an empty square next to the ship on
 * that city's continent (`barbarians:landed`); otherwise sails for the city with the best gold for the distance, or
 * is gone when none scores.
 */
export declare const sail: (
  dependencies: Dependencies,
  player: Player,
  ship: NavalTransport
) => void;
