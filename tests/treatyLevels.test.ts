import { Overruled, SneakAttack } from '@civ-clone/library-unit/Actions';
import unitGame, { UnitGame } from './lib/unitGame';
import Action from '@civ-clone/core-unit/Action';
import Alliance from '@civ-clone/base-diplomacy-declaration-alliance/Alliance';
import Ceasefire from '@civ-clone/base-diplomacy-declaration-ceasefire/Ceasefire';
import City from '@civ-clone/core-city/City';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Never from '@civ-clone/core-diplomacy/Expiries/Never';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { Warrior } from '@civ-clone/civ1-unit/Units';
import { actionToTake } from '../lib/Unit/moveUnit';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { expect } from 'chai';
import { hasTreaty, isAlly } from '../lib/Player/treaties';
import { isEnemy } from '../lib/Player/rivals';
import scoreUnitMove, { ALLIED_REPAIR_SCORE } from '../lib/Unit/scoreUnitMove';
import surveyTargets from '../lib/Turn/surveyTargets';
import { threatened } from '../lib/Civ1/defence';

// Civ2's own action on an ally's city (civ2-unit's `AlliedRepair`): the AI knows it only by its name.
class AlliedRepair extends Action {}

// A Caravan's own action in a city (civ2-unit's trade route or help with a Wonder), offered there instead of the repair.
class HelpBuildWonder extends Action {}

// A blocked attack on a player with no treaty and no war (civ2-unit's `UndeclaredAttack`, a `SneakAttack`).
class UndeclaredAttack extends SneakAttack {}

type Setup = UnitGame & {
  other: Player;
  otherCity: City;
  treaty: (Declaration: typeof Peace | typeof Ceasefire) => void;
  warrior: Unit;
};

// The player's Warrior at (1, 1), its city at (0, 0), and another player's city at (2, 1) with a Warrior of its own.
const setUp = async (): Promise<Setup> => {
  const setup = await unitGame('16G', 4, 4, Despotism),
    { game, world } = setup,
    other = new Player(game.rules);

  game.players.register(other);
  game.playerWorlds.register(new PlayerWorld(other, world));

  setup.addCity(0, 0);

  const otherCity = new City(
    other,
    world.get(2, 1),
    'Ally',
    game.rules,
    game.workedTiles
  );

  if (!game.cities.includes(otherCity)) {
    game.cities.register(otherCity);
  }

  const otherWarrior = new Warrior(
    otherCity,
    other,
    otherCity.tile(),
    game.rules
  );

  if (!game.units.includes(otherWarrior)) {
    game.units.register(otherWarrior);
  }

  return {
    ...setup,
    other,
    otherCity,
    treaty: (Declaration: typeof Peace | typeof Ceasefire): void =>
      game.interactions.register(
        new Declaration(setup.player, other, new Never(), game.rules)
      ),
    warrior: setup.addUnit(Warrior, 1, 1),
  };
};

describe('treaty levels (Civ2 M2d)', (): void => {
  it('counts a ceasefire, a peace and an alliance as treaties, and only an alliance as allies', async (): Promise<void> => {
    for (const [Declaration, treaty, ally] of [
      [null, false, false],
      [Ceasefire, true, false],
      [Peace, true, false],
      [Alliance, true, true],
    ] as [typeof Peace | null, boolean, boolean][]) {
      const { dependencies, other, player, treaty: sign } = await setUp();

      if (Declaration) {
        sign(Declaration);
      }

      expect(hasTreaty(dependencies, player, other)).to.equal(treaty);
      expect(isEnemy(dependencies, player, other)).to.equal(!treaty);
      expect(isAlly(dependencies, player, other)).to.equal(ally);
    }
  });

  it("doesn't count a ceasefire partner's or an ally's unit next to a city as a threat", async (): Promise<void> => {
    for (const [Declaration, threat] of [
      [null, true],
      [Peace, false],
      [Ceasefire, false],
      [Alliance, false],
    ] as [typeof Peace | null, boolean][]) {
      const { dependencies, game, other, player, treaty, world } =
          await setUp(),
        city = game.cities.getByTile(world.get(0, 0))!,
        visitor = new Warrior(null, other, world.get(1, 0), game.rules);

      if (!game.units.includes(visitor)) {
        game.units.register(visitor);
      }

      if (Declaration) {
        treaty(Declaration);
      }

      expect(city.player()).to.equal(player);
      expect(threatened(dependencies, city)).to.equal(threat);
    }
  });
});

