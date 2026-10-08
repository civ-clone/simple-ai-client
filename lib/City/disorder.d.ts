import { IBuildable } from '@civ-clone/core-city-build/Buildable';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory, { UncalmedReason } from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Yield from '@civ-clone/core-yield/Yield';
export type { UncalmedReason };
export interface DisorderPolicy {
  calmingImprovements: IBuildable[];
  purchaseShare: number;
  unhappinessOnGrowth(dependencies: Dependencies, city: City): number;
  wasInDisorder(dependencies: Dependencies, city: City): boolean;
}
export declare const inDisorder: (
  dependencies: Dependencies,
  city: City,
  extraUnhappiness?: number,
  yields?: Yield[]
) => boolean;
export declare const willGrow: (
  dependencies: Dependencies,
  city: City,
  yields?: Yield[]
) => boolean;
export declare const leastValuableWorkedTiles: (
  dependencies: Dependencies,
  city: City
) => Tile[];
export declare const releaseEntertainers: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City
) => void;
export declare const calmCity: (
  dependencies: Dependencies,
  knowledge: Knowledge,
  city: City,
  policy: DisorderPolicy
) => UncalmedReason | null;
export declare const buildToCalm: (
  dependencies: Dependencies,
  city: City,
  improvements: IBuildable[]
) => IBuildable | null;
export declare const hurry: (
  dependencies: Dependencies,
  player: Player,
  city: City,
  share: number
) => number;
export declare const calmCities: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  policy: DisorderPolicy
) => void;
export declare const preventDisorder: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  policy: DisorderPolicy
) => void;
export default preventDisorder;
