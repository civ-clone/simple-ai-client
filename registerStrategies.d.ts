import { Game } from '@civ-clone/core-game';
import Dependencies from './lib/Dependencies';
import Knowledge from './lib/Knowledge';
import Strategy from '@civ-clone/core-strategy/Strategy';
export declare const dependenciesFor: (game: Game) => Dependencies;
export declare const createStrategies: (
  dependencies: Dependencies,
  knowledge?: Knowledge
) => Strategy[];
export declare const register: (game: Game) => void;
export default register;
