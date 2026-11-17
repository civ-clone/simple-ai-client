import { LayoutRegistry } from '@civ-clone/core-spaceship/LayoutRegistry';
import { RequirementRegistry } from '@civ-clone/core-requirement/RequirementRegistry';
import Advance from '@civ-clone/core-science/Advance';
import City from '@civ-clone/core-city/City';
import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Part from '@civ-clone/core-spaceship/Part';
import Player from '@civ-clone/core-player/Player';
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
export type SpaceRaceData = {
  enablers: IBuildable[];
  advances: (typeof Advance)[];
};
export declare const buildsOnDefaultLayout: (
  layoutRegistry: LayoutRegistry
) => boolean;
/**
 * What the rule set says the ship needs, from its `requirements`, when this policy plays the space race: `null` unless
 * the game's layout is Civ1's (`buildsOnDefaultLayout`), every part this policy builds requires an advance and every
 * part requires something built by anyone (`range: 'world'`). Read afresh each time: the entries are a few hundred, and
 * a replaced entry changes no count.
 */
export declare const spaceRaceData: (
  requirementRegistry: RequirementRegistry,
  layoutRegistry?: LayoutRegistry
) => SpaceRaceData | null;
export type FinalYear = (victoryDependencies: VictoryDependencies) => number;
export declare const civ1FinalYear: FinalYear;
export declare const wantedPart: (
  spaceship: Spaceship,
  building: (typeof Part)[]
) => typeof Part | null;
/**
 * Civ1's space race, with what the ship needs from `requirementRegistry`, the layouts from `layoutRegistry` (the
 * game's) and the final year from `finalYear`. Where the game's ship isn't Civ1's (`spaceRaceData` is `null`), it never
 * plays for space: it wants no advance and no enabler, and never launches, as it has no ship.
 */
export declare const createCiv1SpaceRacePolicy: (
  requirementRegistry?: RequirementRegistry,
  finalYear?: FinalYear,
  layoutRegistry?: LayoutRegistry
) => SpaceRacePolicy;
export declare const civ1SpaceRacePolicy: SpaceRacePolicy;
export declare const withSpaceshipDefence: (
  knowledge: Knowledge,
  victoryDependencies: VictoryDependencies,
  isCapital: (dependencies: Dependencies, city: City) => boolean
) => Knowledge;
export default civ1SpaceRacePolicy;
export declare const spaceAdvancesWanted: (
  dependencies: Dependencies,
  victoryDependencies: VictoryDependencies,
  player: Player
) => boolean;
