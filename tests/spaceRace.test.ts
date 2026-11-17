import * as Advances from '@civ-clone/civ1-science/Advances';
import {
  Computers,
  Plastics,
  Robotics,
  Rocketry,
  SpaceFlight,
} from '@civ-clone/civ1-science/Advances';
import {
  requiresAdvance,
  requiresWonder,
} from '@civ-clone/civ1-spaceship/Requirements';
import {
  Fuel,
  Habitation,
  LifeSupport,
  Power,
  Propulsion,
  Structural,
} from '@civ-clone/civ1-spaceship/Parts';
import civ1SpaceRacePolicy, {
  MAXIMUM_STEPS,
  createCiv1SpaceRacePolicy,
  spaceRaceData,
  wantedPart,
} from '../lib/Civ1/spaceRace';
import Advance from '@civ-clone/core-science/Advance';
import { ApolloProgram } from '@civ-clone/civ1-wonder/Wonders';
import Default from '@civ-clone/civ1-default-spaceship-layout/Default';
import { Game } from '@civ-clone/core-game';
import Layout from '@civ-clone/core-spaceship/Layout';
import LayoutRegistry from '@civ-clone/core-spaceship/LayoutRegistry';
import Requirement from '@civ-clone/core-requirement/Requirement';
import registerSpaceship from '@civ-clone/civ1-spaceship/registerRules';
import RequirementRegistry from '@civ-clone/core-requirement/RequirementRegistry';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';
import Part from '@civ-clone/core-spaceship/Part';
import Player from '@civ-clone/core-player/Player';
import PlayerRegistry from '@civ-clone/core-player/PlayerRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Spaceship from '@civ-clone/core-spaceship/Spaceship';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { createVictoryDependencies } from '@civ-clone/base-strategy-victory/lib/VictoryDependencies';
import { directPrerequisites } from '@civ-clone/base-strategy-victory/lib/research';
import { expect } from 'chai';
import requirements from '@civ-clone/civ1-science/Rules/Research/requirements';

// A game's requirements holding `entries`, as a rule set's `registerRules` adds them, describing only.
const requirementsWith = (...entries: Requirement[]): RequirementRegistry => {
  const registry = new RequirementRegistry(new RuleRegistry());

  registry.add(null, ...entries);

  return registry;
};

const civ1Requirements = (): RequirementRegistry =>
  requirementsWith(...requiresWonder, ...requiresAdvance);

// A game's layouts, holding `entries`.
class OtherLayout extends Layout {}

const layouts = (...entries: (typeof Layout)[]): LayoutRegistry => {
  const registry = new LayoutRegistry();

  registry.register(...entries);

  return registry;
};

const part = (PartType: typeof Part): Part =>
  Object.create(PartType.prototype) as Part;

// A ship with these parts, the `inactive` ones not yet joined to the frame.
const ship = (
  active: (typeof Part)[],
  inactive: (typeof Part)[] = [],
  extras: Partial<Spaceship> = {}
) =>
  ({
    activeParts: () => active.map(part),
    inactiveParts: () => inactive.map(part),
    // Room for 20 more Structurals unless said otherwise.
    layout: () => ({
      slots: () =>
        new Array(20).fill({ accepts: () => true, empty: () => true }),
    }),
    ...extras,
  } as unknown as Spaceship);

