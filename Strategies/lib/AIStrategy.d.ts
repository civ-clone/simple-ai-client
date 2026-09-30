import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import Memory from '../../lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Strategy from '@civ-clone/core-strategy/Strategy';
export declare class AIStrategy extends Strategy {
  private _dependencies;
  private _knowledge;
  constructor(dependencies: Dependencies, knowledge: Knowledge);
  protected dependencies(): Dependencies;
  protected knowledge(): Knowledge;
  protected memoryFor(player: Player): Memory;
}
export default AIStrategy;
