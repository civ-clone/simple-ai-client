import {
  BribeUnit,
  EstablishEmbassy,
  IndustrialSabotage,
  InciteRevolt,
  InvestigateCity,
  MeetWithKing,
  SneakStealTechnology,
  StealTechnology,
  SubvertCity,
} from '@civ-clone/library-unit/Actions';
import Action from '@civ-clone/core-unit/Action';
import { actionToTake, actionsToTake } from '../lib/Unit/moveUnit';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import MemoryRegistry from '@civ-clone/base-strategy-ai/lib/MemoryRegistry';
import Player from '@civ-clone/core-player/Player';
import { expect } from 'chai';

describe('Diplomats', (): void => {
  it('should only steal: no embassies, investigating, sabotage, inciting, subverting, meeting kings or bribing', (): void => {
    // Only the class matters to the filter, so the actions are made without running their constructors.
    const offered = [
      EstablishEmbassy,
      InvestigateCity,
      IndustrialSabotage,
      InciteRevolt,
      SubvertCity,
      MeetWithKing,
      BribeUnit,
      StealTechnology,
      SneakStealTechnology,
    ].map((ActionType) => Object.create(ActionType.prototype) as Action);

    expect(
      actionsToTake(offered).map((action) => action.constructor.name)
    ).to.deep.equal(['StealTechnology', 'SneakStealTechnology']);
  });

  describe('stealing from a player at peace', (): void => {
    // `shouldAttack` weighs each side's units' attack and defence; the units here are only that.
    const unitOf = (strength: number) => ({
        attack: () => ({ value: () => strength }),
        defence: () => ({ value: () => 0 }),
      }),
      setUp = (ours: number, theirs: number) => {
        const player = new Player(),
          rival = new Player(),
          dependencies = {
            // `shouldAttack` keeps each turn's totals in the player's memory.
            memoryRegistry: new MemoryRegistry(),
            turn: { value: () => 1 },
            unitRegistry: {
              getByPlayer: (owner: Player) => [
                unitOf(owner === player ? ours : theirs),
              ],
            },
          } as unknown as Dependencies,
          steal = Object.assign(Object.create(SneakStealTechnology.prototype), {
            _enemy: rival,
          }) as Action;

        return { dependencies, player, steal };
      };

    it('should steal, breaking the treaty, when strong enough to fight', (): void => {
      const { dependencies, player, steal } = setUp(10, 5);

      expect(actionToTake(dependencies, player, [steal])).to.equal(steal);
    });

    it('should do nothing when not strong enough to fight', (): void => {
      const { dependencies, player, steal } = setUp(5, 10);

      expect(actionToTake(dependencies, player, [steal])).to.null;
    });
  });
});
