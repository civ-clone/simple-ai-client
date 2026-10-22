import {
  Cannon,
  Horseman,
  Musketman,
  Warrior,
} from '@civ-clone/civ1-unit/Units';
import BarbarianClient, { createBarbarianStrategies } from '../BarbarianClient';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import BuildRaiders from '../Strategies/Barbarian/BuildRaiders';
import Raid from '../Strategies/Barbarian/Raid';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { StrategyRegistry } from '@civ-clone/core-strategy/StrategyRegistry';
import { dependenciesFor } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { expect } from 'chai';
import unitYields from '@civ-clone/civ1-unit/Rules/Unit/yield';
import Player from '@civ-clone/core-player/Player';

describe('BarbarianClient', (): void => {
  it('plays with the barbarian strategies only, in its own registry', (): void => {
    const rules = new RuleRegistry(),
      dependencies = dependenciesFor({ rules } as any),
      client = new BarbarianClient(new Player(rules), dependencies);

    expect(
      createBarbarianStrategies(dependencies).map(
        (strategy) => strategy.constructor
      )
    ).to.eql([Raid, BuildRaiders]);
    expect(client['strategyRegistry']().length).to.equal(2);
    expect(client['strategyRegistry']()).not.to.equal(
      dependencies.strategyRegistry
    );
  });
});

describe('BuildRaiders', (): void => {
  const rules = new RuleRegistry();

  rules.register(...unitYields(undefined, rules));

  const dependencies = dependenciesFor({ rules } as any),
    strategy = new BuildRaiders(dependencies),
    item = (Item: unknown, cost: number): BuildItem =>
      ({
        item: () => Item,
        cost: () => ({ value: () => cost }),
      } as unknown as BuildItem),
    chosen = (items: BuildItem[]) => strategy.choose(items)?.item();

  it('builds the strongest attacker, the dearest when they tie', (): void => {
    // Horseman 2/1 at 20, Cannon 8/1 at 40, Musketman 2/3 at 30: Cannon.
    expect(
      chosen([item(Horseman, 20), item(Cannon, 40), item(Musketman, 30)])
    ).to.equal(Cannon);
    expect(chosen([item(Horseman, 20), item(Warrior, 10)])).to.equal(Horseman);
  });

  it('builds the strongest defender when no attacker is on offer', (): void => {
    // Musketman 2/3 and Warrior 1/1: the Musketman.
    expect(chosen([item(Warrior, 10), item(Musketman, 30)])).to.equal(
      Musketman
    );
  });

  it('leaves improvements alone', (): void => {
    expect(chosen([item(class Granary {}, 60)])).to.be.undefined;
  });
});
