// Generic: what a unit's turn reads once, at its start, before any of its steps: its tile, target, available actions
//  and the units beside it. Creating it also seeds the unit's move history.
import { ActionLookup, lookupActions } from '../actionLookup';
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

// Create exactly one per unit turn: `unit.actions()` creates `Action`s, whose ids are part of the game's state.
export const createUnitTurnContext = (
  dependencies: Dependencies,
  memory: Memory,
  unit: Unit
): UnitTurnContext => {
  const tile = unit.tile(),
    target = memory.unitTargetData.get(unit),
    actions = unit.actions(),
    lookup = lookupActions(actions),
    tileUnits = dependencies.unitRegistry.getByTile(tile),
    lastUnitMoves = memory.lastUnitMoves.get(unit);

  if (!lastUnitMoves) {
    memory.lastUnitMoves.set(unit, [unit.tile()]);
  }

  return {
    actions: lookup,
    target,
    tile,
    tileUnits,
  };
};

export default createUnitTurnContext;
