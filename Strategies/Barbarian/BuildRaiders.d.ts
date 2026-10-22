import BuildItem from '@civ-clone/core-city-build/BuildItem';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Strategy from '@civ-clone/core-strategy/Strategy';
export declare class BuildRaiders extends Strategy {
  private _dependencies;
  constructor(dependencies: Dependencies);
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<CityBuild>): boolean;
  choose(available: BuildItem[]): BuildItem | null;
}
export default BuildRaiders;
