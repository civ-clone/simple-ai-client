import {
  EstablishEmbassy,
  EstablishTradeRoute,
  HelpBuildWonder,
  IndustrialSabotage,
  InciteRevolt,
  InvestigateCity,
  SneakStealTechnology,
  StealTechnology,
  SubvertCity,
} from '@civ-clone/library-unit/Actions';
import { Caravan, Diplomat } from '@civ-clone/civ1-unit/Units';
import {
  isEnvoy,
  missionFor,
  missionTarget,
  REFUSAL_TURNS,
  TRADE_TARGETS,
  missionsChosen,
  refuseTarget,
  refusedTarget,
  routeFor,
  routePartner,
  tradeRoutesMatter,
  tradeTargets,
  wantsAgent,
  wantsTrader,
} from '../lib/Unit/envoys';
import unitGame, { UnitGame } from './lib/unitGame';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Effect from '@civ-clone/core-rule/Effect';
import MissionChoice from '@civ-clone/base-unit-agent/Rules/MissionChoice';
import Never from '@civ-clone/core-diplomacy/Expiries/Never';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import PoisonWater from '@civ-clone/base-unit-action-poison-water/PoisonWater';
import TradeRouteLimit from '@civ-clone/base-city-trade-route/Rules/TradeRouteLimit';
import Envoys from '../Strategies/Unit/Envoys';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { expect } from 'chai';

// Only the class matters to the choice, so the actions are made without running their constructors.
const offer = (...types: Function[]): Action[] =>
    types.map((Type) => Object.create(Type.prototype) as Action),
  // A trade route that would break a treaty: any action with an `enemy()`.
  sneaky = (Type: Function): Action =>
    Object.assign(Object.create(Type.prototype), {
      enemy: () => null,
    }) as Action;

type Setup = UnitGame & {
  other: Player;
  otherCity: City;
  home: City;
};

// The player's city at (0, 0), another of its own at (4, 0), and another player's city at (9, 0), on one landmass.
const setUp = async (): Promise<Setup> => {
  const setup = await unitGame('200G', 10, 20, Despotism),
    { game, world } = setup,
    other = new Player(game.rules);

  game.players.register(other);
  game.playerWorlds.register(new PlayerWorld(other, world));

  const home = setup.addCity(0, 0, 3);

  setup.addCity(4, 0, 3);

  const otherCity = new City(
    other,
    world.get(9, 0),
    'Other',
    game.rules,
    game.workedTiles
  );

  if (!game.cities.includes(otherCity)) {
    game.cities.register(otherCity);
  }

  const otherGrowth = game.cityGrowth.getByCity(otherCity);

  while (otherGrowth.size() < 3) {
    otherGrowth.grow();
  }

  return { ...setup, other, otherCity, home };
};

