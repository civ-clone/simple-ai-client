"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movesBetween = void 0;
// How many moves an `Air` `Unit` needs to get from one `Tile` to the other: every step costs 1, diagonals included, the
//  short way round any wrap. The world's topology counts them, so this holds on any grid it supports.
const movesBetween = (from, to) => from.map().topology().steps(from.x(), from.y(), to.x(), to.y());
exports.movesBetween = movesBetween;
exports.default = exports.movesBetween;
//# sourceMappingURL=movesBetween.js.map