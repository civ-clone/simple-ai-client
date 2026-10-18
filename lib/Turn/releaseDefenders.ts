// Generic: a city with more fortified defenders than it keeps lets one go now and then, for `StandDown` to send where
//  it's needed (civ-clone/web-renderer#423). v474.05 clears each defender's fortified status one turn in eight, staggered
//  by unit (`AIEngine.cs` ~L925, `(unitID + turn) & 7`), and the unit fortifies again if its city still needs it. Here
//  a city considers it one turn in eight, staggered by city, and releases only a defender it can spare: the weakest,
//  and not one that martial law needs to keep order.
import { defendersIn, defendersKept, keepsOrder } from '../City/defence';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { Fortified } from '@civ-clone/library-unit/UnitImprovements';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';

// A stable number for `city`, to stagger the turns it considers letting a defender go.
const staggerOf = (city: City): number =>
  [...city.id()].reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );

export const releaseDefenders = (
  dependencies: Dependencies,
  player: Player,
  knowledge: Knowledge
): void => {
  const turn = dependencies.turn.value(),
    fortified = (unit: Unit): boolean =>
      dependencies.unitImprovementRegistry
        .getByUnit(unit)
        .some((improvement) => improvement instanceof Fortified);

  dependencies.cityRegistry.getByPlayer(player).forEach((city: City): void => {
    const defenders = defendersIn(dependencies, city),
      spare = defenders.length - defendersKept(dependencies, knowledge, city);

    if (spare <= 0 || (staggerOf(city) + turn) % 8 !== 0) {
      return;
    }

    const [released] = defenders
      .filter(
        (unit: Unit): boolean =>
          unit.player() === player &&
          fortified(unit) &&
          !keepsOrder(dependencies, knowledge, city, unit)
      )
      .sort((a, b) => a.defence().value() - b.defence().value());

    released?.activate();
  });
};

export default releaseDefenders;
