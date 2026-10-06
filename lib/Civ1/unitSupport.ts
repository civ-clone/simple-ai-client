// Civ1: the shields one more unit would cost a city to support, by `civ1-city`'s unit support rules
//  (`Rules/City/cost`): under Anarchy and Despotism a city supports as many units as its size for nothing and pays a
//  shield for each one after that; under any other government it pays a shield for every unit. Those rules charge for
//  every aircraft, ship, worker and `Fortifiable` unit except `Diplomatic` ones (Diplomats and Caravans), which cost
//  nothing and don't use up a free unit.
import {
  Air,
  Diplomatic,
  Fortifiable,
  Naval,
  Worker,
} from '@civ-clone/library-unit/Types';
import { Anarchy, Despotism } from '@civ-clone/civ1-government/Governments';
import City from '@civ-clone/core-city/City';
import Dependencies from '../Dependencies';
import Unit from '@civ-clone/core-unit/Unit';

const supported = (unit: Unit): boolean =>
  [Air, Fortifiable, Naval, Worker].some(
    (UnitType: typeof Unit): boolean => unit instanceof UnitType
  ) && !(unit instanceof Diplomatic);

export const unitSupport = (dependencies: Dependencies, city: City): number => {
  if (
    !dependencies.playerGovernmentRegistry
      .getByPlayer(city.player())
      .is(Anarchy, Despotism)
  ) {
    return 1;
  }

  return dependencies.unitRegistry.getByCity(city).filter(supported).length >=
    dependencies.cityGrowthRegistry.getByCity(city).size()
    ? 1
    : 0;
};

export default unitSupport;
