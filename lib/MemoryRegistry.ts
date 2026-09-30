// Generic: each player's working memory, created the first time it's asked for and kept as long as the player is.
import { Memory, createMemory } from './Memory';
import Player from '@civ-clone/core-player/Player';

// Keyed by the `Player` object, and players belong to one game, so one registry can serve every game in a process.
//  It keeps no player alive.
export class MemoryRegistry {
  private _memories: WeakMap<Player, Memory> = new WeakMap();

  memoryFor(player: Player): Memory {
    let memory = this._memories.get(player);

    if (!memory) {
      memory = createMemory();

      this._memories.set(player, memory);
    }

    return memory;
  }
}

export const instance = new MemoryRegistry();

export default MemoryRegistry;
