import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Part from '@civ-clone/core-spaceship/Part';
import { SpaceRacePolicy } from '@civ-clone/base-strategy-victory/lib/Space/SpaceRacePolicy';
import Spaceship from '@civ-clone/core-spaceship/Spaceship';
import VictoryDependencies from '@civ-clone/base-strategy-victory/lib/VictoryDependencies';
export declare const MINIMUM_LAUNCH_CHANCE = 0.4;
export declare const SURE_LAUNCH_CHANCE = 0.75;
export declare const LATE_LAUNCH_YEARS = 10;
export declare const MAXIMUM_STEPS = 4;
export declare const wantedModule: (
  spaceship: Spaceship,
  building: (typeof Part)[]
) => typeof Part | null;
export declare const wantedPart: (
  spaceship: Spaceship,
  building: (typeof Part)[]
) => typeof Part | null;
export declare const civ1SpaceRacePolicy: SpaceRacePolicy;
export declare const withSpaceshipDefence: (
  knowledge: Knowledge,
  victoryDependencies: VictoryDependencies,
  isCapital: (dependencies: Dependencies, city: City) => boolean
) => Knowledge;
export default civ1SpaceRacePolicy;
