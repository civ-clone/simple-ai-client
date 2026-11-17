import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import { TradeRouteRegistry } from '@civ-clone/core-city/TradeRouteRegistry';
import Unit from '@civ-clone/core-unit/Unit';
export declare const tradeRoutesMatter: (ruleRegistry: RuleRegistry) => boolean;
export declare const missionsChosen: (ruleRegistry: RuleRegistry) => boolean;
export declare const isTrader: (
  unit: Unit | typeof Unit,
  ruleRegistry: RuleRegistry
) => boolean;
export declare const isAgent: (
  unit: Unit | typeof Unit,
  ruleRegistry: RuleRegistry
) => boolean;
export declare const isEnvoy: (
  dependencies: Dependencies,
  unit: Unit
) => boolean;
export declare const baseTradeOf: (
  dependencies: Dependencies,
  city: City
) => number;
export declare const knownCitiesOn: (
  dependencies: Dependencies,
  player: Player,
  land: Set<Tile>
) => City[];
export declare const robbed: (
  dependencies: Dependencies,
  city: City
) => boolean;
export declare const routeScore: (
  dependencies: Dependencies,
  player: Player,
  home: City,
  city: City,
  tradeRouteRegistry?: TradeRouteRegistry,
  homeTrade?: number
) => number;
export declare const routeHome: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit
) => City | null;
export declare const rankPartners: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  candidates: City[]
) => [City, number][];
export declare const routePartner: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  candidates?: City[]
) => City | null;
export declare const missionTarget: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  candidates?: City[]
) => City | null;
export declare const missionFor: (
  dependencies: Dependencies,
  unit: Unit,
  city: City,
  offered: Action[],
  choose?: () => string | undefined
) => Action | null;
export declare const routeFor: (offered: Action[]) => Action | null;
export declare const isCovert: (
  type: Unit | typeof Unit,
  ruleRegistry: RuleRegistry
) => boolean;
export declare const wantsTrader: (
  dependencies: Dependencies,
  player: Player,
  city: City,
  ownTraders: number,
  tradeRouteRegistry?: TradeRouteRegistry
) => boolean;
export declare const wantsAgent: (
  dependencies: Dependencies,
  player: Player,
  city: City,
  agents: number,
  agentsOnOrder: number
) => boolean;
export declare const REFUSAL_TURNS = 10;
export declare const refuseTarget: (
  dependencies: Dependencies,
  unit: Unit,
  city: City
) => void;
export declare const refusedTarget: (
  dependencies: Dependencies,
  unit: Unit,
  city: City
) => boolean;
export declare const TRADE_TARGETS = 3;
export declare const tradeTargets: (
  dependencies: Dependencies,
  player: Player,
  unit: Unit,
  refused?: (city: City) => boolean
) => Tile[];
