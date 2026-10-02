// Generic: what a worker with nothing to do does (civ-clone/web-renderer#230, #243): no city site it can reach, no
//  terrain job and no step worth taking. It joins one of the player's cities, giving back the citizen it cost, where
//  the ruleset lets it: at once in the city it's standing in, or else it heads for the nearest of the player's cities
//  it can reach that it could join, and joins on arriving. Which cities it could join is for the ruleset's
//  `CanJoinCity` rules (Civ1's: a city under size 10), and which units may join for the rule that offers `JoinCity`.
//  With no city it could join, it waits in the player's city it's in, or heads for the nearest of any, keeping its
//  home: it takes a site or a terrain job on any later turn the survey offers one. It's never disbanded.
import { citiesInReach, firstPath, goAlong } from './standDown';
import { ActionLookup, lookupActions } from '../actionLookup';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import joinableCity from '@civ-clone/base-unit-action-join-city/joinableCity';
import { noOrders } from './orders';

// Whether the ruleset would let `unit` join `city`, were it standing there.
export const couldJoin = (
  dependencies: Dependencies,
  unit: Unit,
  city: City
): boolean =>
  joinableCity(
    unit,
    city.tile(),
    dependencies.cityRegistry,
    dependencies.ruleRegistry
  ) === city;

// Joins the city it's standing in if it's offered the action, or else waits with no orders.
const joinOrWait = (
  dependencies: Dependencies,
  unit: Unit,
  { joinCity }: ActionLookup
): void => {
  if (joinCity) {
    unit.action(joinCity);

    return;
  }

  noOrders(dependencies, unit);
};

// `actions` are what the unit can do where it stands.
export const idleWorker = async (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  actions: ActionLookup
): Promise<void> => {
  if (actions.joinCity) {
    unit.action(actions.joinCity);

    return;
  }

  const tileCity = dependencies.cityRegistry.getByTile(unit.tile()),
    inOwnCity = tileCity?.player() === player,
    cities = citiesInReach(dependencies, player, unit),
    path =
      firstPath(dependencies, unit, cities, (city: City): boolean =>
        couldJoin(dependencies, unit, city)
      ) ??
      (inOwnCity ? null : firstPath(dependencies, unit, cities, () => true));

  if (path) {
    await goAlong(dependencies, player, memory, knowledge, unit, path, () =>
      joinOrWait(dependencies, unit, lookupActions(unit.actions()))
    );

    return;
  }

  noOrders(dependencies, unit);
};

export default idleWorker;
