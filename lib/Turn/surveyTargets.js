"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.surveyTargets = void 0;
const treaties_1 = require("../Player/treaties");
const surveyTargets_1 = require("@civ-clone/base-strategy-ai/lib/Turn/surveyTargets");
// Takes the tiles `held` says out of `tiles`, in place (`Memory` explains why the lists are kept).
const dropFrom = (tiles, held) => {
    for (let index = tiles.length - 1; index >= 0; index--) {
        if (held(tiles[index])) {
            tiles.splice(index, 1);
        }
    }
};
const surveyTargets = (dependencies, player, memory, knowledge) => {
    (0, surveyTargets_1.default)(dependencies, player, memory, knowledge);
    const { targets } = memory, allies = new Map(), ally = (other) => {
        if (!allies.has(other)) {
            allies.set(other, (0, treaties_1.isAlly)(dependencies, player, other));
        }
        return allies.get(other);
    }, alliedCity = (tile) => {
        const city = dependencies.cityRegistry.getByTile(tile);
        return city !== null && ally(city.player());
    };
    dropFrom(targets.citiesToLiberate, alliedCity);
    dropFrom(targets.enemyCitiesToAttack, alliedCity);
    dropFrom(targets.enemyUnitsToAttack, (tile) => {
        const others = dependencies.unitRegistry
            .getByTile(tile)
            .filter((unit) => unit.player() !== player);
        return (others.length > 0 && others.every((unit) => ally(unit.player())));
    });
};
exports.surveyTargets = surveyTargets;
exports.default = exports.surveyTargets;
//# sourceMappingURL=surveyTargets.js.map