describe('envoys (Civ2 M2d part 2)', function (): void {
  this.timeout(20000);

  it('sends nothing on purpose in a ruleset with no route limit and no mission choice (Civ1)', async (): Promise<void> => {
    const { addUnit, dependencies, game, home } = await setUp(),
      caravan = addUnit(Caravan, 1, 0, home),
      diplomat = addUnit(Diplomat, 1, 0, home);

    expect(tradeRoutesMatter(game.rules)).to.false;
    expect(missionsChosen(game.rules)).to.false;
    expect(isEnvoy(dependencies, caravan)).to.false;
    expect(isEnvoy(dependencies, diplomat)).to.false;
    expect(wantsTrader(dependencies, caravan.player(), home, 0)).to.false;
    expect(wantsAgent(dependencies, caravan.player(), home, 0, 0)).to.false;
    expect(missionFor(dependencies, diplomat, home, offer(StealTechnology))).to
      .null;

    game.rules.register(new TradeRouteLimit(new Effect((): number => 3)));
    expect(isEnvoy(dependencies, caravan)).to.true;
    expect(isEnvoy(dependencies, diplomat)).to.false;

    game.rules.register(
      new MissionChoice(new Effect((): undefined => undefined))
    );
    expect(isEnvoy(dependencies, diplomat)).to.true;
  });

  describe('Caravans (item 1)', (): void => {
    it('sets up a route, never helps build a Wonder, and never takes a row that breaks a treaty', (): void => {
      const [route] = offer(EstablishTradeRoute);

      expect(routeFor([...offer(HelpBuildWonder), route]) === route).to.true;
      expect(routeFor(offer(HelpBuildWonder))).to.null;
      expect(routeFor([sneaky(EstablishTradeRoute)])).to.null;
    });

    it('goes to the best partner: never its home, a foreign city before a nearer own one', async (): Promise<void> => {
      const { addUnit, dependencies, home, otherCity, player } = await setUp(),
        caravan = addUnit(Caravan, 1, 0, home);

      expect(routePartner(dependencies, player, caravan)?.name()).to.equal(
        otherCity.name()
      );
      expect(routePartner(dependencies, player, caravan, [home])).to.equal(
        null
      );
    });

    it('is built where routes matter, from a city with a route to spare and none of its own out', async (): Promise<void> => {
      const { dependencies, game, home, player } = await setUp();

      game.rules.register(new TradeRouteLimit(new Effect((): number => 3)));
      expect(wantsTrader(dependencies, player, home, 0)).to.true;
      expect(wantsTrader(dependencies, player, home, 1)).to.false;

      game.rules.register(new TradeRouteLimit(new Effect((): number => 0)));
      // The highest limit answers.
      expect(wantsTrader(dependencies, player, home, 0)).to.true;
    });
  });

  describe('Diplomats and Spies (item 2)', (): void => {
    const choosing = (game: UnitGame['game'], names: string[]): number[] => {
      const asked = [0];

      game.rules.register(
        new MissionChoice(
          new Effect((): string => {
            asked[0]++;

            return names.shift()!;
          })
        )
      );

      return asked;
    };

    it('carries out the mission the ruleset chooses, asking once', async (): Promise<void> => {
      const { addUnit, dependencies, game, home, otherCity } = await setUp(),
        diplomat = addUnit(Diplomat, 8, 0, home),
        asked = choosing(game, [
          'steal-technology',
          'poison-water',
          'incite-revolt',
          'industrial-sabotage',
        ]),
        all = offer(
          StealTechnology,
          EstablishEmbassy,
          InvestigateCity,
          IndustrialSabotage,
          PoisonWater,
          InciteRevolt
        );

      [StealTechnology, PoisonWater, InciteRevolt, IndustrialSabotage].forEach(
        (Type: Function, i: number): void => {
          const action = missionFor(dependencies, diplomat, otherCity, all);

          expect(action?.constructor === Type).to.true;
          expect(asked[0]).to.equal(i + 1);
        }
      );
    });

    it("falls back as the original does when the chosen mission isn't offered", async (): Promise<void> => {
      const { addUnit, dependencies, game, home, other, otherCity, player } =
          await setUp(),
        diplomat = addUnit(Diplomat, 8, 0, home);

      choosing(game, [
        'steal-technology',
        'incite-revolt',
        'establish-embassy',
        'steal-technology',
      ]);

      // Nothing to steal: a sabotage.
      expect(
        missionFor(
          dependencies,
          diplomat,
          otherCity,
          offer(EstablishEmbassy, IndustrialSabotage)
        )?.constructor === IndustrialSabotage
      ).to.true;
      // Can't pay to incite: a theft.
      expect(
        missionFor(
          dependencies,
          diplomat,
          otherCity,
          offer(StealTechnology, IndustrialSabotage)
        )?.constructor === StealTechnology
      ).to.true;
      // An embassy there already: an investigation.
      expect(
        missionFor(
          dependencies,
          diplomat,
          otherCity,
          offer(InvestigateCity, IndustrialSabotage)
        )?.constructor === InvestigateCity
      ).to.true;

      // Under a treaty, nothing to steal: an embassy.
      game.interactions.register(
        new Peace(player, other, new Never(), game.rules)
      );
      expect(
        missionFor(
          dependencies,
          diplomat,
          otherCity,
          offer(EstablishEmbassy, IndustrialSabotage)
        )?.constructor === EstablishEmbassy
      ).to.true;
    });

    it('goes for a city of a player it has no treaty with, and is built only while one is on its land', async (): Promise<void> => {
      const { addUnit, dependencies, game, home, other, otherCity, player } =
          await setUp(),
        diplomat = addUnit(Diplomat, 1, 0, home);

      game.rules.register(
        new MissionChoice(new Effect((): undefined => undefined))
      );

      expect(missionTarget(dependencies, player, diplomat)?.name()).to.equal(
        otherCity.name()
      );
      expect(wantsAgent(dependencies, player, home, 0, 0)).to.true;
      expect(wantsAgent(dependencies, player, home, 0, 1)).to.false;
      expect(wantsAgent(dependencies, player, home, 2, 0)).to.false;

      game.interactions.register(
        new Peace(player, other, new Never(), game.rules)
      );

      expect(missionTarget(dependencies, player, diplomat) === null).to.true;
      expect(wantsAgent(dependencies, player, home, 0, 0)).to.false;
    });
  });

  describe('treaty-breaking rows (item 3)', (): void => {
    it('never takes a Sneak or Subvert row, whatever the ruleset chooses', async (): Promise<void> => {
      const { addUnit, dependencies, game, home, otherCity } = await setUp(),
        diplomat = addUnit(Diplomat, 8, 0, home);

      game.rules.register(
        new MissionChoice(new Effect((): string => 'steal-technology')),
        new MissionChoice(
          new Criterion((): boolean => false),
          new Effect((): string => 'never asked')
        )
      );

      expect(
        missionFor(dependencies, diplomat, otherCity, [
          sneaky(SneakStealTechnology),
        ])
      ).to.null;
      expect(
        missionFor(dependencies, diplomat, otherCity, [
          sneaky(StealTechnology),
          ...offer(SubvertCity),
        ])
      ).to.null;
    });
  });
});

