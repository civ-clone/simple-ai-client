import Accept from '@civ-clone/core-diplomacy/Proposal/Accept';
import Alliance from '@civ-clone/base-diplomacy-declaration-alliance/Alliance';
import { ChoiceMeta } from '@civ-clone/core-client/ChoiceMeta';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Decline from '@civ-clone/core-diplomacy/Proposal/Decline';
import DemandTribute from '@civ-clone/library-diplomacy/Proposals/DemandTribute';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Effect from '@civ-clone/core-rule/Effect';
import ExchangeKnowledge from '@civ-clone/library-diplomacy/Proposals/ExchangeKnowledge';
import MilitaryStrength from '@civ-clone/core-power/Rules/MilitaryStrength';
import Never from '@civ-clone/core-diplomacy/Expiries/Never';
import OfferPeace from '@civ-clone/library-diplomacy/Proposals/OfferPeace';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import ProposalAvailable from '@civ-clone/base-diplomacy/Rules/ProposalAvailable';
import ProposeAlliance from '@civ-clone/library-diplomacy/Proposals/ProposeAlliance';
import Terminate from '@civ-clone/core-diplomacy/Negotiation/Terminate';
import Unit from '@civ-clone/core-unit/Unit';
import { Warrior } from '@civ-clone/civ1-unit/Units';
import chooseNegotiationStep from '../lib/Diplomacy/chooseNegotiationStep';
import { expect } from 'chai';
import unitGame from './lib/unitGame';

const step = (Type: { prototype: object }) => Object.create(Type.prototype),
  // An answer to `proposal`.
  answer = (Type: typeof Accept | typeof Decline, proposal: object) =>
    Object.assign(step(Type), { proposal: () => proposal });

// The player (the person the AI speaks for, under Automate) with a city and a Warrior; the computer player it meets
//  with a city and `warriors` Warriors; a third player with a city, at war with both unless `thirdAtPeace`. With
//  `menu`, the rule set gives a person a menu of proposals (`ProposalAvailable`, as Civ2's does).
const setUp = async ({ menu = true, warriors = 3 } = {}) => {
  const setup = await unitGame('25G', 5, 5, Despotism),
    { game, world, player } = setup,
    other = new Player(game.rules),
    third = new Player(game.rules),
    cityOf = (owner: Player, x: number, y: number): City => {
      const city = new City(
        owner,
        world.get(x, y),
        'City',
        game.rules,
        game.workedTiles
      );

      if (!game.cities.includes(city)) {
        game.cities.register(city);
      }

      return city;
    };

  [other, third].forEach((each) => {
    game.players.register(each);
    game.playerWorlds.register(new PlayerWorld(each, world));
  });

  game.rules.register(
    new MilitaryStrength(
      new Criterion((unit: Unit): boolean => unit !== null),
      new Effect((unit: Unit) => ({
        attack: unit.attack().value(),
        defence: unit.defence().value(),
      }))
    )
  );

  if (menu) {
    game.rules.register(new ProposalAvailable(new Effect(() => true)));
  }

  setup.addCity(0, 0);
  setup.addUnit(Warrior, 0, 0);

  const otherCity = cityOf(other, 4, 4);

  cityOf(third, 2, 2);

  for (let i = 0; i < warriors; i++) {
    const warrior = new Warrior(otherCity, other, otherCity.tile(), game.rules);

    if (!game.units.includes(warrior)) {
      game.units.register(warrior);
    }
  }

  return {
    ...setup,
    other,
    sign: (Declaration: typeof Peace) =>
      game.interactions.register(
        new Declaration(player, other, new Never(), game.rules)
      ),
    choose: (...steps: object[]) =>
      chooseNegotiationStep(setup.dependencies, player, {
        choices: () => steps.map((value) => ({ value: () => value })),
        data: () => ({ players: () => [other, player] }),
      } as unknown as ChoiceMeta<'negotiation.next-step'>),
  };
};

describe('a person spoken for in talks with a menu (personTalks)', (): void => {
  it("gives tribute as before where the rule set has no person's menu (Civ1's)", async (): Promise<void> => {
    const { choose } = await setUp({ menu: false, warriors: 0 }),
      demand = step(DemandTribute),
      accept = answer(Accept, demand);

    expect(choose(answer(Decline, demand), accept)).equal(accept);
  });

  it('gives tribute only to a player it feels the weaker of', async (): Promise<void> => {
    const weaker = await setUp({ warriors: 3 }),
      stronger = await setUp({ warriors: 0 }),
      demand = step(DemandTribute),
      accept = answer(Accept, demand),
      decline = answer(Decline, demand);

    expect(weaker.choose(decline, accept)).equal(accept);
    expect(stronger.choose(decline, accept)).equal(decline);
  });

  it('takes peace and an alliance offered', async (): Promise<void> => {
    const { choose } = await setUp(),
      peace = step(OfferPeace),
      accept = answer(Accept, peace);

    expect(choose(answer(Decline, peace), accept)).equal(accept);
  });

  it('offers peace at war, an alliance at peace against an enemy in common, and otherwise leaves', async (): Promise<void> => {
    const atWar = await setUp(),
      alliance = step(ProposeAlliance),
      peace = step(OfferPeace),
      exchange = step(ExchangeKnowledge),
      goodbye = step(Terminate);

    expect(atWar.choose(alliance, peace, goodbye)).equal(peace);

    const atPeace = await setUp();

    atPeace.sign(Peace);

    // The third player is an enemy of both.
    expect(atPeace.choose(alliance, peace, exchange, goodbye)).equal(alliance);

    const allied = await setUp();

    allied.sign(Alliance);

    expect(allied.choose(alliance, peace, goodbye)).equal(goodbye);
    expect(allied.choose(alliance, exchange, goodbye)).equal(exchange);
  });
});
