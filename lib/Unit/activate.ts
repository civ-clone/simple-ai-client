// Generic: wakes a unit by the order its ruleset offers for it (`Activate`, civ-clone/web-renderer#160), as a player
//  does, or, where none is offered, as `Unit#activate` does.
import { Activate } from '@civ-clone/library-unit/Actions';
import Action from '@civ-clone/core-unit/Action';
import Unit from '@civ-clone/core-unit/Unit';

export const activate = (unit: Unit): void => {
  const [order] = unit
    .actions(unit.tile())
    .filter((action: Action): boolean => action instanceof Activate);

  if (order) {
    unit.action(order);

    return;
  }

  unit.activate();
};

export default activate;
