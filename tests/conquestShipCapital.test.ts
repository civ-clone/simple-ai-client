import civ1ConquestPolicy, { CONQUEST_WEIGHT } from '../lib/Civ1/conquest';
import ComputerSpaceshipPart from '@civ-clone/base-spaceship/lib/Rules/ComputerSpaceshipPart';
import Effect from '@civ-clone/core-rule/Effect';
import InteractionRegistry from '@civ-clone/core-diplomacy/InteractionRegistry';
import { Palace } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { createVictoryDependencies } from '@civ-clone/base-strategy-victory/lib/VictoryDependencies';
import { expect } from 'chai';

// `player`'s one city, and an enemy's two on the same land, the second its capital, whose ship is `ship`: in flight,
//  building or none. The rule set's own computer players race for space when `rules` is on.
let turns = 0;

const setUp = (ship: 'flight' | 'building' | 'none', rules: boolean) => {
  const ruleRegistry = new RuleRegistry(),
    player = new Player(ruleRegistry),
    enemy = new Player(ruleRegistry),
    // Land squares in a row, each next to the one before and after.
    tiles: any[] = new Array(6).fill(null).map(() => ({ isLand: () => true })),
    city = (owner: Player, index: number) => ({
      player: () => owner,
      destroyed: () => false,
      tile: () => tiles[index],
    }),
    own = city(player, 0),
    near = city(enemy, 2),
    capital = city(enemy, 5),
    turn = ++turns;

  tiles.forEach((tile, index) =>
    Object.assign(tile, {
      getNeighbours: () => [tiles[index - 1], tiles[index + 1]].filter(Boolean),
      distanceFrom: (other: unknown) => Math.abs(tiles.indexOf(other) - index),
    })
  );

  if (rules) {
    ruleRegistry.register(new ComputerSpaceshipPart(new Effect(() => null)));
  }

  const dependencies = createDependencies({
      cityImprovementRegistry: {
        getByCity: (target: unknown) =>
          target === capital ? [Object.create(Palace.prototype)] : [],
      } as any,
      cityRegistry: {
        entries: () => [own, near, capital],
        getByPlayer: (owner: Player) =>
          owner === player ? [own] : [near, capital],
      } as any,
      interactionRegistry: new InteractionRegistry(),
      memoryRegistry: {
        memoryFor: () => ({ targets: { goodSitesForCities: [] } }),
      } as any,
      playerWorldRegistry: {
        getByPlayer: () => ({ includes: () => true }),
      } as any,
      ruleRegistry,
      turn: { value: () => turn } as any,
    }),
    victory = createVictoryDependencies({
      spaceshipRegistry: {
        getBy: (key: string, owner: Player) =>
          owner === enemy && ship !== 'none'
            ? [
                {
                  launched: () => (ship === 'flight' ? 1990 : false),
                  successful: () => null,
                },
              ]
            : [],
      } as any,
    });

  return {
    capital,
    weight: () => civ1ConquestPolicy.weight(dependencies, victory, player),
    target: () => civ1ConquestPolicy.target(dependencies, victory, player),
  };
};

describe("conquest of a capital whose ship is in flight (a rule set's own computer players' space race)", (): void => {
  it('makes it the target, at full weight, while its ship is in flight', (): void => {
    const { capital, target, weight } = setUp('flight', true);

    expect(weight()).equal(CONQUEST_WEIGHT);
    expect(target()).equal(capital);
  });

  it('leaves it be while its ship is only being built', (): void => {
    const { capital, target, weight } = setUp('building', true);

    // A third of the world's cities, with no rival: no weight and no target (`rivalOf` finds none stronger).
    expect(weight()).equal(0);
    expect(target()).not.equal(capital);
  });

  it("leaves Civ1's own space race as v474.05 plays it: no such rules, no such target", (): void => {
    const { capital, target, weight } = setUp('flight', false);

    expect(weight()).equal(0);
    expect(target()).not.equal(capital);
  });
});
