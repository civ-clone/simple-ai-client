import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Dependencies from './Dependencies';
import { MartialLawPolicy } from './City/defence';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export interface Knowledge {
  canReturnAfter(
    dependencies: Dependencies,
    player: Player,
    unit: Unit,
    action: Action
  ): boolean;
  assignWorkers(dependencies: Dependencies, city: City): void;
  isAircraft(dependencies: Dependencies, unit: Unit): boolean;
  martialLaw: MartialLawPolicy;
  shouldBuildCity(
    dependencies: Dependencies,
    player: Player,
    tile: Tile
  ): boolean;
  shouldIrrigate(
    dependencies: Dependencies,
    player: Player,
    tile: Tile
  ): boolean;
  shouldMine(dependencies: Dependencies, player: Player, tile: Tile): boolean;
  shouldRoad(dependencies: Dependencies, player: Player, tile: Tile): boolean;
}
export default Knowledge;
