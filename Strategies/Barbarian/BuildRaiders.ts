// Civ1: what a barbarian city builds (civ-clone/web-renderer#27, decision 3): of the land units the `Build` rules allow
//  it (`civ1-barbarians` allows attacking land units at least two civilizations can build), the newest attacker, by its
//  cost and then its attack; without one, the strongest defender. Never a ship, an aircraft, a missile, an improvement
//  or a Wonder: `Raid` moves nothing but land units and transports.
import Attack from '@civ-clone/core-unit/Yields/Attack';
import BuildItem from '@civ-clone/core-city-build/BuildItem';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Defence from '@civ-clone/core-unit/Yields/Defence';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { Land } from '@civ-clone/library-unit/Types';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Strategy from '@civ-clone/core-strategy/Strategy';
import Unit from '@civ-clone/core-unit/Unit';
import baseYieldOf from '../../lib/Unit/unitType';

type Candidate = {
  attack: number;
  cost: number;
  defence: number;
  item: BuildItem;
};

export class BuildRaiders extends Strategy {
  private _dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    super(dependencies.ruleRegistry);

    this._dependencies = dependencies;
  }

  handles(action: PlayerAction): boolean {
    return action.value() instanceof CityBuild;
  }

  attempt(action: PlayerAction<CityBuild>): boolean {
    const cityBuild = action.value(),
      choice = this.choose(cityBuild.available());

    if (choice === null) {
      return false;
    }

    cityBuild.build(choice.item());

    return true;
  }

  choose(available: BuildItem[]): BuildItem | null {
    const units = available
        .filter((buildItem: BuildItem): boolean =>
          Object.prototype.isPrototypeOf.call(Land, buildItem.item())
        )
        .map(
          (item: BuildItem): Candidate => ({
            attack: baseYieldOf(this._dependencies, item.item(), Attack),
            cost: item.cost().value(),
            defence: baseYieldOf(this._dependencies, item.item(), Defence),
            item,
          })
        ),
      attackers = units.filter(
        (candidate: Candidate): boolean => candidate.attack > candidate.defence
      ),
      // The newest attacker: by cost, which rises with the advances (civ-clone/web-renderer#27, decision 3).
      [best] =
        attackers.length > 0
          ? attackers.sort(
              (a: Candidate, b: Candidate): number =>
                b.cost - a.cost || b.attack - a.attack
            )
          : units.sort(
              (a: Candidate, b: Candidate): number =>
                b.defence - a.defence || b.cost - a.cost
            );

    return best?.item ?? null;
  }
}

export default BuildRaiders;
