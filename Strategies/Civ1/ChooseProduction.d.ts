import { ProductionPolicy } from '../../lib/Civ1/buildItemInCity';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
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
  attempt(action: PlayerAction<CityBuild> | BeforeTurn): boolean;
  reviewCapitalization(player: Player): void;
  choose(player: Player, city: City): void;
}
export default ChooseProduction;
