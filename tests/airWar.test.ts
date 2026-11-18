// Aircraft, missiles, nuclear weapons and paratroopers at war (civ-clone/web-renderer#1124), only where the ruleset
//  declares unit roles (base-unit-role), as Civ2 does. Built on a small Civ1 game with Civ1's units, with and without
//  roles registered: without them (Civ1 as it is) nothing changes.
import {
  AbrahamLincoln,
  NapoleonI,
} from '@civ-clone/civ1-civilization/Leaders';
import {
  AirSuperiorityRole,
  AttackRole,
  DefendRole,
} from '@civ-clone/base-unit-role/Roles';
import {
  Bomber,
  Fighter,
  Musketman,
  Nuclear,
  Rifleman,
  Warrior,
} from '@civ-clone/civ1-unit/Units';
import { Firepower, HitPoints } from '@civ-clone/core-unit/Yields';
import planAirTask, {
  airKindOf,
  airWanted,
  canStrike,
  fighterTarget,
  isParatrooperType,
  isNuclearTargetCity,
  nuclearTarget,
  paradropTarget,
  raidTarget,
} from '../lib/Unit/airWar';
import { ActiveUnit } from '@civ-clone/civ1-unit/PlayerActions';
import AirWar from '../Strategies/Unit/AirWar';
import City from '@civ-clone/core-city/City';
import Civilization from '@civ-clone/core-civilization/Civilization';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import MilitaryStrength from '@civ-clone/core-power/Rules/MilitaryStrength';
import Fuel from '@civ-clone/base-unit-fuel/lib/Fuel';
import SdiDefence from '@civ-clone/base-city-improvement-sdidefence/SdiDefence';
import Aloft from '@civ-clone/base-unit-fuel/lib/Aloft';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import { withFuel as withFuelKnowledge } from '../lib/Unit/fuel';
import Leader from '@civ-clone/core-civilization/Leader';
import { Monarchy } from '@civ-clone/civ1-government/Governments';
import Never from '@civ-clone/core-diplomacy/Expiries/Never';
import Paradrop from '@civ-clone/base-unit-trait-paradrop/Paradrop';
import Player from '@civ-clone/core-player/Player';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import TraitRegistry from '@civ-clone/core-civilization/TraitRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import UnitYield from '@civ-clone/core-unit/Rules/Yield';
import War from '@civ-clone/base-diplomacy-declaration-war/War';
import Yield from '@civ-clone/core-yield/Yield';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { expect } from 'chai';
import fuelRules from '@civ-clone/base-unit-fuel/lib/fuelRules';
import { refuelInOwnCity } from '@civ-clone/base-unit-fuel/lib/refuel';
import registerTraits from '@civ-clone/civ1-civilization/registerTraits';
import unitGame from './lib/unitGame';
import { unitRole } from '@civ-clone/base-unit-role/Rules/UnitRoles';
import { unitTraits } from '@civ-clone/core-unit/Rules/UnitTraits';

// Moves `unit` to (`x`, `y`) on its own map, returning the tile.
const setupTile = (unit: Unit, x: number, y: number) =>
  unit.tile().map().get(x, y);

