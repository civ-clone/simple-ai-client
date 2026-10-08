// Civ1: Civ1's answers to the judgements in `Knowledge`, for the generic modules to use.
import {
  shouldBuildCity,
  shouldIrrigate,
  shouldMine,
  shouldRoad,
} from './terrain';
import { aircraftCanReturn, aircraftFuel } from './aircraft';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import assignWorkers from '@civ-clone/civ1-city/lib/assignWorkers';
import civ1MartialLawPolicy from './martialLaw';
import triremeCanReturn from './trireme';
import unitSupport from './unitSupport';

export const civ1Knowledge: Knowledge = {
  assignWorkers: (dependencies, city) =>
    assignWorkers(
      city,
      dependencies.playerWorldRegistry,
      dependencies.cityGrowthRegistry,
      dependencies.workedTileRegistry,
      dependencies.specialistRegistry,
      dependencies.availableSpecialistRegistry
    ),
  canReturnAfter: (dependencies, player, unit, action) =>
    aircraftCanReturn(dependencies, player, unit, action) &&
    triremeCanReturn(dependencies, player, unit, action),
  isAircraft: (dependencies, unit) => aircraftFuel(dependencies, unit) !== null,
  martialLaw: civ1MartialLawPolicy,
  shouldBuildCity,
  shouldIrrigate,
  shouldMine,
  shouldRoad,
  unitSupport,
};

export default civ1Knowledge;
