import { TerrainPolicy } from '../../lib/Unit/terrainWork';
import AIStrategy from '../lib/AIStrategy';
import Dependencies from '../../lib/Dependencies';
import Knowledge from '../../lib/Knowledge';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
export declare class TerrainWork extends AIStrategy {
  private _policy;
  constructor(
    dependencies: Dependencies,
    knowledge: Knowledge,
    policy: TerrainPolicy
  );
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction<Unit>): Promise<boolean>;
  private siteInReach;
}
export default TerrainWork;
