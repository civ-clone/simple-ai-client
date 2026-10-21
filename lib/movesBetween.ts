// Generic: how many moves an `Air` `Unit` needs between two `Tile`s.
import Tile from '@civ-clone/core-world/Tile';

// How many moves an `Air` `Unit` needs to get from one `Tile` to the other: every step costs 1, diagonals included, the
//  short way round any wrap. The world's topology counts them, so this holds on any grid it supports.
export const movesBetween = (from: Tile, to: Tile): number =>
  from.map().topology().steps(from.x(), from.y(), to.x(), to.y());

export default movesBetween;
