import { ProductionPolicy } from '../../lib/Civ1/buildItemInCity';
import AIStrategy from '../lib/AIStrategy';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
export declare class ChooseProduction extends AIStrategy {
  private _policyFor;
  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policyFor?: (player: Player) => ProductionPolicy
  );
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<CityBuild>): boolean;
}
export default ChooseProduction;
