import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import BeforeTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/BeforeTurn';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { DisorderPolicy } from '../../lib/City/disorder';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
export declare class NoteDisorder extends AIStrategy {
  private _policy;
  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy: DisorderPolicy
  );
  handles(action: PlayerAction): boolean;
  attempt(action: BeforeTurn): boolean;
}
export default NoteDisorder;
