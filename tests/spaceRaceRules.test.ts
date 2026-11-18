import {
  Computers,
  Plastics,
  Robotics,
  SpaceFlight,
} from '@civ-clone/civ1-science/Advances';
import {
  Fuel,
  Habitation,
  Propulsion,
  Structural,
} from '@civ-clone/civ1-spaceship/Parts';
import {
  createCiv1SpaceRacePolicy,
  playsSpaceRace,
  rulesPlaySpaceRace,
  spaceRaceData,
} from '../lib/Civ1/spaceRace';
import {
  requiresAdvance,
  requiresWonder,
} from '@civ-clone/civ1-spaceship/Requirements';
import AfterTurn from '@civ-clone/core-strategy-ai-client/PlayerActions/AfterTurn';
import { ApolloProgram } from '@civ-clone/civ1-wonder/Wonders';
import ComputerLaunch from '@civ-clone/base-spaceship/lib/Rules/ComputerLaunch';
import ComputerSpaceshipPart from '@civ-clone/base-spaceship/lib/Rules/ComputerSpaceshipPart';
import Criterion from '@civ-clone/core-rule/Criterion';
import Default from '@civ-clone/civ1-default-spaceship-layout/Default';
import Effect from '@civ-clone/core-rule/Effect';
import LaunchSpaceship from '@civ-clone/base-strategy-victory/Strategies/Turn/LaunchSpaceship';
import Layout from '@civ-clone/core-spaceship/Layout';
import LayoutRegistry from '@civ-clone/core-spaceship/LayoutRegistry';
import Part from '@civ-clone/core-spaceship/Part';
import Player from '@civ-clone/core-player/Player';
import Requirement from '@civ-clone/core-requirement/Requirement';
import RequirementRegistry from '@civ-clone/core-requirement/RequirementRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Spaceship from '@civ-clone/core-spaceship/Spaceship';
import civ1Knowledge from '../lib/Civ1/knowledge';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { createVictoryDependencies } from '@civ-clone/base-strategy-victory/lib/VictoryDependencies';
import { expect } from 'chai';

// Civilization II's shape: the same part classes, each needing an advance, the Apollo Program at world range, a
//  layout of its own, and rules for its own computer players' parts and launch.
class OtherLayout extends Layout {}

const requirements = (): RequirementRegistry => {
  const registry = new RequirementRegistry(new RuleRegistry());

  registry.add(
    null,
    ...([...requiresWonder, ...requiresAdvance] as Requirement[])
  );

  return registry;
};

const layouts = (...entries: (typeof Layout)[]): LayoutRegistry => {
  const registry = new LayoutRegistry();

  registry.register(...entries);

  return registry;
};

// Rules answering as `part` and `launch` say, for a ship of `player`'s only.
const rulesFor = (
  part: (available: (typeof Part)[]) => typeof Part | null,
  launch: boolean
): RuleRegistry => {
  const rules = new RuleRegistry();

  rules.register(
    new ComputerSpaceshipPart(
      new Effect((spaceship: Spaceship, available: (typeof Part)[]) =>
        part(available)
      )
    ),
    new ComputerLaunch(new Effect((): boolean => launch))
  );

  return rules;
};

const ship = (player: Player, parts: (typeof Part)[] = []): Spaceship =>
  ({
    activeParts: () =>
      parts.map((PartType) => Object.create(PartType.prototype)),
    inactiveParts: () => [],
    chanceOfSuccess: () => 0.9,
    flightTime: () => 20,
    launched: () => false,
    player: () => player,
  } as unknown as Spaceship);

// A player's research where `known` are known and `available` could be researched now.
const research = (known: unknown[], available: unknown[] = []) =>
  ({
    getByPlayer: () => ({
      completed: (Advance: unknown) => known.includes(Advance),
      available: () => available,
    }),
  } as any);

