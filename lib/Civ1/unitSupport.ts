// Civ1: the shields one more unit would cost a city to support, by `civ1-city`'s unit support rules
//  (`Rules/City/cost`): under Anarchy and Despotism a city supports as many units as its size for nothing and pays a
//  shield for each one after that; under any other government it pays a shield for every unit. Those rules charge for
//  every unit except `NonCombatant` ones (Diplomats and Caravans), which cost nothing and don't use up a free unit.
import { Anarchy, Despotism } from '@civ-clone/civ1-government/Governments';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import NonCombatant from '@civ-clone/base-unit-trait-non-combatant/NonCombatant';
import Unit from '@civ-clone/core-unit/Unit';
import { hasTrait } from '@civ-clone/core-unit/traits';
import { supported } from '@civ-clone/civ1-city/Rules/City/cost';

// `UnitType`, when given, is the unit in question: a `NonCombatant` one costs nothing whatever the city already
//  supports.
export const unitSupport = (
  dependencies: Dependencies,
  city: City,
  UnitType: typeof Unit | null = null
): number => {
  if (
    UnitType !== null &&
    hasTrait(UnitType, NonCombatant, dependencies.ruleRegistry)
  ) {
    return 0;
  }

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
