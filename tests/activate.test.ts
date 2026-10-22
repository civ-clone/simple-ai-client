import { Activate } from '@civ-clone/library-unit/Actions';
import Unit from '@civ-clone/core-unit/Unit';
import activate from '../lib/Unit/activate';
import { expect } from 'chai';

// A unit whose ruleset offers it `offered`, recording what it's told to do.
const unitOffered = (offered: object[]) => {
  const done: string[] = [],
    unit = {
      actions: () => offered,
      action: (action: object) => done.push(action.constructor.name),
      activate: () => done.push('activate()'),
      tile: () => null,
    } as unknown as Unit;

  return { done, unit };
};

describe('activate', (): void => {
  it('wakes a unit by the Activate order its ruleset offers (civ-clone/web-renderer#160)', (): void => {
    const { done, unit } = unitOffered([Object.create(Activate.prototype)]);

    activate(unit);

    expect(done).to.deep.equal(['Activate']);
  });

  it('wakes it directly where the ruleset offers no such order', (): void => {
    const { done, unit } = unitOffered([]);

    activate(unit);

    expect(done).to.deep.equal(['activate()']);
  });
});