describe("a rule set's own computer players' space race (base-spaceship ComputerSpaceshipPart, ComputerLaunch)", (): void => {
  it('plays on another layout once the rule set has rules for its computer players, never without', (): void => {
    const rules = rulesFor(() => null, false);

    expect(rulesPlaySpaceRace(rules)).true;
    expect(rulesPlaySpaceRace(new RuleRegistry())).false;
    expect(spaceRaceData(requirements(), layouts(OtherLayout), rules)).to.eql({
      enablers: [ApolloProgram],
      advances: [SpaceFlight, Plastics, Robotics],
    });
    expect(
      spaceRaceData(requirements(), layouts(OtherLayout), new RuleRegistry())
    ).equal(null);
    expect(
      createCiv1SpaceRacePolicy(
        requirements(),
        undefined,
        layouts(OtherLayout),
        rules
      ).enablers
    ).eql([ApolloProgram]);
  });

  it("keeps production's fallback shut to parts there: Civ1's own race is played only on Civ1's layout", (): void => {
    expect(playsSpaceRace(requirements(), layouts(OtherLayout))).false;
    expect(playsSpaceRace(requirements(), layouts(Default))).true;
  });

  it("plays for space once its player could research the first part's advance, or has parts, not on Computers", (): void => {
    const rules = rulesFor(() => null, false),
      policy = createCiv1SpaceRacePolicy(
        requirements(),
        undefined,
        layouts(OtherLayout),
        rules
      ),
      // A player of its own for each question: what it could research is worked out once a turn.
      victory = (player: Player, parts: (typeof Part)[] = []) =>
        createVictoryDependencies({
          spaceshipRegistry: {
            getActiveByPlayer: () =>
              parts.length > 0 ? ship(player, parts) : null,
          } as any,
        }),
      weight = (
        known: unknown[],
        available: unknown[],
        parts: (typeof Part)[] = []
      ) => {
        const player = new Player(rules);

        return policy.weight(
          createDependencies({
            requirementRegistry: requirements(),
            ruleRegistry: rules,
            playerResearchRegistry: research(known, available),
          }),
          victory(player, parts),
          player
        );
      };

    expect(weight([Computers], [])).equal(0);
    expect(weight([Computers], [SpaceFlight])).equal(1);
    expect(weight([SpaceFlight], [])).equal(1);
    expect(weight([], [], [Structural])).equal(1);
  });

  it("builds the part the rule set's rules choose, and nothing when they answer nothing", (): void => {
    const player = new Player(new RuleRegistry()),
      next = (rules: RuleRegistry, available: (typeof Part)[]) =>
        createCiv1SpaceRacePolicy(
          requirements(),
          undefined,
          layouts(OtherLayout),
          rules
        ).nextPart(
          createDependencies({ ruleRegistry: rules }),
          createVictoryDependencies(),
          ship(player),
          available,
          []
        );

    expect(
      next(
        rulesFor((available) => available[available.length - 1], false),
        [Structural, Habitation]
      )
    ).equal(Habitation);
    expect(
      next(
        rulesFor(() => null, false),
        [Structural]
      )
    ).equal(null);

    // A rule that applies to nothing gives no answer: nothing either, not Civ1's steps.
    const silent = new RuleRegistry();

    silent.register(
      new ComputerSpaceshipPart(
        new Criterion((): boolean => false),
        new Effect(() => Structural)
      )
    );

    expect(next(silent, [Structural])).equal(null);
  });

  it("launches as the rule set's rules decide, through LaunchSpaceship, and not when they give no answer", (): void => {
    const player = new Player(new RuleRegistry()),
      launched: Spaceship[] = [],
      attempt = (rules: RuleRegistry): Spaceship[] => {
        const spaceship = {
          ...ship(player, [Structural, Fuel, Propulsion, Habitation]),
          launch: () => launched.push(spaceship),
        } as unknown as Spaceship;

        launched.splice(0);

        new LaunchSpaceship(
          createDependencies({ ruleRegistry: rules }),
          civ1Knowledge,
          createCiv1SpaceRacePolicy(
            requirements(),
            undefined,
            layouts(OtherLayout),
            rules
          ),
          createVictoryDependencies({
            playerRegistry: { entries: () => [player] } as any,
            spaceshipRegistry: { getActiveByPlayer: () => spaceship } as any,
            year: { value: () => 1990 } as any,
          })
        ).attempt(new AfterTurn(player, null as any));

        return launched;
      };

    expect(attempt(rulesFor(() => null, true))).length(1);
    expect(attempt(rulesFor(() => null, false))).length(0);

    const silent = new RuleRegistry();

    silent.register(
      new ComputerSpaceshipPart(new Effect(() => null)),
      new ComputerLaunch(
        new Criterion((): boolean => false),
        new Effect((): boolean => true)
      )
    );

    expect(attempt(silent)).length(0);
  });

  it("leaves Civ1's own race as it was on Civ1's layout, even with such rules", (): void => {
    const rules = rulesFor(() => Habitation, true),
      player = new Player(rules),
      policy = createCiv1SpaceRacePolicy(
        requirements(),
        undefined,
        layouts(Default),
        rules
      ),
      dependencies = createDependencies({
        requirementRegistry: requirements(),
        ruleRegistry: rules,
        playerResearchRegistry: research([], [SpaceFlight]),
      });

    // Civ1's weight: Computers, not Space Flight within reach.
    expect(
      policy.weight(
        dependencies,
        createVictoryDependencies({
          spaceshipRegistry: { getActiveByPlayer: () => null } as any,
        }),
        player
      )
    ).equal(0);
    // Civ1's first step: a Structural to start the frame, not the rules' Habitation.
    expect(
      policy.nextPart(
        dependencies,
        createVictoryDependencies(),
        {
          ...ship(player),
          layout: () => ({
            slots: () =>
              new Array(20).fill({ accepts: () => true, empty: () => true }),
          }),
        } as unknown as Spaceship,
        [Structural, Habitation],
        []
      )
    ).equal(Structural);
  });
});
