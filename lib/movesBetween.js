"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movesBetween = void 0;
// How many moves an `Air` `Unit` needs to get from one `Tile` to the other: every step costs 1, diagonals included, and
//  the map wraps as it does in `Tile#distanceFrom`.
const movesBetween = (from, to) => {
    const map = from.map(), onAxis = (delta, size) => {
        const direct = Math.abs(delta);
        return Math.min(direct, Math.abs(size - direct));
    };
    return Math.max(onAxis(from.x() - to.x(), map.width()), onAxis(from.y() - to.y(), map.height()));
};
exports.movesBetween = movesBetween;
exports.default = exports.movesBetween;
//# sourceMappingURL=movesBetween.js.map