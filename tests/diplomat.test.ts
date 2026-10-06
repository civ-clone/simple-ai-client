import {
  BribeUnit,
  IndustrialSabotage,
  InciteRevolt,
  SneakStealTechnology,
  StealTechnology,
  SubvertCity,
} from '@civ-clone/library-unit/Actions';
import Action from '@civ-clone/core-unit/Action';
import { actionsToTake } from '../lib/Unit/moveUnit';
import { expect } from 'chai';

describe('Diplomats', (): void => {
  it('should only steal: no sabotage, inciting, subverting or bribing', (): void => {
    // Only the class matters to the filter, so the actions are made without running their constructors.
    const offered = [
      IndustrialSabotage,
      InciteRevolt,
      SubvertCity,
      BribeUnit,
      StealTechnology,
      SneakStealTechnology,
    ].map((ActionType) => Object.create(ActionType.prototype) as Action);

    expect(
      actionsToTake(offered).map((action) => action.constructor.name)
    ).to.deep.equal(['StealTechnology', 'SneakStealTechnology']);
  });
});
