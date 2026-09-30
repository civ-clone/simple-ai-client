// Generic: the start-of-turn pass over the player's cities, assigning their workers and noting any left undefended.
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
import { TargetBoard } from '../Memory';

export const reviewCities = (
  dependencies: Dependencies,
  player: Player,
  targets: TargetBoard,
  knowledge: Knowledge
): void =>
  dependencies.cityRegistry.getByPlayer(player).forEach((city: City): void => {
    const tileUnits = dependencies.unitRegistry.getByTile(city.tile());

    knowledge.assignWorkers(dependencies, city);

    if (!tileUnits.length && !targets.undefendedCities.includes(city.tile())) {
      targets.undefendedCities.push(city.tile());
    }
  });

export default reviewCities;
