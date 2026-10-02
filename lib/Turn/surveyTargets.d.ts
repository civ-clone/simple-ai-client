import Memory, { TargetBoard } from '../Memory';
import Dependencies from '../Dependencies';
import Knowledge from '../Knowledge';
import Player from '@civ-clone/core-player/Player';
export interface SurveyNote {
  targets: TargetBoard;
  turn: number;
}
export declare const surveyNoteKey: (player: Player) => string;
export declare const surveyTargets: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge
) => void;
export default surveyTargets;
