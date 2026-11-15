// Generic: aircraft fuel where the ruleset counts it with base-unit-fuel (a unit with a `Fuel` yield above 0, as in
//  Civ2), and the `Knowledge` answers that use it. A unit with no `Fuel` (every unit in Civ1, whose aircraft are counted
//  by civ1-unit, and Civ2's Helicopter, which needs none) is left to the `Knowledge` it's given, so nothing changes for
//  it.
import { FuelState, fuelState } from '@civ-clone/base-unit-fuel/lib/reach';
import Action from '@civ-clone/core-unit/Action';
import { Air } from '@civ-clone/library-unit/Types';
import AttackEndsTurn from '@civ-clone/base-unit-trait-attack-ends-turn/AttackEndsTurn';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import movesBetween from '../movesBetween';
import { refuels } from '@civ-clone/base-unit-fuel/lib/fuelRules';

// Where `unit` stands for fuel, or `null` for a unit that needs none: only an aircraft is asked for its `Fuel`.
export const fuelFor = (
  dependencies: Dependencies,
  unit: Unit
): FuelState | null =>
  unit instanceof Air
    ? fuelState(dependencies.unitImprovementRegistry, unit)
    : null;

// The squares `unit` could refuel on: its player's cities and the squares its player's other units are on (a carrier,
//  say), wherever the ruleset's `Refuel` rules say it refuels. Airbases the AI doesn't build aren't looked for.
const refuellingTiles = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  from: Tile,
  within: number
): Tile[] =>
  [
    ...new Set<Tile>([
      ...dependencies.cityRegistry
        .getByPlayer(player)
        .map((city: City): Tile => city.tile()),
      ...dependencies.unitRegistry
        .getByPlayer(player)
        .filter((other: Unit): boolean => other !== unit && !other.destroyed())
        .map((other: Unit): Tile => other.tile()),
    ]),
  ].filter(
    (tile: Tile): boolean =>
      movesBetween(from, tile) <= within &&
      refuels(dependencies.ruleRegistry, unit, tile)
  );

// Whether `action` is a fight with whoever is on its square, after which the unit stays where it is: another player's
//  unit or city is there.
const isAttack = (
  dependencies: Dependencies,
  player: Player,
  action: Action
): boolean =>
  dependencies.unitRegistry
    .getByTile(action.to())
    .some((other: Unit): boolean => other.player() !== player) ||
  (dependencies.cityRegistry.getByTile(action.to())?.player() ?? player) !==
    player;

// Whether a fuelled aircraft could still get to somewhere it refuels after taking `action`, before its fuel runs out
//  (`fuelState`'s reach): a move costs 1 and an attack, fought from where it is, costs 1, or the rest of this turn's
//  moves for one whose attack ends its turn (`AttackEndsTurn`); a missile only has to reach its target. `null` for a
//  unit that needs no fuel.
export const fuelCanReturn = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  action: Action
): boolean | null => {
  const state = fuelFor(dependencies, unit);

  if (state === null) {
    return null;
  }

  const attacking = isAttack(dependencies, player, action);

  // A missile (`SingleUse`) is spent in its attack, so it needs no way back: only fuel left to reach its target.
  if (attacking && unit.hasTrait(SingleUse)) {
    return state.reach >= 1;
  }

  const from = attacking ? unit.tile() : action.to(),
    remaining =
      attacking && unit.hasTrait(AttackEndsTurn)
        ? state.reach - unit.moves().value()
        : state.reach - 1;

  if (remaining < 0) {
    return false;
  }

  if (!attacking && refuels(dependencies.ruleRegistry, unit, from)) {
    return true;
  }

  return (
    refuellingTiles(dependencies, player, unit, from, remaining).length > 0
  );
};

// `knowledge` with base-unit-fuel's fuel for the aircraft that have it: whether one can still get back after an action,
//  and that it's an aircraft. Every other unit is asked of `knowledge` as before.
export const withFuel = (knowledge: Knowledge): Knowledge => ({
  ...knowledge,
  canReturnAfter: (dependencies, player, unit, action) =>
    fuelCanReturn(dependencies, player, unit, action) ??
    knowledge.canReturnAfter(dependencies, player, unit, action),
  isAircraft: (dependencies, unit) =>
    fuelFor(dependencies, unit) !== null ||
    knowledge.isAircraft(dependencies, unit),
});

export default withFuel;
