// Generic: the base for this package's strategies: a stateless `Strategy` given the shared dependencies and the
//  ruleset's `Knowledge`. The player always comes from the action.
import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import Memory from '../../lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Strategy from '@civ-clone/core-strategy/Strategy';

export class AIStrategy extends Strategy {
  private _dependencies: Dependencies;
  private _knowledge: Knowledge;

  constructor(dependencies: Dependencies, knowledge: Knowledge) {
    super(dependencies.ruleRegistry);

    this._dependencies = dependencies;
    this._knowledge = knowledge;
  }

  protected dependencies(): Dependencies {
    return this._dependencies;
  }

  protected knowledge(): Knowledge {
    return this._knowledge;
  }

  protected memoryFor(player: Player): Memory {
    return this._dependencies.memoryRegistry.memoryFor(player);
  }
}

export default AIStrategy;
