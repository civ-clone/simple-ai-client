import { DisorderPolicy } from '../../lib/City/disorder';
import AfterTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn';
import AIStrategy from '../lib/AIStrategy';
import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
export declare class PreventDisorder extends AIStrategy {
  private _policy;
  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy: DisorderPolicy
  );
  handles(action: PlayerAction): boolean;
  attempt(action: AfterTurn): boolean;
}
export default PreventDisorder;
