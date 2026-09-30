import { ActionLookup } from '../actionLookup';
import Dependencies from '../Dependencies';
import Memory from '../Memory';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export interface UnitTurnContext {
  actions: ActionLookup;
  target: Tile | undefined;
  tile: Tile;
  tileUnits: Unit[];
}
export declare const createUnitTurnContext: (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
) => UnitTurnContext;
export default createUnitTurnContext;
