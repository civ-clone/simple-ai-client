"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldAttack = void 0;
const shouldAttack = (dependencies, player, enemy) => {
    // TODO: These scores should be cached, at least for the duration of the Turn...
    const ourPower = dependencies.unitRegistry
        .getByPlayer(player)
        .reduce((score, unit) => score + unit.attack().value() + unit.defence().value(), 0), enemyPower = dependencies.unitRegistry
        .getByPlayer(enemy)
        .reduce((score, unit) => score + unit.attack().value() + unit.defence().value(), 0), 
    // TODO: use Traits
    // confidence = this.player().civilization().leader()!.traits().some((trait) => trait instanceof Militaristic) ? 1.25 : 0.9;
    confidence = 1;
    return ourPower * confidence >= enemyPower;
};
exports.shouldAttack = shouldAttack;
exports.default = exports.shouldAttack;
//# sourceMappingURL=shouldAttack.js.map