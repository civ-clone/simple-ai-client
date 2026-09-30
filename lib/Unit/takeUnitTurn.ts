// Generic: one unit's turn, a pipeline of steps: seed its move history, unload a transport, a worker's tile work,
//  garrison a city, assign a mission, then the move executor. Worker tile work and mission assignment fall through
//  into the move executor.
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import { Worker } from '@civ-clone/library-unit/Types';
import assignMission from './assignMission';
import garrison from './garrison';
import lookupActions from '../actionLookup';
import moveUnit from './moveUnit';
import settlerWork from './settlerWork';
import unloadTransport from './unloadTransport';

// Not `async`: returns the move executor's own promise when the unit moves, and `null` when its turn ended without
//  moving, so the caller awaits exactly where the inline version did.
export const takeUnitTurn = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit
): Promise<void> | null => {
  const tile = unit.tile(),
    target = memory.unitTargetData.get(unit),
    actions = unit.actions(),
    { buildIrrigation, buildMine, buildRoad, fortify, foundCity, unload } =
      lookupActions(actions),
    tileUnits = dependencies.unitRegistry.getByTile(tile),
    lastUnitMoves = memory.lastUnitMoves.get(unit);

  if (!lastUnitMoves) {
    memory.lastUnitMoves.set(unit, [unit.tile()]);
  }

  if (unloadTransport(memory, unit, tile, unload)) {
    return null;
  }

  if (unit instanceof Worker) {
    settlerWork(dependencies, player, memory, knowledge, unit, tile, target, {
      buildIrrigation,
      buildMine,
      buildRoad,
      foundCity,
    });

    return moveUnit(dependencies, player, memory, knowledge, unit);
  }

  if (garrison(dependencies, unit, tile, tileUnits, fortify)) {
    return null;
  }

  if (!target) {
    assignMission(dependencies, memory, unit);
  }

  return moveUnit(dependencies, player, memory, knowledge, unit);
};

export default takeUnitTurn;