describe('envoys, after review', function (): void {
  this.timeout(20000);

  // `unit`'s turn, as the strategy registry hands it over.
  const turnOf = (unit: Unit): PlayerAction<Unit> =>
    Object.assign(Object.create(PlayerAction.prototype), {
      player: () => unit.player(),
      value: () => unit,
    }) as PlayerAction<Unit>;

  it('asks the ruleset for a mission at most once in an attempt, and drops a target once it signs a treaty', async (): Promise<void> => {
    const { addUnit, dependencies, game, home, other, player } = await setUp(),
      diplomat = addUnit(Diplomat, 8, 0, home),
      envoys = new Envoys(dependencies, civ1Knowledge),
      asked = [0];

    // A choice the ruleset can't carry out here, so the Diplomat looks again after its first look.
    game.rules.register(
      new MissionChoice(
        new Effect((): undefined => {
          asked[0]++;

          return undefined;
        })
      )
    );

    expect(await envoys.attempt(turnOf(diplomat))).to.true;
    expect(asked[0]).to.equal(1);

    game.interactions.register(
      new Peace(player, other, new Never(), game.rules)
    );

    expect(await envoys.attempt(turnOf(diplomat))).to.false;
    expect(asked[0]).to.equal(1);
  });

  it('never goes for a destroyed city, which the registry still lists', async (): Promise<void> => {
    const { addUnit, dependencies, home, otherCity, player } = await setUp(),
      caravan = addUnit(Caravan, 1, 0, home),
      diplomat = addUnit(Diplomat, 8, 0, home);

    otherCity.destroy();

    expect(
      routePartner(dependencies, player, caravan)?.name() ?? null
    ).to.not.equal(otherCity.name());
    expect(missionTarget(dependencies, player, diplomat) === null).to.true;
  });

  it('gives up on a target for a while only', async (): Promise<void> => {
    const { addUnit, dependencies, game, home, otherCity } = await setUp(),
      caravan = addUnit(Caravan, 1, 0, home);

    expect(refusedTarget(dependencies, caravan, otherCity)).to.false;

    refuseTarget(dependencies, caravan, otherCity);
    expect(refusedTarget(dependencies, caravan, otherCity)).to.true;

    for (let i = 0; i < REFUSAL_TURNS; i++) {
      game.turn.increment();
    }

    expect(refusedTarget(dependencies, caravan, otherCity)).to.false;
  });

  it('looks overseas only at the best few cities on other land, leaving out any it gave up on', async (): Promise<void> => {
    // Two landmasses, x 0–8 and 10–18, with water at 9 and 19.
    const setup = await unitGame('9G1O9G1O'.repeat(10), 10, 20, Despotism),
      { addCity, addUnit, dependencies, game, player, world } = setup,
      other = new Player(game.rules);

    game.players.register(other);
    game.playerWorlds.register(new PlayerWorld(other, world));

    const home = addCity(0, 0, 3);

    addCity(4, 0, 3);

    const overseas = [
      [12, 0],
      [14, 4],
      [16, 8],
      [12, 6],
    ].map(([x, y]): City => {
      const city = new City(
        other,
        world.get(x, y),
        `Other ${x},${y}`,
        game.rules,
        game.workedTiles
      );

      if (!game.cities.includes(city)) {
        game.cities.register(city);
      }

      return city;
    });

    const caravan = addUnit(Caravan, 1, 0, home),
      targets = tradeTargets(dependencies, player, caravan);

    expect(targets.length).to.equal(TRADE_TARGETS);
    expect(
      targets.every((tile): boolean =>
        overseas.some((city: City): boolean => city.tile() === tile)
      )
    ).to.true;

    overseas.forEach((city: City): void =>
      refuseTarget(dependencies, caravan, city)
    );
    expect(tradeTargets(dependencies, player, caravan).length).to.equal(0);
  });
});
