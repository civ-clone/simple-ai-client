// Generic: a worker founds a city, irrigates, mines or builds a road where it stands, or else is given a city site to
//  head for. Either way the move executor runs next.
import { ActionLookup } from '../actionLookup';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

export const settlerWork = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  tile: Tile,
  target: Tile | undefined,
  { buildIrrigation, buildMine, buildRoad, foundCity }: ActionLookup
): void => {
  if (foundCity && knowledge.shouldBuildCity(dependencies, player, tile)) {
    unit.action(foundCity);
  } else if (
    buildIrrigation &&
    knowledge.shouldIrrigate(dependencies, player, tile)
  ) {
    unit.action(buildIrrigation);
  } else if (buildMine && knowledge.shouldMine(dependencies, player, tile)) {
    unit.action(buildMine);
  } else if (buildRoad && knowledge.shouldRoad(dependencies, player, tile)) {
    unit.action(buildRoad);
  } else if (!target && memory.targets.goodSitesForCities.length) {
    memory.unitTargetData.set(
      unit,
      memory.targets.goodSitesForCities.shift() as Tile
    );
  }
};

export default settlerWork;
