// Generic: the ruleset-specific judgements the generic modules defer to. `Civ1/knowledge` supplies Civ1's.
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Dependencies from './Dependencies';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// Stateless, so one value serves every player.
export interface Knowledge {
  // Whether `unit` can still get back to somewhere it can safely end its turn after taking `action`. In Civ1, only
  //  aircraft (to a city or carrier) and Triremes (to the coast) might not.
  canReturnAfter(
    dependencies: Dependencies,
    player: Player,
    unit: Unit,
    action: Action
  ): boolean;
  // Arranges which tiles `city`'s citizens work.
  assignWorkers(dependencies: Dependencies, city: City): void;
  // Whether `unit` is an aircraft, and so has to end its turns in a city or on a carrier.
  isAircraft(dependencies: Dependencies, unit: Unit): boolean;
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
