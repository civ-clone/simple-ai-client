// Generic: whether `player` is strong enough to pick a fight with `enemy`.
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';

// The sum of every unit's attack and defence, as `player` last worked it out this turn. Each is a pass through the
//  rules for every unit, and the same pair of players is weighed again and again in a turn (for each neighbouring tile,
//  at each step, of each unit beside a rival's), so the totals are worked out once a turn: 127 of 158 calls on a large
//  late game had the same inputs as the call before (civ-clone/web-renderer#311). A unit gained or lost in the turn
//  shows up from the next one.
export const militaryPower = (
  dependencies: Dependencies,
  player: Player,
  of: Player
): number => {
  const { power } = dependencies.memoryRegistry.memoryFor(player),
    turn = dependencies.turn.value();

  if (power.turn !== turn) {
    power.turn = turn;
    power.byPlayer.clear();
  }

  const known = power.byPlayer.get(of);

  if (known !== undefined) {
    return known;
  }

  const total = dependencies.unitRegistry
    .getByPlayer(of)
    .reduce(
      (score, unit) => score + unit.attack().value() + unit.defence().value(),
      0
    );

  power.byPlayer.set(of, total);

  return total;
};

export const shouldAttack = (
  dependencies: Dependencies,
  player: Player,
  enemy: Player
): boolean => {
  const ourPower = militaryPower(dependencies, player, player),
    enemyPower = militaryPower(dependencies, player, enemy),
    // TODO: use Traits
    // confidence = this.player().civilization().leader()!.traits().some((trait) => trait instanceof Militaristic) ? 1.25 : 0.9;
    confidence = 1;

  return ourPower * confidence >= enemyPower;
};

export default shouldAttack;
