import { Grassland, Plains } from '@civ-clone/civ1-world/Terrains';
import { civ1TerrainPolicy, shouldIrrigate } from '../lib/Civ1/terrain';
import Action from '@civ-clone/core-unit/Rules/Action';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Monarchy } from '@civ-clone/civ1-government/Governments';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import River from '@civ-clone/base-terrain-feature-river/River';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import { TerrainJobValue } from '@civ-clone/base-strategy-terrain-work/lib/Unit/terrainWork';
import Tile from '@civ-clone/core-world/Tile';
import TransformTerrain from '@civ-clone/base-unit-action-transform-terrain/TransformTerrain';
import Unit from '@civ-clone/core-unit/Unit';
import { expect } from 'chai';
import { terrainConversions } from '@civ-clone/base-unit-action-transform-terrain/lib/conversion';
import unitGame from './lib/unitGame';

//   01234
// 0 GGPPO
// 1 GGPHO
// 2 GGGGO
// A city at 1,1 working the Plains at 2,0, which has no water beside it.
const MAP = '2G2PO2GPHO4GO';

const transformAt = (
  setup: Awaited<ReturnType<typeof unitGame>>,
  x: number,
  y: number
): TerrainJobValue[] =>
  civ1TerrainPolicy
    .jobs(setup.dependencies, setup.player, setup.world.get(x, y))
    .filter(({ improvement }) => improvement === 'transform');

describe('terrain read from the rule set (L24)', (): void => {
  it("should take a river that's a feature of the square (Civ2's) as water for irrigation", async (): Promise<void> => {
    // Grassland with no water anywhere: a city at 3,2, working the square at 3,1.
    const setup = await unitGame('7G7G7G7G7G', 5, 7, Monarchy),
      tile: Tile = setup.world.get(3, 1);

    setup.addCity(3, 2, 1);

    expect(shouldIrrigate(setup.dependencies, setup.player, tile)).false;

    setup.game.terrainFeatures.register(new River(tile.terrain()));

    expect(shouldIrrigate(setup.dependencies, setup.player, tile)).true;
  });

  it('should offer a transform only where the rule set converts the terrain, and the player has a unit that can do it', async (): Promise<void> => {
    const setup = await unitGame(MAP, 3, 5, Monarchy),
      city = setup.addCity(1, 1, 1);

    // Civ1: no conversion by a transform, so nothing is offered, whoever the player has.
    setup.addUnit(Settlers, 1, 1, city);

    expect(transformAt(setup, 2, 0)).eql([]);

    setup.game.rules.register(
      ...terrainConversions('test', TransformTerrain.kind, [
        [Plains, Grassland],
      ])
    );

    // A conversion, but no unit that can do it.
    expect(transformAt(setup, 2, 0)).eql([]);

    // A unit that can, at the rule set's 10 turns of work.
    class Engineers extends Settlers {}

    setup.game.rules.register(
      new Action(
        new Criterion((unit: Unit): boolean => unit instanceof Engineers),
        new Effect(
          (unit: Unit, to: Tile, from: Tile) =>
            new TransformTerrain(
              from,
              to,
              unit,
              setup.game.rules,
              setup.game.turn
            )
        )
      ),
      // As base-unit-movement's job rules do, by the terrain the unit stands on: 10 turns on Plains, 20 elsewhere.
      new MovementCost(
        new Criterion(
          (unit: Unit, action: unknown): boolean =>
            action instanceof TransformTerrain
        ),
        new Effect((unit: Unit): number =>
          unit.tile().terrain() instanceof Plains ? 10 : 20
        )
      )
    );
    setup.game.turn.increment();
    setup.addUnit(Engineers, 1, 1, city);

    const [job] = transformAt(setup, 2, 0);

    // Plains (1 food, 1 shield) to Grassland (2 food): the city works the square. The Engineers stand on the city's
    //  Grassland, but the job is on the Plains, so it takes the Plains' 10 turns.
    expect(job.action).equal('transformTerrain');
    expect(job.turns).equal(10);
    expect(job.value).greaterThan(0);

    // Grassland has no conversion.
    expect(transformAt(setup, 0, 0)).eql([]);
  });
});
