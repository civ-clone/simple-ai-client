// Generic: at the end of the player's turn, spends what its treasury holds over a reserve on finishing what its cities
//  are building (civ-clone/web-renderer#233), at the ruleset's own price (`PlayerTreasury#cost` and `#buy`), a whole
//  build at a time. A treasury that's never spent is no use to anyone.
//
// What's worth buying, most valuable first:
//  1. a unit that can defend a city short of defenders, or one martial law would use in a city short of those
//     (`City/defence`), the cheapest first;
//  2. an improvement, or a worker (Settlers) in a city that can spare the citizen, that the city would otherwise take
//     at least the policy's `minTurns` to finish at its net shields: the most turns saved per gold first, which is the
//     city that makes the fewest shields;
//  3. a Wonder, but only once no more than the policy's `wonderRemaining` share of it is left to build.
// Nothing else: other units are only built when a city can make them soon, and anything else a ruleset lets a city
//  build (Civ1's spaceship parts) isn't an improvement.
//
// As in v474.05 (OpenCivOne `CityWorker.cs`, where the AI buys only into a build with shields in it already), nothing
//  is bought before the city has put a shield into it: the ruleset charges double for a build not yet started.
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Dependencies from '../Dependencies';
import { Worker } from '@civ-clone/library-unit/Types';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
import PlayerTreasury from '@civ-clone/core-treasury/PlayerTreasury';
import SpendCost from '@civ-clone/core-treasury/SpendCost';
import Unit from '@civ-clone/core-unit/Unit';
import Wonder from '@civ-clone/core-wonder/Wonder';
import Yield from '@civ-clone/core-yield/Yield';
import { netShields } from './buildTime';
import { isDefenderType, wantsDefender, wantsMartialLawUnit } from './defence';

// The ruleset's part. `Civ1/spending` has Civ1's.
export interface SpendingPolicy {
  // The gold the player keeps back, for upkeep and whatever comes up.
  reserve(dependencies: Dependencies, player: Player): number;
  // The fewest turns a city would still take over an improvement or Settlers for buying it to be worth it.
  minTurns: number;
  // The most of a Wonder's cost that can be left to build for it to be bought, as a share.
  wonderRemaining: number;
}

export type PurchaseKind = 'defender' | 'build' | 'wonder';

export interface Purchase {
  city: City;
  kind: PurchaseKind;
  price: number;
  // Turns saved per gold, for ordering purchases of the same kind.
  value: number;
}

const kindOrder: PurchaseKind[] = ['defender', 'build', 'wonder'];

// More turns than any build is worth waiting for, standing in for a city that makes no shields to spare.
const NEVER = 1000;

const isA = (Type: object, item: object): boolean =>
  Object.prototype.isPrototypeOf.call(Type, item);

// The treasury the ruleset sells builds for, and its price for what `city` is building, or `null`.
const priceOf = (
  treasuries: PlayerTreasury[],
  city: City
): [PlayerTreasury, number] | null => {
  for (const treasury of treasuries) {
    const [spendCost] = treasury
      .cost(city)
      .filter(
        (spendCost: SpendCost): boolean =>
          spendCost.resource() === treasury.yield()
      );

    if (spendCost) {
      return [treasury, spendCost.value()];
    }
  }

  return null;
};

// What `city` is building, if it's worth buying, and of what kind.
const kindOf = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  policy: SpendingPolicy,
  city: City,
  building: BuildItem,
  turnsLeft: number,
  yields: Yield[]
): PurchaseKind | null => {
  const item = building.item();

  if (isA(Unit, item)) {
    // Only a unit that would meet what the city is short of: one that can defend it, or one martial law would use.
    if (
      (wantsDefender(dependencies, city) &&
        isDefenderType(dependencies, item)) ||
      (wantsMartialLawUnit(dependencies, knowledge, city, yields) &&
        knowledge.martialLaw.wouldUse(dependencies, item))
    ) {
      return 'defender';
    }

    return isA(Worker, item) &&
      dependencies.cityGrowthRegistry.getByCity(city).size() > 1 &&
      turnsLeft >= policy.minTurns
      ? 'build'
      : null;
  }

  if (isA(Wonder, item)) {
    return dependencies.cityBuildRegistry.getByCity(city).remaining() <=
      building.cost().value() * policy.wonderRemaining
      ? 'wonder'
      : null;
  }

  return isA(CityImprovement, item) && turnsLeft >= policy.minTurns
    ? 'build'
    : null;
};

// What's worth buying in the player's cities, most valuable first, at today's prices.
export const purchases = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  policy: SpendingPolicy,
  player: Player
): Purchase[] => {
  const treasuries = dependencies.playerTreasuryRegistry.getByPlayer(player);

  return dependencies.cityRegistry
    .getByPlayer(player)
    .flatMap((city: City): Purchase[] => {
      const cityBuild = dependencies.cityBuildRegistry.getByCity(city),
        building = cityBuild.building(),
        remaining = cityBuild.remaining();

      if (
        building === null ||
        !(remaining > 0) ||
        cityBuild.progress().value() <= 0
      ) {
        return [];
      }

      const price = priceOf(treasuries, city);

      if (price === null || price[1] <= 0) {
        return [];
      }

      const yields = city.yields(),
        shields = netShields(city, yields),
        turnsLeft =
          shields > 0 ? Math.min(NEVER, Math.ceil(remaining / shields)) : NEVER,
        kind = kindOf(
          dependencies,
          knowledge,
          policy,
          city,
          building,
          turnsLeft,
          yields
        );

      if (kind === null) {
        return [];
      }

      return [
        {
          city,
          kind,
          price: price[1],
          value: kind === 'defender' ? 1 / price[1] : turnsLeft / price[1],
        },
      ];
    })
    .sort(
      (a: Purchase, b: Purchase): number =>
        kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind) ||
        b.value - a.value
    );
};

// Buys what's worth buying, most valuable first, while the treasury holds the price over the policy's reserve. One
//  that costs too much is passed over for the next. Returns the gold spent.
export const spendTreasury = (
  dependencies: Dependencies,
  knowledge: Knowledge,
  policy: SpendingPolicy,
  player: Player
): number => {
  const reserve = policy.reserve(dependencies, player);

  let spent = 0;

  purchases(dependencies, knowledge, policy, player).forEach(
    ({ city }: Purchase): void => {
      const price = priceOf(
        dependencies.playerTreasuryRegistry.getByPlayer(player),
        city
      );

      if (price === null) {
        return;
      }

      const [treasury, cost] = price;

      if (treasury.value() - cost < reserve) {
        return;
      }

      treasury.buy(city);
      spent += cost;
    }
  );

  return spent;
};

export default spendTreasury;
