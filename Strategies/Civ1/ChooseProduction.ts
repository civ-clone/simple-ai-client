// Civ1: what a city builds next. Always handles the choice. `SimpleAIClient#unitDestroyed` also runs the same module
//  directly, outside the turn.
import buildItemInCity, {
  ProductionPolicy,
  defaultProductionPolicy,
} from '../../lib/Civ1/buildItemInCity';
import AIStrategy from '../lib/AIStrategy';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';

export class ChooseProduction extends AIStrategy {
  private _policyFor: (player: Player) => ProductionPolicy;

  // `policyFor` gives each player's `ProductionPolicy`: the same for everyone until civ-clone/web-renderer#157 derives
  //  it from the leader's traits.
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
    const player = action.player();

    buildItemInCity(
      this.dependencies(),
      player,
      this.memoryFor(player).targets,
      action.value().city(),
      this._policyFor(player),
      this.knowledge()
    );

    return true;
  }
}

export default ChooseProduction;
