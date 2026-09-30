// Generic: one unit's whole turn in one call: read its context (which seeds its move history), unload a transport, a
//  worker's tile work, garrison a city, assign a mission, then the move executor. Worker tile work and mission
//  assignment fall through into the move executor. `SimpleAIClient` runs the same steps as separate strategies.
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Memory from '../Memory';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import { Worker } from '@civ-clone/library-unit/Types';
import assignMission from './assignMission';
import createUnitTurnContext from './unitTurnContext';
import garrison from './garrison';
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
  const {
    actions: {
      buildIrrigation,
      buildMine,
      buildRoad,
      fortify,
      foundCity,
      unload,
    },
    target,
    tile,
    tileUnits,
  } = createUnitTurnContext(dependencies, memory, unit);

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
