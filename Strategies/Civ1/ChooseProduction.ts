// Civ1: what a city builds next. Always handles the choice. `SimpleAIClient#unitDestroyed` also asks it directly,
//  outside the turn (`choose`).
import buildItemInCity, {
  ProductionPolicy,
  defaultProductionPolicy,
} from '../../lib/Civ1/buildItemInCity';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';

export class ChooseProduction extends AIStrategy {
  private _policyFor: (player: Player) => ProductionPolicy;

  // `policyFor` gives each player's `ProductionPolicy`, the same for everyone by default: the leader's personality comes
  //  in through the rules `buildItemInCity` reads (civ-clone/web-renderer#157).
  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policyFor: (player: Player) => ProductionPolicy = (): ProductionPolicy =>
      defaultProductionPolicy
  ) {
    super(dependencies, knowledge);

    this._policyFor = policyFor;
  }

  handles(action: PlayerAction): boolean {
    return action.value() instanceof CityBuild;
  }

  attempt(action: PlayerAction<CityBuild>): boolean {
    this.choose(action.player(), action.value().city());

    return true;
  }

  // Picks what `city` builds by `player`'s `ProductionPolicy`. `SimpleAIClient#unitDestroyed` calls this directly, so
  //  that its emergency rebuild follows the same policy as the player's other choices.
  choose(player: Player, city: City): void {
    buildItemInCity(
      this.dependencies(),
      player,
      this.memoryFor(player).targets,
      city,
      this._policyFor(player),
      this.knowledge()
    );
  }
}

export default ChooseProduction;
