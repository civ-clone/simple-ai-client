import captured from './Rules/City/captured';
import destroyed from './Rules/City/destroyed';
import defeated from './Rules/Unit/defeated';
import { Game, defaultGame } from '@civ-clone/core-game';

export const register = (game: Game): void =>
  game.rules.register(
    ...captured(game.units, game.clients),
    ...defeated(game.units, game.clients),
    ...destroyed(game.units, game.clients)
  );

// The plugin loader imports each package for this side effect. Until it passes
// a `Game` of its own, dropping it would produce a game with silently absent
// rules — no error, just wrong behaviour.
register(defaultGame);

export default register;
