// Generic: a unit with no target and no path to follow takes the first mission it qualifies for, then the move executor
//  runs. Handles every unit but one with nothing to do: no mission, nothing to head for and no step worth taking,
//  which it leaves to the next strategy (`StandDown`) rather than have it wander (civ-clone/web-renderer#230). An
//  aircraft is always handled, as before.
import AIStrategy from '../lib/AIStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import assignMission from '../../lib/Unit/assignMission';
import isUnitAction from '../lib/isUnitAction';
import moveUnit, { hasStepWorthTaking } from '../../lib/Unit/moveUnit';
import unitTurnContextFor from '../lib/unitTurnContextFor';

export class MissionAndMove extends AIStrategy {
  handles(action: PlayerAction): boolean {
    return isUnitAction(action);
  }

  async attempt(action: PlayerAction<Unit>): Promise<boolean> {
    const player = action.player(),
      unit = action.value(),
      memory = this.memoryFor(player),
      { target } = unitTurnContextFor(this.dependencies(), action),
      isAircraft = this.knowledge().isAircraft(this.dependencies(), unit);

    // A unit already on its way somewhere keeps going: its path ends where the last mission sent it, and the survey
    //  no longer offers that tile to anyone else.
    if (!target && !memory.unitPathData.has(unit)) {
      assignMission(this.dependencies(), memory, unit);
    }

    if (
      !isAircraft &&
      !target &&
      !memory.unitPathData.has(unit) &&
      !hasStepWorthTaking(
        this.dependencies(),
        player,
        memory,
        this.knowledge(),
        unit
      )
    ) {
      return false;
    }

    await moveUnit(
      this.dependencies(),
      player,
      memory,
      this.knowledge(),
      unit,
      {
        wander: isAircraft,
        // A unit whose path ends with moves to spare and no step worth taking takes its next mission straight away,
        //  rather than standing still for the rest of the turn: an explorer that had walked to the edge of the known
        //  map stopped there until its next turn.
        onIdle: (): boolean => {
          if (memory.unitTargetData.has(unit)) {
            return false;
          }

          assignMission(this.dependencies(), memory, unit);

          return memory.unitPathData.has(unit);
        },
      }
    );

    return true;
  }
}

export default MissionAndMove;
