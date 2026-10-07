import Dependencies from '../lib/Dependencies';
import MemoryRegistry from '../lib/MemoryRegistry';
import Player from '@civ-clone/core-player/Player';
import { expect } from 'chai';
import { militaryPower, shouldAttack } from '../lib/shouldAttack';

describe('shouldAttack', (): void => {
  // Units here are only their attack and defence, which is all `shouldAttack` weighs; `strength` is each player's
  //  total, and `asked` counts the units whose strength was worked out.
  const setUp = () => {
    const player = new Player(),
      rival = new Player(),
      strength = new Map<Player, number>([
        [player, 10],
        [rival, 5],
      ]),
      state = { turn: 1, asked: 0 },
      dependencies = {
        memoryRegistry: new MemoryRegistry(),
        turn: { value: (): number => state.turn },
        unitRegistry: {
          getByPlayer: (owner: Player) => [
            {
              attack: () => {
                state.asked++;

                return { value: (): number => strength.get(owner)! };
              },
              defence: () => ({ value: (): number => 0 }),
            },
          ],
        },
      } as unknown as Dependencies;

    return { dependencies, player, rival, state, strength };
  };

  it('should weigh each side once a turn, however often it is asked (civ-clone/web-renderer#311)', (): void => {
    const { dependencies, player, rival, state } = setUp();

    expect(shouldAttack(dependencies, player, rival)).to.true;
    expect(shouldAttack(dependencies, player, rival)).to.true;
    expect(shouldAttack(dependencies, player, rival)).to.true;

    expect(state.asked).to.equal(2);
  });

  it('should keep the totals for the rest of the turn, and weigh again in the next', (): void => {
    const { dependencies, player, rival, state, strength } = setUp();

    expect(shouldAttack(dependencies, player, rival)).to.true;

    // The rival grows stronger mid-turn: not seen until the next turn.
    strength.set(rival, 20);

    expect(shouldAttack(dependencies, player, rival)).to.true;

    state.turn = 2;

    expect(shouldAttack(dependencies, player, rival)).to.false;
    expect(militaryPower(dependencies, player, rival)).to.equal(20);
  });

  it("should keep each player's view of the totals apart", (): void => {
    const { dependencies, player, rival, strength } = setUp();

    expect(militaryPower(dependencies, player, rival)).to.equal(5);

    strength.set(rival, 7);

    // Worked out afresh for a player who hasn't weighed the rival this turn.
    expect(militaryPower(dependencies, rival, rival)).to.equal(7);
    expect(militaryPower(dependencies, player, rival)).to.equal(5);
  });
});
