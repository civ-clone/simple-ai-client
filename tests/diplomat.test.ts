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
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
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
    // A computer player keeps its treaties, however strong it is (civ-clone/web-renderer#427).
    it('should do nothing, even when much the stronger', (): void => {
      const player = new Player(),
        rival = new Player(),
        dependencies = {
          memoryRegistry: new MemoryRegistry(),
          ruleRegistry: new RuleRegistry(),
          turn: { value: () => 1 },
          unitRegistry: { getByPlayer: () => [] },
        } as unknown as Dependencies,
        steal = Object.assign(Object.create(SneakStealTechnology.prototype), {
          _enemy: rival,
        }) as Action;

      expect(actionToTake(dependencies, player, [steal])).to.null;
    });
  });
});
