// The computer players in a ruleset with Civ2's combat and units (civ-clone/web-renderer#1007, M2b): battles in rounds
//  with hit points and firepower, damage and healing, and aircraft fuel. Each is built here from its base package on top
//  of a small Civ1 game, as a ruleset would register it, and checked against the same game without it.
import {
  ATTACK_ODDS,
  DEFEND_CITY_ODDS,
  attackOdds,
  defenderFor,
  fightsInRounds,
} from '../lib/Unit/attackOdds';
import { Attack as AttackAction } from '@civ-clone/library-unit/Actions';
import {
  Carrier,
  Fighter,
  Knight,
  Musketman,
  Spearman,
  Transport,
  Warrior,
} from '@civ-clone/civ1-unit/Units';
import { Firepower, HitPoints } from '@civ-clone/core-unit/Yields';
import { fuelCanReturn, fuelFor, withFuel } from '../lib/Unit/fuel';
import { healsThisTurn, healingCities } from '../lib/Unit/retreatToHeal';
import { refuelInOwnCity } from '@civ-clone/base-unit-fuel/lib/refuel';
import { carriesUnits, isFerry, isFerryType } from '../lib/Unit/carriesUnits';
import Action from '@civ-clone/core-unit/Action';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import { unitTraits } from '@civ-clone/core-unit/Rules/UnitTraits';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Fuel from '@civ-clone/base-unit-fuel/lib/Fuel';
import { Monarchy } from '@civ-clone/civ1-government/Governments';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import UnitYield from '@civ-clone/core-unit/Rules/Yield';
import Yield from '@civ-clone/core-yield/Yield';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { combatOdds } from '@civ-clone/base-combat-rounds/lib/rounds';
import combatRoundsRules from '@civ-clone/base-combat-rounds/lib/combatRoundsRules';
import { expect } from 'chai';
import fuelRules from '@civ-clone/base-unit-fuel/lib/fuelRules';
import scoreUnitMove from '../lib/Unit/scoreUnitMove';
import unitGame, { UnitGame } from './lib/unitGame';

// Every unit has `hitPoints` and `firepower`, as Civ2's units do (10 and 1 here).
const hitPointsAndFirepower = (hitPoints = 10, firepower = 1): UnitYield[] =>
  (
    [
      [HitPoints, hitPoints],
      [Firepower, firepower],
    ] as [typeof Yield, number][]
  ).map(
    ([YieldType, value]) =>
      new UnitYield(
        new Criterion(
          (unit: Unit, unitYield: Yield): boolean =>
            unitYield instanceof YieldType
        ),
        new Effect((unit: Unit, unitYield: Yield): void => unitYield.set(value))
      )
  );

// Battles in rounds at 8 steps to 1, as Civ2 registers them.
const fightInRounds = ({ game }: UnitGame): void =>
  game.rules.register(
    ...hitPointsAndFirepower(),
    ...combatRoundsRules({ ruleRegistry: game.rules }, { strengthScale: 8 })
  );

const rivalUnit = <T extends Unit>(
  { game, world }: UnitGame,
  rival: Player,
  UnitType: new (...args: any[]) => T,
  x: number,
  y: number
): T => {
  const unit = new UnitType(null, rival, world.get(x, y), game.rules);

  game.units.register(unit);

  return unit;
};