// Grassland, 30 by 30, which the player knows all of; its city at (5, 5).
const setUp = async ({
  roles = true,
  leader = NapoleonI as typeof Leader,
}: { roles?: boolean; leader?: typeof Leader } = {}) => {
  const setup = await unitGame('30G'.repeat(30), 30, 30, Monarchy),
    { dependencies, game, player, world } = setup,
    enemy = new Player(game.rules),
    civilization = new Civilization();

  registerTraits(game.traits);
  civilization.setLeader(
    new (leader as unknown as new (registry: TraitRegistry) => Leader)(
      game.traits
    )
  );
  player.setCivilization(civilization);
  game.players.register(enemy);
  game.playerWorlds.register(new PlayerWorld(enemy, world));

  // Hit points and firepower for the odds, as Civ2's units have.
  game.rules.register(
    ...(
      [
        [HitPoints, 10],
        [Firepower, 1],
      ] as [typeof Yield, number][]
    ).map(
      ([YieldType, value]) =>
        new UnitYield(
          new Criterion(
            (unit: Unit, unitYield: Yield): boolean =>
              unitYield instanceof YieldType
          ),
          new Effect((unit: Unit, unitYield: Yield): void =>
            unitYield.set(value)
          )
        )
    )
  );

  if (roles) {
    game.rules.register(
      unitRole('test:role', Fighter, AirSuperiorityRole),
      unitRole('test:role', Bomber, AttackRole),
      unitRole('test:role', Nuclear, AttackRole),
      unitRole('test:role', Rifleman, DefendRole),
      // A Rifleman stands in for a paratrooper.
      ...unitTraits('test:trait', Rifleman, Paradrop)
    );
  }

  const city = setup.addCity(5, 5, 6),
    unitOf = <T extends Unit>(
      owner: Player,
      UnitType: new (...args: any[]) => T,
      x: number,
      y: number
    ): T => {
      const unit = new UnitType(null, owner, world.get(x, y), game.rules);

      if (!game.units.includes(unit)) {
        game.units.register(unit);
      }

      unit.moves().set(unit.movement().value());

      return unit;
    },
    memory = dependencies.memoryRegistry.memoryFor(player),
    // The enemy's units and cities on the player's board, as the survey would put them.
    survey = (): void => {
      memory.targets.enemyUnitsToAttack.splice(
        0,
        Infinity,
        ...[
          ...new Set(
            game.units
              .entries()
              .filter((unit: Unit) => unit.player() === enemy)
              .map((unit: Unit) => unit.tile())
          ),
        ].filter((tile) => game.cities.getByTile(tile) === null)
      );
      memory.targets.enemyCitiesToAttack.splice(
        0,
        Infinity,
        ...game.cities
          .entries()
          .filter((other: City) => other.player() === enemy)
          .map((other: City) => other.tile())
      );
    },
    enemyCity = (x: number, y: number, size = 1): City => {
      const other = new City(
          enemy,
          world.get(x, y),
          '',
          game.rules,
          game.workedTiles
        ),
        growth = game.cityGrowth.getByCity(other);

      if (!game.cities.includes(other)) {
        game.cities.register(other);
      }

      while (growth.size() < size) {
        growth.grow();
      }

      return other;
    },
    declareWar = (): void =>
      game.interactions.register(
        new War(player, enemy, new Never(), game.rules)
      ),
    // Fighters have 1 turn of fuel and refuel in their player's cities.
    withFuel = (): void =>
      game.rules.register(
        new UnitYield(
          new Criterion(
            (unit: Unit): boolean =>
              unit instanceof Fighter || unit instanceof Bomber
          ),
          new Criterion(
            (unit: Unit, unitYield: Yield): boolean => unitYield instanceof Fuel
          ),
          new Effect((unit: Unit, unitYield: Yield): void =>
            unitYield.set(unit instanceof Bomber ? 2 : 1)
          )
        ),
        ...fuelRules({ ruleRegistry: game.rules }, { countOn: 'out-of-moves' }),
        refuelInOwnCity(game.cities)
      );

  return {
    ...setup,
    city,
    declareWar,
    enemy,
    enemyCity,
    memory,
    survey,
    unitOf,
    withFuel,
  };
};

