// Civ1: what a city builds next. Always handles the choice. `SimpleAIClient#unitDestroyed` also runs the same module
//  directly, outside the turn.
import AIStrategy from '../lib/AIStrategy';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import buildItemInCity from '../../lib/Civ1/buildItemInCity';

export class ChooseProduction extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action.value() instanceof CityBuild;
  }

  attempt(action: PlayerAction<CityBuild>): boolean {
    const player = action.player();

    buildItemInCity(
      this.dependencies(),
      player,
      this.memoryFor(player).targets,
      action.value().city()
    );

    return true;
  }
}

export default ChooseProduction;
