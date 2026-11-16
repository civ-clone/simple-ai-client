// Civ1: what a city builds next. Always handles the choice. `SimpleAIClient#unitDestroyed` also asks it directly,
//  outside the turn (`choose`). And at the start of each turn, a city building Capitalization (an item that's never
//  finished, so the choice is never offered again) chooses again, so that it builds something once something is worth
//  building; it only stays on Capitalization while nothing is. Only a ruleset with Capitalization has such a city.
import buildItemInCity, {
  ProductionPolicy,
  defaultProductionPolicy,
} from '../../lib/Civ1/buildItemInCity';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import { isBuildingCapitalization } from '@civ-clone/base-city-improvement-capitalization/lib/capitalizationRules';
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
    return action instanceof BeforeTurn || action.value() instanceof CityBuild;
  }

  attempt(action: PlayerAction<CityBuild> | BeforeTurn): boolean {
    if (action instanceof BeforeTurn) {
      this.reviewCapitalization(action.player());

      return true;
    }

    this.choose(action.player(), action.value().city());

    return true;
  }

  // Chooses again for each of `player`'s cities building Capitalization.
  reviewCapitalization(player: Player): void {
    const dependencies = this.dependencies();

    dependencies.cityRegistry
      .getByPlayer(player)
      .filter((city: City): boolean =>
        isBuildingCapitalization(dependencies.cityBuildRegistry.getByCity(city))
      )
      .forEach((city: City): void => this.choose(player, city));
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
