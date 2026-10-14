// Generic: how strong a unit is, found once a turn for each unit. A unit's `Attack` and `Defence` go through the
//  ruleset's rules every time they're asked for, and each of a player's cities asks for those of every unit the player
//  has as it chooses what to build, to count the attackers and explorers it already has (civ-clone/web-renderer#408).
import Unit from '@civ-clone/core-unit/Unit';

interface Strengths {
  attack?: number;
  defence?: number;
}

// The strengths found so far this turn, by unit.
let known: { turn: number; byUnit: WeakMap<Unit, Strengths> } | null = null;

const strengthsOf = (turn: number, unit: Unit): Strengths => {
  if (known === null || known.turn !== turn) {
    known = { turn, byUnit: new WeakMap() };
  }

  let strengths = known.byUnit.get(unit);

  if (strengths === undefined) {
    strengths = {};
    known.byUnit.set(unit, strengths);
  }

  return strengths;
};

// What `unit.attack().value()` is, found once a turn. For judging what kind of unit it is, not for its strength: the
//  only thing in the ruleset that changes a unit's `Attack` or `Defence` in the middle of a turn is a Veteran
//  improvement, which adds the same share of the base yield to each, so a unit that attacks more than it defends, or
//  can fight at all, still does. Where the unit is and whose it is aren't part of the answer.
export const attackOf = (turn: number, unit: Unit): number => {
  const strengths = strengthsOf(turn, unit);

  return (strengths.attack ??= unit.attack().value());
};

// As `attackOf`, for `unit.defence().value()`.
export const defenceOf = (turn: number, unit: Unit): number => {
  const strengths = strengthsOf(turn, unit);

  return (strengths.defence ??= unit.defence().value());
};