describe('rounds mechanisms', (): void => {
  describe('attack odds', (): void => {
    it('should weigh attacks as before with no CombatResolver, and by the odds with one', async (): Promise<void> => {
      const setup = await unitGame('30G', 1, 30, Monarchy),
        { addUnit, dependencies, player } = setup,
        memory = dependencies.memoryRegistry.memoryFor(player),
        rival = new Player(dependencies.ruleRegistry),
        knights = addUnit(Knight, 5, 0),
        target = rivalUnit(setup, rival, Musketman, 6, 0);

      knights.moves().set(knights.movement().value());

      expect(fightsInRounds(dependencies.ruleRegistry)).false;
      expect(
        knights
          .actions(target.tile())
          .some((action: Action) => action instanceof AttackAction)
      ).true;

      // Knight (4) against Musketman (3): a single roll the strength comparison likes.
      const singleRoll = scoreUnitMove(
        dependencies,
        player,
        memory,
        civ1Knowledge,
        knights,
        target.tile()
      );

      expect(singleRoll).above(0);

      fightInRounds(setup);

      expect(fightsInRounds(dependencies.ruleRegistry)).true;

      const odds = attackOdds(dependencies, knights, target.tile()),
        [defender, attack, defence] = defenderFor(
          dependencies.ruleRegistry,
          knights,
          [target]
        )!;

      expect(defender).equal(target);
      // The same arithmetic the resolver fights with.
      expect(odds).closeTo(
        combatOdds(
          Math.trunc(attack.value() * 8),
          Math.trunc(defence.value() * 8),
          10,
          10,
          1,
          1
        ),
        1e-9
      );

      // In rounds, 4 against 3 at 10 hit points each wins most of the time: an attack worth making.
      expect(odds).above(ATTACK_ODDS);
      expect(
        scoreUnitMove(
          dependencies,
          player,
          memory,
          civ1Knowledge,
          knights,
          target.tile()
        )
      ).above(0);

      // Badly damaged, the same Knight would lose: the attack is ruled out.
      knights.setDamage(8);

      expect(attackOdds(dependencies, knights, target.tile())).below(
        DEFEND_CITY_ODDS
      );
      expect(
        scoreUnitMove(
          dependencies,
          player,
          memory,
          civ1Knowledge,
          knights,
          target.tile()
        )
      ).below(0);
    });

    it('should attack at worse odds an enemy beside one of its cities', async (): Promise<void> => {
      const setup = await unitGame('30G', 1, 30, Monarchy),
        { addCity, addUnit, dependencies, player } = setup,
        memory = dependencies.memoryRegistry.memoryFor(player),
        rival = new Player(dependencies.ruleRegistry),
        warrior = addUnit(Warrior, 5, 0),
        target = rivalUnit(setup, rival, Warrior, 6, 0);

      fightInRounds(setup);
      warrior.moves().set(1);

      const odds = attackOdds(dependencies, warrior, target.tile()),
        score = () =>
          scoreUnitMove(
            dependencies,
            player,
            memory,
            civ1Knowledge,
            warrior,
            target.tile()
          );

      // Equal units: ties go to the defender, so the attacker is a little under even.
      expect(odds).below(ATTACK_ODDS).above(DEFEND_CITY_ODDS);
      expect(score()).below(0);

      addCity(7, 0);

      expect(score()).above(0);
    });
  });

  describe('retreat to heal', (): void => {
    it('should rest a damaged unit in a city, and send one badly damaged in the field to the city with Barracks', async (): Promise<void> => {
      const setup = await unitGame('30G', 1, 30, Monarchy),
        { addCity, addUnit, dependencies, game, player, takeTurns, world } =
          setup,
        near = addCity(2, 0),
        withBarracks = addCity(9, 0),
        phalanx = addUnit(Spearman, 6, 0),
        resting = addUnit(Spearman, 2, 0);

      game.rules.register(...hitPointsAndFirepower());
      game.cityImprovements.register(new Barracks(withBarracks, game.rules));

      // Undamaged, neither is handled.
      expect(healsThisTurn(dependencies, phalanx)).false;
      expect(healsThisTurn(dependencies, resting)).false;

      // Lightly damaged: one in a city rests until it's whole, one in the field carries on.
      phalanx.setDamage(4);
      resting.setDamage(1);

      expect(healsThisTurn(dependencies, phalanx)).false;
      expect(healsThisTurn(dependencies, resting)).true;

      phalanx.setDamage(6);

      expect(healsThisTurn(dependencies, phalanx)).true;
      // Three squares further, but with Barracks.
      expect(healingCities(dependencies, player, phalanx)).eql([
        withBarracks,
        near,
      ]);

      await takeTurns(3);

      expect(resting.tile()).equal(world.get(2, 0));
      expect(phalanx.tile()).equal(withBarracks.tile());
    });
  });

  describe('fuel', (): void => {
    it('should keep an aircraft with base-unit-fuel within reach of somewhere it refuels', async (): Promise<void> => {
      const setup = await unitGame('30G', 1, 30, Monarchy),
        { addCity, addUnit, dependencies, game, player, world } = setup,
        rival = new Player(dependencies.ruleRegistry),
        fighter = addUnit(Fighter, 5, 0),
        move = (x: number): Action =>
          ({ to: () => world.get(x, 0) } as unknown as Action);

      addCity(0, 0);

      // Civ1's fighters have no `Fuel`: civ1's own count decides, as before.
      expect(fuelFor(dependencies, fighter)).null;
      expect(fuelCanReturn(dependencies, player, fighter, move(6))).null;

      game.rules.register(
        new UnitYield(
          new Criterion((unit: Unit): boolean => unit instanceof Fighter),
          new Criterion(
            (unit: Unit, unitYield: Yield): boolean => unitYield instanceof Fuel
          ),
          new Effect((unit: Unit, unitYield: Yield): void => unitYield.set(1))
        ),
        ...fuelRules({ ruleRegistry: game.rules }, { countOn: 'out-of-moves' }),
        refuelInOwnCity(game.cities)
      );

      fighter.moves().set(5);

      expect(fuelFor(dependencies, fighter)).not.null;
      // 4 moves left after the step: back to the city at 0 from 4 but not from 6.
      expect(fuelCanReturn(dependencies, player, fighter, move(4))).true;
      expect(fuelCanReturn(dependencies, player, fighter, move(6))).false;

      // An attack is fought from where it stands: 4 moves left, 5 squares from home.
      rivalUnit(setup, rival, Warrior, 4, 0);
      expect(fuelCanReturn(dependencies, player, fighter, move(4))).false;

      fighter.moves().set(6);
      expect(fuelCanReturn(dependencies, player, fighter, move(4))).true;

      const knowledge = withFuel(civ1Knowledge);

      expect(knowledge.isAircraft(dependencies, fighter)).true;
      expect(knowledge.canReturnAfter(dependencies, player, fighter, move(6)))
        .false;
    });
  });
  describe('missiles', (): void => {
    it('should let a missile attack whatever is in its reach, with no way back', async (): Promise<void> => {
      const setup = await unitGame('30G', 1, 30, Monarchy),
        { addCity, addUnit, dependencies, game, player, world } = setup,
        rival = new Player(dependencies.ruleRegistry),
        missile = addUnit(Fighter, 20, 0),
        attack = { to: () => world.get(21, 0) } as unknown as Action;

      addCity(0, 0);
      rivalUnit(setup, rival, Warrior, 21, 0);
      game.rules.register(
        new UnitYield(
          new Criterion((unit: Unit): boolean => unit instanceof Fighter),
          new Criterion(
            (unit: Unit, unitYield: Yield): boolean => unitYield instanceof Fuel
          ),
          new Effect((unit: Unit, unitYield: Yield): void => unitYield.set(1))
        ),
        refuelInOwnCity(game.cities)
      );
      missile.moves().set(3);

      // A fighter 20 squares from home with 3 moves can't attack and get back.
      expect(fuelCanReturn(dependencies, player, missile, attack)).false;

      game.rules.register(...unitTraits('test', Fighter, SingleUse));

      // As a missile it is spent in the attack: it only has to reach the target.
      expect(fuelCanReturn(dependencies, player, missile, attack)).true;

      missile.moves().set(0);
      expect(fuelCanReturn(dependencies, player, missile, attack)).false;
    });
  });

  describe('a helicopter', (): void => {
    it('should head back to heal, having no fuel to bring it back', async (): Promise<void> => {
      const setup = await unitGame('30G', 1, 30, Monarchy),
        { addCity, addUnit, dependencies, game, player } = setup,
        helicopter = addUnit(Fighter, 6, 0),
        city = addCity(2, 0);

      game.rules.register(...hitPointsAndFirepower());
      helicopter.setDamage(6);

      // No `Fuel` (a Helicopter's range is 0): it goes to heal like a land unit, to a city with an Airport first.
      expect(fuelFor(dependencies, helicopter)).null;
      expect(healsThisTurn(dependencies, helicopter)).true;
      expect(healingCities(dependencies, player, helicopter)).eql([city]);
    });
  });

  describe('ferries', (): void => {
    it('should use a Carrier as a ferry only where battles are not fought in rounds', async (): Promise<void> => {
      const setup = await unitGame('30O', 1, 30, Monarchy),
        { addUnit, dependencies } = setup,
        carrier = addUnit(Carrier, 0, 0),
        transport = addUnit(Transport, 1, 0);

      // Without a resolver (Civ1), as it always has been: any transport that carries something.
      expect(isFerry(carrier, dependencies.ruleRegistry)).equal(
        carriesUnits(carrier)
      );
      expect(isFerry(transport, dependencies.ruleRegistry)).true;

      fightInRounds(setup);

      // In rounds, only a ship that carries land units.
      expect(isFerry(carrier, dependencies.ruleRegistry)).false;
      expect(isFerryType(Carrier, dependencies.ruleRegistry)).false;
      expect(isFerry(transport, dependencies.ruleRegistry)).true;
      expect(isFerryType(Transport, dependencies.ruleRegistry)).true;
    });
  });
});
