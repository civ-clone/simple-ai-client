// Generic: standing a unit down for the turn.
import Dependencies from '../Dependencies';
import { NoOrders } from '@civ-clone/library-unit/Actions';
import Unit from '@civ-clone/core-unit/Unit';

export const noOrders = (dependencies: Dependencies, unit: Unit): void => {
  unit.action(
    new NoOrders(unit.tile(), unit.tile(), unit, dependencies.ruleRegistry)
  );
};

export const skipUnit = (dependencies: Dependencies, unit: Unit): void => {
  try {
    noOrders(dependencies, unit);
  } catch (e) {
    // `NoOrders` is only a fallback here, so if it fails too, make sure the unit stops being a mandatory action.
    unit.moves().set(0);
    unit.setActive(false);
  }
};
