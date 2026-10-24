import {
  AbortMove,
  Overruled,
  SneakAttack,
  SneakCaptureCity,
  SneakInciteRevolt,
  SneakMove,
  SneakNuclearAttack,
  SneakPillage,
  SneakStealTechnology,
} from '@civ-clone/library-unit/Actions';
import Action from '@civ-clone/core-unit/Action';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import MemoryRegistry from '@civ-clone/base-strategy-ai/lib/MemoryRegistry';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { actionToTake, breaksTreaty } from '../lib/Unit/moveUnit';
import { expect } from 'chai';

// A computer player ends a treaty only by declaring war when it meets the other player, or by quietly dropping a peace
//  it never meant (civ1-diplomacy; civ-clone/web-renderer#427). Before, any computer player whose units' attack and
//  defence added up to the other's broke a treaty on sight, so treaties lasted a few turns.
describe('treaties', (): void => {
  it('should never break a peace treaty on the map, however much stronger it is', (): void => {
    const player = new Player(),
      rival = new Player(),
      unitOf = (strength: number) => ({
        attack: () => ({ value: () => strength }),
        defence: () => ({ value: () => strength }),
      }),
      dependencies = {
        memoryRegistry: new MemoryRegistry(),
        ruleRegistry: new RuleRegistry(),
        turn: { value: () => 1 },
        unitRegistry: {
          getByPlayer: (owner: Player) => [unitOf(owner === player ? 100 : 1)],
        },
      } as unknown as Dependencies;

    [
      SneakAttack,
      SneakCaptureCity,
      SneakInciteRevolt,
      SneakMove,
      SneakNuclearAttack,
      SneakPillage,
      SneakStealTechnology,
    ].forEach((SneakAction): void => {
      const sneak = Object.assign(Object.create(SneakAction.prototype), {
        _enemy: rival,
      }) as Action;

      expect(actionToTake(dependencies, player, [sneak])).null;
    });
  });

  // Calling off a move onto a treaty partner's land, or what a Senate overrules, only spends moves
  //  (civ-clone/web-renderer#287, #133).
  it("should neither call off a move onto a partner's land nor take what a Senate overrules", (): void => {
    const player = new Player(),
      rival = new Player();

    [AbortMove, Overruled].forEach((ActionType): void => {
      const action = Object.assign(Object.create(ActionType.prototype), {
        _partner: rival,
      }) as Action;

      expect(breaksTreaty(action)).false;
      expect(actionToTake({} as unknown as Dependencies, player, [action]))
        .null;
    });
  });
});