describe('allied repair (Civ2 M2d)', (): void => {
  const repairAt = (unit: Unit, tile: Tile, setup: Setup): AlliedRepair =>
    new AlliedRepair(unit.tile(), tile, unit, setup.game.rules);

  const score = (setup: Setup, unit: Unit, tile: Tile): number =>
    scoreUnitMove(
      setup.dependencies,
      setup.player,
      setup.dependencies.memoryRegistry.memoryFor(setup.player),
      civ1Knowledge,
      unit,
      tile
    );

  it("rules out a step onto an ally's city for a whole unit, and takes it to repair a damaged one", async (): Promise<void> => {
    const setup = await setUp(),
      { dependencies, otherCity, player, treaty, warrior } = setup,
      repair = repairAt(warrior, otherCity.tile(), setup);

    treaty(Alliance);

    // Only the repair is offered there, as Civ2's rules offer it.
    warrior.actions = () => [repair];

    expect(score(setup, warrior, otherCity.tile())).to.equal(-10);
    expect(actionToTake(dependencies, player, [repair])).null;

    warrior.setDamage(3);

    expect(score(setup, warrior, otherCity.tile())).to.equal(
      ALLIED_REPAIR_SCORE
    );
    expect(actionToTake(dependencies, player, [repair])).to.equal(repair);
  });

  it("leaves a unit the repair isn't offered to its own action in an ally's city, such as a Caravan's", async (): Promise<void> => {
    const setup = await setUp(),
      { dependencies, otherCity, player, treaty, warrior } = setup,
      help = new HelpBuildWonder(
        warrior.tile(),
        otherCity.tile(),
        warrior,
        setup.game.rules
      );

    treaty(Alliance);

    warrior.actions = () => [help];

    expect(score(setup, warrior, otherCity.tile())).to.not.equal(-10);
    expect(actionToTake(dependencies, player, [help])).to.equal(help);
  });

  it("doesn't change a step onto a city with no alliance (Civ1)", async (): Promise<void> => {
    const setup = await setUp(),
      { dependencies, otherCity, player, treaty, warrior } = setup,
      repair = repairAt(warrior, otherCity.tile(), setup);

    treaty(Peace);

    expect(actionToTake(dependencies, player, [repair])).to.equal(repair);
  });

  it("takes an ally's cities and units off the board of targets", async (): Promise<void> => {
    for (const [Declaration, targeted] of [
      [null, true],
      [Peace, true],
      [Alliance, false],
    ] as [typeof Peace | null, boolean][]) {
      const setup = await setUp(),
        { dependencies, otherCity, player, treaty } = setup,
        memory = dependencies.memoryRegistry.memoryFor(player),
        { targets } = memory;

      if (Declaration) {
        treaty(Declaration);
      }

      // The ally's city was ours once.
      (otherCity as unknown as { _originalPlayer: Player })._originalPlayer =
        player;

      surveyTargets(dependencies, player, memory, civ1Knowledge);

      const listed = [
        ...targets.citiesToLiberate,
        ...targets.enemyCitiesToAttack,
      ].includes(otherCity.tile());

      expect(listed).to.equal(targeted);
    }
  });
});

describe('treaty-breaking rows (Civ2 M2d)', (): void => {
  it('never takes a blocked attack on a player it has no treaty with, plain or overruled', async (): Promise<void> => {
    const setup = await setUp(),
      { dependencies, other, otherCity, player, warrior } = setup,
      undeclared = Object.assign(
        new UndeclaredAttack(
          warrior.tile(),
          otherCity.tile(),
          warrior,
          setup.game.rules
        ),
        { _enemy: other }
      ),
      overruled = Object.assign(Object.create(Overruled.prototype), {
        _action: undeclared,
        _partner: other,
      }) as Action;

    expect(actionToTake(dependencies, player, [undeclared])).null;
    expect(actionToTake(dependencies, player, [overruled])).null;

    // The AI's own players are never asked their Senate, but a blocked attack still scores below anything.
    warrior.actions = () => [overruled];

    expect(
      scoreUnitMove(
        dependencies,
        player,
        dependencies.memoryRegistry.memoryFor(player),
        civ1Knowledge,
        warrior,
        otherCity.tile()
      )
    ).to.equal(-10);
  });
});
