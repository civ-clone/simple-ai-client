import civ1ConquestPolicy, {
  CONQUEST_WEIGHT,
  MUSTER_ATTACKERS,
  MUSTER_WAIT,
} from '../lib/Civ1/conquest';
import { CityWalls } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Land } from '@civ-clone/library-unit/Types';
import MilitaryStrength from '@civ-clone/core-power/Rules/MilitaryStrength';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import { createDependencies } from '@civ-clone/base-strategy-ai/lib/Dependencies';
import { createVictoryDependencies } from '@civ-clone/base-strategy-victory/lib/VictoryDependencies';
import { expect } from 'chai';

// A land unit of `player`'s, an attacker unless its defence is at least its attack.
const unit = (
  player: Player,
  attack: number,
  defence: number,
  busy: unknown = null
): Unit =>
  Object.assign(Object.create(Land.prototype), {
    attack: () => ({ value: () => attack }),
    busy: () => busy,
    defence: () => ({ value: () => defence }),
    player: () => player,
  });

const setUp = ({
  attackers,
  defenders,
  fortified = 0,
  walls = false,
}: {
  attackers: number;
  defenders: number;
  fortified?: number;
  walls?: boolean;
}) => {
  const rules = new RuleRegistry(),
    player = new Player(rules),
    rival = new Player(rules),
    musterTile = {},
    targetTile = {},
    muster: any = { tile: () => musterTile },
    target: any = { tile: () => targetTile },
    units = new Map<object, Unit[]>([
      [
        musterTile,
        [
          ...new Array(attackers).fill(null).map(() => unit(player, 3, 1)),
          ...new Array(fortified)
            .fill(null)
            .map(() => unit(player, 3, 1, 'Fortified')),
        ],
      ],
      [
        targetTile,
        new Array(defenders).fill(null).map(() => unit(rival, 1, 2)),
      ],
    ]);

  let turn = 1;

  rules.register(
    new MilitaryStrength(
      new Criterion((unit: Unit): boolean => unit !== null),
      new Effect((unit: Unit) => ({
        attack: unit.attack().value(),
        defence: unit.defence().value(),
      }))
    )
  );

  const dependencies = createDependencies({
      cityImprovementRegistry: {
        getByCity: () => (walls ? [Object.create(CityWalls.prototype)] : []),
      } as any,
      ruleRegistry: rules,
      turn: { value: () => turn } as any,
      unitRegistry: {
        getByTile: (tile: object) => units.get(tile) ?? [],
      } as any,
    }),
    victory = createVictoryDependencies();

  return {
    mustered: () =>
      civ1ConquestPolicy.mustered(
        dependencies,
        victory,
        player,
        target,
        muster
      ),
    nextTurn: () => turn++,
  };
};

describe('Civ1 conquest', (): void => {
  it(`goes with ${MUSTER_ATTACKERS} attackers with twice the attack of the target's defence`, (): void => {
    expect(setUp({ attackers: 2, defenders: 1 }).mustered()).to.equal(false);
    expect(setUp({ attackers: 3, defenders: 1 }).mustered()).to.equal(true);
    expect(setUp({ attackers: 3, defenders: 3 }).mustered()).to.equal(false);
  });

  it("doesn't count the attackers fortified in the muster city as its garrison", (): void => {
    expect(
      setUp({ attackers: 1, defenders: 0, fortified: 2 }).mustered()
    ).to.equal(false);
  });

  it('counts City Walls as tripling the defence', (): void => {
    expect(setUp({ attackers: 3, defenders: 1 }).mustered()).to.equal(true);
    expect(
      setUp({ attackers: 3, defenders: 1, walls: true }).mustered()
    ).to.equal(false);
  });

  it(`goes with ${MUSTER_ATTACKERS} attackers, however strong the defence, once it has waited ${MUSTER_WAIT} turns`, (): void => {
    const { mustered, nextTurn } = setUp({ attackers: 3, defenders: 5 });

    for (let turn = 0; turn < MUSTER_WAIT; turn++) {
      expect(mustered()).to.equal(false);
      nextTurn();
    }

    expect(mustered()).to.equal(true);
  });

  describe('weight', (): void => {
    // `player` holding `ours` of the world's standing cities, beside `theirs`, and `razed` destroyed ones still in the
    //  registry; with no sites left to settle.
    const weightAt = (ours: number, theirs: number, razed: number = 0) => {
      const rules = new RuleRegistry(),
        player = new Player(rules),
        city = (destroyed: boolean) => ({
          destroyed: () => destroyed,
          tile: () => ({ getNeighbours: () => [], isLand: () => true }),
        }),
        own = new Array(ours).fill(null).map(() => city(false)),
        cities = [
          ...own,
          ...new Array(theirs).fill(null).map(() => city(false)),
          ...new Array(razed).fill(null).map(() => city(true)),
        ];

      return civ1ConquestPolicy.weight(
        createDependencies({
          cityRegistry: {
            entries: () => cities,
            getByPlayer: () => own,
          } as any,
          memoryRegistry: {
            memoryFor: () => ({ targets: { goodSitesForCities: [] } }),
          } as any,
          turn: { value: () => 1 } as any,
        }),
        createVictoryDependencies(),
        player
      );
    };

    it("rises from nothing at half the world's cities to its full weight at three quarters, passing the space race's 1 half way", (): void => {
      expect(weightAt(5, 5)).to.equal(0);
      expect(weightAt(5, 3)).to.equal(1);
      expect(weightAt(3, 1)).to.equal(CONQUEST_WEIGHT);
      expect(weightAt(9, 1)).to.equal(CONQUEST_WEIGHT);
      expect(weightAt(2, 8)).to.equal(0);
    });

    it('counts only the cities still standing', (): void => {
      expect(weightAt(3, 1, 10)).to.equal(CONQUEST_WEIGHT);
    });
  });
});
