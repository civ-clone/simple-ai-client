// Civ1: aircraft fuel, from Civ1's aircraft ranges, and whether an aircraft could still get home after an action.
import {
  aircraftRange,
  turnsAloftKey,
} from '@civ-clone/civ1-unit/Rules/Player/turnEnd';
import Action from '@civ-clone/core-unit/Action';
import { Bomber } from '@civ-clone/civ1-unit/Units';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { Move } from '@civ-clone/civ1-unit/Actions';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import carriersFor from '../Unit/carriersFor';
import movesBetween from '../movesBetween';

// How many more moves an aircraft can make before it must be back in one of our `City`s or `Carrier`s, or `null` for
//  any other `Unit`.
export const aircraftFuel = (
  dependencies: Dependencies,
  unit: Unit
): number | null => {
  const [, range] =
    aircraftRange.find(([UnitType]) => unit instanceof UnitType) ?? [];

  if (range === undefined) {
    return null;
  }

  const turnsAloft =
    dependencies.strategyNoteRegistry
      .getByKey<number>(turnsAloftKey(unit))
      ?.value() ?? 0;

  return (
    unit.moves().value() +
    Math.max(0, range - turnsAloft - 1) * unit.movement().value()
  );
};

// Whether an aircraft can still get home after taking `action`: moving costs 1 and a `Fighter` pays 1 to attack from
//  where it is, but a `Bomber`'s attack ends its turn wherever it is.
export const aircraftCanReturn = (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  action: Action
): boolean => {
  const fuel = aircraftFuel(dependencies, unit);

  if (fuel === null) {
    return true;
  }

  const moving = action instanceof Move,
    from = moving ? action.to() : unit.tile(),
    remaining =
      !moving && unit instanceof Bomber
        ? fuel - unit.moves().value()
        : fuel - 1;

  return [
    ...dependencies.cityRegistry
      .getByPlayer(player)
      .map((city: City): Tile => city.tile()),
    ...carriersFor(dependencies, player, unit).map(
      (carrier: Unit): Tile => carrier.tile()
    ),
  ].some((tile: Tile): boolean => movesBetween(from, tile) <= remaining);
};
