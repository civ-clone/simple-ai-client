// Generic: how many moves an `Air` `Unit` needs between two `Tile`s.
import Tile from '@civ-clone/core-world/Tile';

// How many moves an `Air` `Unit` needs to get from one `Tile` to the other: every step costs 1, diagonals included, and
//  the map wraps as it does in `Tile#distanceFrom`.
export const movesBetween = (from: Tile, to: Tile): number => {
  const map = from.map(),
    onAxis = (delta: number, size: number): number => {
      const direct = Math.abs(delta);

      return Math.min(direct, Math.abs(size - direct));
    };

  return Math.max(
    onAxis(from.x() - to.x(), map.width()),
    onAxis(from.y() - to.y(), map.height())
  );
};

export default movesBetween;
