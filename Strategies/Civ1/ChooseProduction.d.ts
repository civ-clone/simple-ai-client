import AIStrategy from '../lib/AIStrategy';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
export declare class ChooseProduction extends AIStrategy {
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<CityBuild>): boolean;
}
export default ChooseProduction;
