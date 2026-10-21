import * as Advances from '@civ-clone/civ1-science/Advances';
import {
  Computers,
  Robotics,
  Rocketry,
  SpaceFlight,
} from '@civ-clone/civ1-science/Advances';
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
  wantedPart,
} from '../lib/Civ1/spaceRace';
import Advance from '@civ-clone/core-science/Advance';
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
    const dependencies = (known: (typeof Advance)[]) =>
        createDependencies({
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
      player = new Player(new RuleRegistry());

    expect(
      civ1SpaceRacePolicy.advances(dependencies([]), victory, player)
    ).to.include(Robotics);
    expect(
      civ1SpaceRacePolicy.weight(dependencies([]), victory, player)
    ).to.equal(0);
    expect(
      civ1SpaceRacePolicy.weight(dependencies([Computers]), victory, player)
    ).to.equal(1);
  });
});
