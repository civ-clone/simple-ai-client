// Generic: whether `player` is strong enough to pick a fight with `enemy`.
import Dependencies from './Dependencies';
import Player from '@civ-clone/core-player/Player';

export const shouldAttack = (
  dependencies: Dependencies,
  player: Player,
  enemy: Player
): boolean => {
  // TODO: These scores should be cached, at lest for the duration of the Turn...
  const ourPower = dependencies.unitRegistry
      .getByPlayer(player)
      .reduce(
        (score, unit) => score + unit.attack().value() + unit.defence().value(),
        0
      ),
    enemyPower = dependencies.unitRegistry
      .getByPlayer(enemy)
      .reduce(
        (score, unit) => score + unit.attack().value() + unit.defence().value(),
        0
      ),
    // TODO: use Traits
    // confidence = this.player().civilization().leader()!.traits().some((trait) => trait instanceof Militaristic) ? 1.25 : 0.9;
    confidence = 1;

  return ourPower * confidence >= enemyPower;
};

export default shouldAttack;
