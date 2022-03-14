import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import Criterion from '@civ-clone/core-rule/Criterion';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Effect from '@civ-clone/core-rule/Effect';
import SimpleAIClient from '../../SimpleAIClient';
import Unit from '@civ-clone/core-unit/Unit';

export const getRules: (
  unitRegistry?: UnitRegistry,
  clientRegistry?: ClientRegistry
) => Defeated[] = (
  unitRegistry: UnitRegistry = unitRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance
): Defeated[] => [
  new Defeated(
    new Criterion(
      (unit: Unit) =>
        clientRegistry.getByPlayer(unit.player()) instanceof SimpleAIClient
    ),
    new Effect((unit: Unit, by: Unit | null): void =>
      (
        clientRegistry.getByPlayer(unit.player()) as SimpleAIClient
      ).unitDestroyed(unit, by && by.player())
    )
  ),
];

export default getRules;
