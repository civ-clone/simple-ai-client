// Civ1: Civ1's answers to the judgements in `Knowledge`, for the generic modules to use.
import {
  shouldBuildCity,
  shouldIrrigate,
  shouldMine,
  shouldRoad,
} from './terrain';
import { aircraftCanReturn, aircraftFuel } from './aircraft';
import Knowledge from '../Knowledge';
import assignWorkers from '@civ-clone/civ1-city/lib/assignWorkers';

export const civ1Knowledge: Knowledge = {
  assignWorkers: (dependencies, city) =>
    assignWorkers(
      city,
      dependencies.playerWorldRegistry,
      dependencies.cityGrowthRegistry,
      dependencies.workedTileRegistry
    ),
  canReturnAfter: aircraftCanReturn,
  isAircraft: (dependencies, unit) => aircraftFuel(dependencies, unit) !== null,
  shouldBuildCity,
  shouldIrrigate,
  shouldMine,
  shouldRoad,
};

export default civ1Knowledge;
