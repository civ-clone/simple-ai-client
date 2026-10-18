// Generic: a coastal city builds a transport for passengers waiting in it to go overseas, or a ship to explore the
//  sea with, when the player has more than one city and no ship (`lib/City/explorerShip`). Handles the choice only then; otherwise the ruleset's production choice
//  (`ChooseProduction`) makes it.
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import explorerShipFor, { ferryShipFor } from '../../lib/City/explorerShip';

export class BuildExplorerShip extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return action.value() instanceof CityBuild;
  }

  attempt(action: PlayerAction<CityBuild>): boolean {
    const player = action.player(),
      cityBuild = action.value(),
      memory = this.memoryFor(player),
      ship =
        ferryShipFor(this.dependencies(), player, memory, cityBuild.city()) ??
        explorerShipFor(
          this.dependencies(),
          player,
          memory.targets,
          cityBuild.city(),
          this.knowledge()
        );

    if (ship === null) {
      return false;
    }

    cityBuild.build(ship);

    return true;
  }
}

export default BuildExplorerShip;
