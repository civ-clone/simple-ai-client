import { Attack, Defence } from '@civ-clone/core-unit/Yields';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const ODDS_STRENGTH_SCALE = 8;
export declare const ATTACK_ODDS = 0.6;
export declare const DEFEND_CITY_ODDS = 0.25;
export declare const fightsInRounds: (ruleRegistry: RuleRegistry) => boolean;
export declare const defenderFor: (
  ruleRegistry: RuleRegistry,
  attacker: Unit,
  tileUnits: Unit[]
) => [Unit, Attack, Defence] | null;
export declare const attackOdds: (
  dependencies: Dependencies,
  attacker: Unit,
  tile: Tile
) => number;
export declare const oddsWanted: (
  dependencies: Dependencies,
  player: Player,
  tile: Tile
) => number;
export default attackOdds;