describe('air war (civ-clone/web-renderer#1124)', (): void => {
  describe('kinds, by role', (): void => {
    it('names each kind where the ruleset declares roles, and none without (Civ1)', async (): Promise<void> => {
      const { dependencies } = await setUp(),
        { ruleRegistry } = dependencies;

      expect(airKindOf(Fighter, ruleRegistry)).equal('fighter');
      expect(airKindOf(Bomber, ruleRegistry)).equal('striker');
      expect(airKindOf(Nuclear, ruleRegistry)).equal('nuclear');
      expect(airKindOf(Warrior, ruleRegistry)).null;
      expect(isParatrooperType(Rifleman, ruleRegistry)).true;
      expect(isParatrooperType(Musketman, ruleRegistry)).false;

      const civ1 = (await setUp({ roles: false })).dependencies.ruleRegistry;

      [Fighter, Bomber, Nuclear].forEach(
        (UnitType) => expect(airKindOf(UnitType, civ1)).null
      );
      expect(isParatrooperType(Rifleman, civ1)).false;
    });

    it('handles no unit in a ruleset with no roles (Civ1)', async (): Promise<void> => {
      const { dependencies, player, unitOf } = await setUp({ roles: false }),
        strategy = new AirWar(dependencies, civ1Knowledge);

      [Fighter, Bomber, Nuclear, Rifleman].forEach(
        (UnitType) =>
          expect(
            strategy.handles(
              new ActiveUnit(player, unitOf(player, UnitType as any, 5, 5))
            )
          ).false
      );
    });
  });

  describe('fighters', (): void => {
    it('go for a lone enemy unit, not a stack of ground units', async (): Promise<void> => {
      const { dependencies, enemy, memory, player, survey, unitOf } =
          await setUp(),
        fighter = unitOf(player, Fighter, 5, 5),
        lone = unitOf(enemy, Warrior, 9, 5);

      unitOf(enemy, Warrior, 7, 7);
      unitOf(enemy, Warrior, 7, 7);
      survey();

      expect(fighterTarget(dependencies, player, memory, fighter)).equal(
        lone.tile()
      );
    });

    it('strike only where they can get back to refuel', async (): Promise<void> => {
      const { dependencies, enemy, player, unitOf, withFuel } = await setUp(),
        fighter = unitOf(player, Fighter, 5, 5),
        near = unitOf(enemy, Warrior, 8, 5),
        far = unitOf(enemy, Warrior, 12, 5);

      withFuel();
      fighter.moves().set(10);

      // 3 out, 3 back; 7 out leaves 3, short of the 7 back.
      expect(canStrike(dependencies, player, fighter, near.tile())).true;
      expect(canStrike(dependencies, player, fighter, far.tile())).false;
    });

    it('measure the way home from where they strike, not from the target', async (): Promise<void> => {
      const { dependencies, enemy, player, unitOf, withFuel } = await setUp(),
        // 4 from home, its last move left, and the target on the far side.
        fighter = unitOf(player, Fighter, 9, 5),
        target = unitOf(enemy, Warrior, 10, 5);

      withFuel();
      fighter.moves().set(1);

      expect(canStrike(dependencies, player, fighter, target.tile())).false;

      // 4 moves back from where it strikes: 4 moves aren't enough after the attack, 5 are (from the target it would be
      //  5 and 6).
      fighter.moves().set(4);

      expect(canStrike(dependencies, player, fighter, target.tile())).false;

      fighter.moves().set(5);

      expect(canStrike(dependencies, player, fighter, target.tile())).true;
    });

    it('wait in their city with nothing to strike', async (): Promise<void> => {
      const { dependencies, memory, player, unitOf } = await setUp(),
        fighter = unitOf(player, Fighter, 5, 5);

      expect(planAirTask(dependencies, player, memory, fighter)).eql({
        task: 'stay',
        target: null,
      });
    });
  });

  describe('bombers', (): void => {
    it('raid the defended enemy city in reach that scores best, and leave an empty one to land units', async (): Promise<void> => {
      const setup = await setUp(),
        { dependencies, enemy, enemyCity, memory, player, survey, unitOf } =
          setup,
        bomber = unitOf(player, Bomber, 5, 5),
        small = enemyCity(9, 5, 1),
        large = enemyCity(5, 10, 8);

      enemyCity(12, 12, 8);
      unitOf(enemy, Warrior, 9, 5);
      unitOf(enemy, Warrior, 5, 10);
      survey();

      expect(raidTarget(dependencies, player, memory, bomber)).equal(
        large.tile()
      );

      // Emptied, the large city is no target for a bomber.
      dependencies.unitRegistry
        .getByTile(large.tile())
        .forEach((unit: Unit) => unit.destroy());

      expect(raidTarget(dependencies, player, memory, bomber)).equal(
        small.tile()
      );
    });
  });

  describe('bombers and missiles (fuel)', (): void => {
    it('a bomber, whose attack ends its turn, strikes what it can get home from on its next turn', async (): Promise<void> => {
      const { dependencies, enemy, player, unitOf, withFuel } = await setUp(),
        bomber = unitOf(player, Bomber, 5, 5),
        near = unitOf(enemy, Warrior, 12, 5);

      withFuel();
      bomber.moves().set(8);

      // Beside it at 6 from home, with next turn's 8 moves to get back.
      expect(canStrike(dependencies, player, bomber, near.tile())).true;

      // Out of this turn's moves.
      expect(
        canStrike(
          dependencies,
          player,
          bomber,
          unitOf(enemy, Warrior, 15, 5).tile()
        )
      ).false;
    });
  });

  describe('fuel at its last turn, and missiles', (): void => {
    it('a bomber on its last turn of fuel strikes only from where it refuels', async (): Promise<void> => {
      const { dependencies, enemy, game, player, unitOf, withFuel } =
          await setUp(),
        bomber = unitOf(player, Bomber, 5, 5),
        beside = unitOf(enemy, Warrior, 6, 5),
        further = unitOf(enemy, Warrior, 9, 5);

      withFuel();
      game.unitImprovements.register(new Aloft(bomber, 1));
      bomber.moves().set(8);

      // From its city, beside the first; the second it would strike from the field, with no turn left to get back.
      expect(canStrike(dependencies, player, bomber, beside.tile())).true;
      expect(canStrike(dependencies, player, bomber, further.tile())).false;
    });

    it('a missile needs only to reach its target, and flies there and strikes', async (): Promise<void> => {
      const setup = await setUp(),
        { dependencies, enemy, game, player, survey, unitOf, enemyCity } =
          setup,
        missile = unitOf(player, Bomber, 5, 5),
        target = enemyCity(15, 8, 3),
        taken: string[] = [],
        action = missile.action.bind(missile);

      // A Bomber made a missile: spent in its attack, 1 turn of fuel, 12 moves.
      game.rules.register(
        ...unitTraits('test:missile', Bomber, SingleUse),
        new UnitYield(
          new Criterion((unit: Unit): boolean => unit === missile),
          new Criterion(
            (unit: Unit, unitYield: Yield): boolean => unitYield instanceof Fuel
          ),
          new Effect((unit: Unit, unitYield: Yield): void => unitYield.set(1))
        ),
        ...fuelRules({ ruleRegistry: game.rules }, { countOn: 'out-of-moves' }),
        refuelInOwnCity(game.cities)
      );
      unitOf(enemy, Warrior, 15, 8);
      survey();
      missile.moves().set(12);
      missile.setActive(true);
      missile.action = (performed: any, ...args: any[]): void => {
        taken.push(performed.constructor.name);

        return action(performed, ...args);
      };

      // 10 moves out, off the straight line, and no way back: a fighter couldn't, a missile can.
      expect(airKindOf(Bomber, dependencies.ruleRegistry)).equal('missile');
      expect(canStrike(dependencies, player, missile, target.tile())).true;

      const strategy = new AirWar(
        dependencies,
        withFuelKnowledge(civ1Knowledge)
      );

      for (let i = 0; i < 3 && missile.active() && !missile.destroyed(); i++) {
        await strategy.attempt(new ActiveUnit(player, missile));
      }

      expect(taken).include('Attack');
      expect(taken.filter((name) => name === 'NoOrders')).empty;
    });
  });

  describe('the strategy with fuel', (): void => {
    it('strikes beside its target with the moves to get back, and heads home without them', async (): Promise<void> => {
      const { dependencies, enemy, player, survey, unitOf, withFuel } =
          await setUp(),
        fighter = unitOf(player, Fighter, 8, 5),
        taken: string[] = [],
        action = fighter.action.bind(fighter);

      withFuel();
      unitOf(enemy, Warrior, 9, 5);
      survey();
      fighter.action = (performed: any, ...args: any[]): void => {
        taken.push(performed.constructor.name);

        return action(performed, ...args);
      };

      const strategy = new AirWar(
        dependencies,
        withFuelKnowledge(civ1Knowledge)
      );

      // 3 from home: with 3 moves it can't strike and get back, so it turns for home.
      fighter.moves().set(3);
      fighter.setActive(true);

      expect(await strategy.attempt(new ActiveUnit(player, fighter))).true;
      expect(taken).not.include('Attack');
      expect(taken[0]).equal('Move');
      expect(fighter.tile().x()).below(8);

      // Back beside it with 10 moves, it strikes.
      taken.splice(0);
      fighter.setTile(setupTile(fighter, 8, 5));
      fighter.moves().set(10);
      fighter.setActive(true);

      await strategy.attempt(new ActiveUnit(player, fighter));

      expect(taken).eql(['Attack']);
    });
  });

  describe('nuclear weapons', (): void => {
    const withTarget = async (leader: typeof Leader = NapoleonI) => {
      const setup = await setUp({ leader }),
        { declareWar, enemy, enemyCity, unitOf, player } = setup,
        target = enemyCity(10, 5, 8);

      declareWar();
      // Each unit counts 1 towards its player's military: the enemy's 4 against the player's 2 weapons.
      setup.game.rules.register(
        new MilitaryStrength(new Effect(() => ({ attack: 1, defence: 0 })))
      );
      // The enemy's army has no nuclear weapons.
      unitOf(enemy, Musketman, 10, 5);
      unitOf(enemy, Musketman, 11, 5);
      unitOf(enemy, Musketman, 11, 6);
      unitOf(enemy, Musketman, 9, 4);

      const first = unitOf(player, Nuclear, 5, 5);

      return { ...setup, first, target };
    };

    it("go for a large enemy city at war, an aggressive leader's, with two or more", async (): Promise<void> => {
      const { dependencies, first, player, target, unitOf } =
        await withTarget();

      // One alone isn't fired.
      expect(nuclearTarget(dependencies, player, first)).null;

      unitOf(player, Nuclear, 5, 5);

      expect(nuclearTarget(dependencies, player, first)).equal(target.tile());
    });

    it('leave out a small city, one with an SDI Defence, and one of a much weaker player', async (): Promise<void> => {
      const { dependencies, game, player, target, enemyCity, enemy, unitOf } =
        await withTarget();

      expect(isNuclearTargetCity(dependencies, player, target)).true;
      expect(isNuclearTargetCity(dependencies, player, enemyCity(20, 20, 4)))
        .false;

      game.cityImprovements.register(new SdiDefence(target, game.rules));

      expect(isNuclearTargetCity(dependencies, player, target)).false;

      // The player's own army: now the enemy's 4 is less than half its 10.
      for (let i = 0; i < 8; i++) {
        unitOf(player, Musketman, 5, 5);
      }

      const other = enemyCity(20, 5, 8);

      expect(isNuclearTargetCity(dependencies, player, other)).false;
    });

    it("are never fired by a leader who isn't aggressive", async (): Promise<void> => {
      const { dependencies, first, player, unitOf } = await withTarget(
        AbrahamLincoln
      );

      unitOf(player, Nuclear, 5, 5);

      expect(nuclearTarget(dependencies, player, first)).null;
      expect(
        airWanted(
          dependencies,
          player,
          dependencies.memoryRegistry.memoryFor(player).targets,
          dependencies.cityRegistry.getByPlayer(player)[0],
          'nuclear',
          16
        )
      ).null;
    });
  });

  describe('paratroopers', (): void => {
    it('drop into an empty enemy city at war in range, from their city with all their moves', async (): Promise<void> => {
      const { declareWar, dependencies, enemyCity, player, unitOf } =
          await setUp(),
        paratrooper = unitOf(player, Rifleman, 5, 5),
        target = enemyCity(12, 5, 3);

      unitOf(player, Musketman, 5, 5);

      // Not without a war.
      expect(paradropTarget(dependencies, player, paratrooper)).null;

      declareWar();

      expect(paradropTarget(dependencies, player, paratrooper)).equal(
        target.tile()
      );

      // Not as its city's last defender.
      dependencies.unitRegistry
        .getByTile(paratrooper.tile())
        .filter((unit: Unit) => unit instanceof Musketman)
        .forEach((unit: Unit) => unit.destroy());

      expect(paradropTarget(dependencies, player, paratrooper)).null;

      unitOf(player, Musketman, 5, 5);

      paratrooper.moves().set(0.5);

      expect(paradropTarget(dependencies, player, paratrooper)).null;
    });
  });

  describe('the strategy', (): void => {
    const spy = (unit: Unit): string[] => {
      const taken: string[] = [],
        action = unit.action.bind(unit);

      unit.action = (performed: any, ...args: any[]): void => {
        taken.push(performed.constructor.name);

        return action(performed, ...args);
      };

      return taken;
    };

    it('strikes a lone enemy unit beside a fighter', async (): Promise<void> => {
      const { dependencies, enemy, player, survey, unitOf } = await setUp(),
        fighter = unitOf(player, Fighter, 5, 5),
        taken = spy(fighter);

      unitOf(enemy, Warrior, 6, 5);
      survey();
      fighter.setActive(true);

      expect(
        await new AirWar(dependencies, civ1Knowledge).attempt(
          new ActiveUnit(player, fighter)
        )
      ).true;
      expect(taken).eql(['Attack']);
    });

    it('stands an aircraft down in its city with nothing to strike', async (): Promise<void> => {
      const { dependencies, player, unitOf } = await setUp(),
        bomber = unitOf(player, Bomber, 5, 5),
        taken = spy(bomber);

      bomber.setActive(true);

      expect(
        await new AirWar(dependencies, civ1Knowledge).attempt(
          new ActiveUnit(player, bomber)
        )
      ).true;
      expect(taken).eql(['NoOrders']);
    });

    it('leaves a paratrooper with nowhere to drop to the other strategies', async (): Promise<void> => {
      const { dependencies, player, unitOf } = await setUp(),
        paratrooper = unitOf(player, Rifleman, 5, 5);

      expect(
        await new AirWar(dependencies, civ1Knowledge).attempt(
          new ActiveUnit(player, paratrooper)
        )
      ).false;
    });
  });
});
