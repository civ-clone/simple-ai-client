import { Memory } from './Memory';
import Player from '@civ-clone/core-player/Player';
export declare class MemoryRegistry {
  private _memories;
  memoryFor(player: Player): Memory;
}
export declare const instance: MemoryRegistry;
export default MemoryRegistry;