describe('Civ1 space race', (): void => {
  it("finds Space Flight's prerequisites from civ1-science's rules", (): void => {
    const rules = new RuleRegistry(),
      advances = new AdvanceRegistry();

    advances.register(
      ...(Object.values(Advances) as unknown as (typeof Advance)[])
    );
    rules.register(...requirements());

    expect(directPrerequisites(SpaceFlight, advances, rules)).to.have.members([
      Computers,
      Rocketry,
    ]);
  });

  it('starts the frame, then builds the ship in balanced steps, joining each part to the frame', (): void => {
    expect(wantedPart(ship([]), [])).to.equal(Structural);
    expect(wantedPart(ship([]), [Structural])).to.equal(Habitation);
    expect(wantedPart(ship([Structural]), [])).to.equal(Habitation);
    expect(wantedPart(ship([Structural], [Habitation]), [])).to.equal(
      Structural
    );
    // One Structural for each part not yet joined, before anything else.
    expect(
      wantedPart(ship([Structural], [Habitation, Power]), [Structural])
    ).to.equal(Structural);
    expect(
      wantedPart(ship([Structural], [Habitation, Power]), [
        Structural,
        Structural,
      ])
    ).to.equal(LifeSupport);
    expect(
      wantedPart(ship([Structural, Habitation, LifeSupport]), [Power])
    ).to.equal(Fuel);
    // A Propulsion waits for its Fuel, not for the frame.
    expect(
      wantedPart(ship([Structural, Habitation], [Propulsion]), [])
    ).to.equal(LifeSupport);
    // With no room left in the frame, no more Structurals.
    expect(
      wantedPart(
        ship([Structural], [Habitation], {
          layout: () => ({ slots: () => [] }),
        } as any),
        []
      )
    ).to.equal(LifeSupport);

    const firstStep = [
      Structural,
      Habitation,
      LifeSupport,
      Power,
      Fuel,
      Fuel,
      Propulsion,
    ];

    expect(wantedPart(ship(firstStep), [])).to.equal(Propulsion);
    expect(wantedPart(ship([...firstStep, Propulsion]), [])).to.equal(
      Habitation
    );

    const full = new Array(MAXIMUM_STEPS)
      .fill([
        Habitation,
        LifeSupport,
        Power,
        Fuel,
        Fuel,
        Propulsion,
        Propulsion,
      ])
      .flat();

    expect(wantedPart(ship([Structural, ...full]), [])).to.equal(null);
  });

  describe('launching', (): void => {
    const setUp = (
      chance: number,
      rivalKnowsSpaceFlight: boolean,
      year: number = 1900
    ) => {
      const rules = new RuleRegistry(),
        player = new Player(rules),
        rival = new Player(rules),
        players = new PlayerRegistry();

      players.register(player, rival);

      return civ1SpaceRacePolicy.shouldLaunch(
        createDependencies({
          playerResearchRegistry: {
            getByPlayer: (who: Player) => ({
              completed: (AdvanceType: typeof Advance) =>
                who === rival &&
                rivalKnowsSpaceFlight &&
                AdvanceType === SpaceFlight,
            }),
          } as any,
          ruleRegistry: rules,
        }),
        createVictoryDependencies({
          // No level set plays at King, whose final year is 2040.
          difficulty: { get: () => null } as any,
          playerRegistry: players,
          year: { value: () => year } as any,
        }),
        ship([Structural, Habitation], [], {
          chanceOfSuccess: () => chance,
          flightTime: () => 20,
          launched: () => false,
          player: () => player,
        })
      );
    };

    it("waits while no rival knows Space Flight, and launches a sure ship once one does, as v474.05's AI does", (): void => {
      expect(setUp(1, false)).to.equal(false);
      expect(setUp(1, true)).to.equal(true);
    });

    it('never launches a ship with less than a 40% chance', (): void => {
      expect(setUp(0.3, true)).to.equal(false);
      expect(setUp(0.3, true, 2030)).to.equal(false);
    });

    it('launches without waiting for a rival once it would otherwise arrive within 10 years of the final year', (): void => {
      expect(setUp(1, false, 2009)).to.equal(false);
      expect(setUp(1, false, 2010)).to.equal(true);
    });
  });

  it('wants Space Flight, Plastics and Robotics, and plays for space once it knows Computers', (): void => {
    const dependencies = (
        known: (typeof Advance)[],
        requirementRegistry: RequirementRegistry = civ1Requirements()
      ) =>
        createDependencies({
          requirementRegistry,
          playerResearchRegistry: {
            getByPlayer: () => ({
              completed: (AdvanceType: typeof Advance) =>
                known.includes(AdvanceType),
            }),
          } as any,
        }),
      victory = createVictoryDependencies({
        spaceshipRegistry: { getActiveByPlayer: () => null } as any,
      }),
      player = new Player(new RuleRegistry()),
      policy = createCiv1SpaceRacePolicy(
        undefined,
        undefined,
        layouts(Default)
      );

    expect(policy.advances(dependencies([]), victory, player)).to.eql([
      SpaceFlight,
      Plastics,
      Robotics,
    ]);
    expect(policy.weight(dependencies([]), victory, player)).to.equal(0);
    expect(policy.weight(dependencies([Computers]), victory, player)).to.equal(
      1
    );

    // Without Civ1's parts, it never plays for space, whatever it knows.
    expect(
      policy.weight(
        dependencies([Computers], requirementsWith()),
        victory,
        player
      )
    ).to.equal(0);

    // With Civ1's parts but another ship (Civilization II's, say): never either.
    const elsewhere = createCiv1SpaceRacePolicy(
      undefined,
      undefined,
      layouts(OtherLayout)
    );

    expect(
      elsewhere.advances(dependencies([Computers]), victory, player)
    ).to.eql([]);
    expect(
      elsewhere.weight(dependencies([Computers]), victory, player)
    ).to.equal(0);
  });

  it("takes the enabler and the parts' advances from the rule set's requirements, and only on Civ1's layout", (): void => {
    const requirements = civ1Requirements(),
      civ1 = layouts(Default);

    expect(spaceRaceData(requirements, civ1)).to.eql({
      enablers: [ApolloProgram],
      advances: [SpaceFlight, Plastics, Robotics],
    });
    expect(
      createCiv1SpaceRacePolicy(requirements, undefined, civ1).enablers
    ).to.eql([ApolloProgram]);
    // A layout made from Civ1's counts as Civ1's.
    expect(
      spaceRaceData(requirements, layouts(class extends Default {}))
    ).not.to.equal(null);

    // No enabler: off.
    expect(spaceRaceData(requirementsWith(...requiresAdvance), civ1)).to.equal(
      null
    );
    // No parts at all: off, with no enabler to build.
    expect(
      createCiv1SpaceRacePolicy(requirementsWith(), undefined, civ1).enablers
    ).to.eql([]);

    // A Civilization II-shaped game: the same part classes, each needing an advance, the Apollo Program at world
    //  range, but its own layout, or none yet: off.
    expect(spaceRaceData(requirements, layouts(OtherLayout))).to.equal(null);
    expect(spaceRaceData(requirements, layouts())).to.equal(null);
    expect(
      createCiv1SpaceRacePolicy(requirements, undefined, layouts(OtherLayout))
        .enablers
    ).to.eql([]);

    // Read afresh as the rule set's entries change, a replaced entry included.
    const growing = requirementsWith(...requiresWonder);

    expect(spaceRaceData(growing, civ1)).to.equal(null);

    growing.add(null, ...requiresAdvance);

    expect(spaceRaceData(growing, civ1)?.advances).to.eql([
      SpaceFlight,
      Plastics,
      Robotics,
    ]);

    const [structural] = requiresAdvance;

    growing.replace(
      structural.id,
      new Requirement({
        id: structural.id,
        subject: structural.subject,
        relation: 'requires',
        targets: [Rocketry],
      })
    );

    expect(spaceRaceData(growing, civ1)?.advances).to.include(Rocketry);
  });

  it("plays on civ1-spaceship's own registration, with civ1-default-spaceship-layout's layout", (): void => {
    const game = new Game();

    registerSpaceship(game);
    // As civ1-default-spaceship-layout's plugin does on its game's registry.
    game.layouts.register(Default);

    const policy = createCiv1SpaceRacePolicy(
      game.requirements,
      undefined,
      game.layouts
    );

    expect(policy.enablers).to.eql([ApolloProgram]);
    expect(
      policy.advances(
        createDependencies({ requirementRegistry: game.requirements }),
        createVictoryDependencies(),
        new Player(game.rules)
      )
    ).to.eql([SpaceFlight, Plastics, Robotics]);

    // The same registration without Civ1's layout: off.
    const other = new Game();

    registerSpaceship(other);
    other.layouts.register(OtherLayout);

    expect(
      createCiv1SpaceRacePolicy(other.requirements, undefined, other.layouts)
        .enablers
    ).to.eql([]);
  });

  it('launches by the final year it is given', (): void => {
    const player = new Player(new RuleRegistry()),
      spaceship = {
        chanceOfSuccess: () => 0.5,
        activeParts: () => [],
        inactiveParts: () => [],
        launched: () => false,
        flightTime: () => 15,
        player: () => player,
      } as unknown as Spaceship,
      victory = createVictoryDependencies({
        playerRegistry: { entries: () => [player] } as any,
        year: { value: () => 1990 } as any,
      }),
      dependencies = createDependencies({
        requirementRegistry: civ1Requirements(),
      }),
      launches = (finalYear: number) =>
        createCiv1SpaceRacePolicy(
          civ1Requirements(),
          () => finalYear,
          layouts(Default)
        ).shouldLaunch(dependencies, victory, spaceship);

    // Arriving in 2005: within 10 years of 2010, not of 2020.
    expect(launches(2010)).to.true;
    expect(launches(2020)).to.false;
  });
});
